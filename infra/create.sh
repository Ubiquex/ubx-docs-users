#!/usr/bin/env bash
#
# Creates the CloudFront distribution, the IAM deploy role and the ACM
# certificate. Run it once, from the repo root, with credentials for
# account 839333509514.
#
#   ./infra/create.sh
#
# WHY THIS IS A SCRIPT AND NOT A LIST OF COMMANDS IN A COMMENT. The
# ordering carries real dependencies: the bucket policy names the
# distribution ARN and the deploy role's policy names the distribution
# ID, so both have to wait for the distribution and both need an ID
# copied into them. Hand-copying an ID between six commands is exactly
# where a typo produces a policy that looks right and grants nothing.
# This also keeps the infra rule the provider site learned the hard way:
# nothing that shapes production lives only in a shell history.
#
# Safe to re-run. Every step looks up what it would create first and
# skips it if present. That lookup is the whole of the idempotency: do
# not rely on the CallerReference in distribution.json for it, since
# CloudFront errors on a reused reference with changed config rather
# than returning the existing distribution.
#
# It deliberately does NOT touch DNS. docs.ubiquex.io is live on
# Mintlify, and repointing it is the last step, after the new site has
# been confirmed serving on its own CloudFront domain.
#
# THE FIRST VERSION OF THIS SCRIPT HAD A REAL BUG, and the guards below
# exist because of it rather than on principle. create-distribution
# failed ("The parameter Comment is too big"), and the script carried on
# and applied both the bucket policy and the role policy naming an empty
# distribution ID. Neither granted anything, since a condition on
# ".../distribution/" matches nothing, but both were silently wrong and
# would have failed at deploy time with no obvious cause.
#
# It happened because the create ran inside `read -r A B <<<"$(cmd)"`.
# `set -e` does not fire there: the command that "runs" is `read`, which
# succeeds on empty input, so a failed create becomes two empty variables
# and execution continues. Command substitution nested inside another
# command is a blind spot for `set -e`, so every fallible call below runs
# as its own statement with its status checked explicitly, and the
# distribution ID is validated before anything may reference it.

set -euo pipefail

ACCOUNT=839333509514
BUCKET=ubx-docs-users-site
ROLE=ubx-docs-users-deploy
DOMAIN=docs.ubiquex.io
REGION=us-east-1

cd "$(dirname "$0")/.."

have_account="$(aws sts get-caller-identity --query Account --output text)"
if [ "$have_account" != "$ACCOUNT" ]; then
  echo "wrong AWS account: got $have_account, expected $ACCOUNT" >&2
  exit 1
fi

echo "== 0. Preflight on the committed distribution config =="
# CloudFront caps Comment at 128 characters and rejects the entire call
# if it is longer. That is what broke the first run, and the error only
# arrives after a round trip, so it is checked here against the committed
# file before anything is created.
comment_len="$(python3 -c "import json;print(len(json.load(open('infra/cloudfront/distribution.json'))['Comment']))")"
if [ "$comment_len" -gt 128 ]; then
  echo "distribution.json Comment is $comment_len chars, CloudFront's limit is 128" >&2
  exit 1
fi
echo "   Comment is $comment_len chars, within the 128 limit"

echo "== 1. CloudFront distribution =="
DIST_ID="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?starts_with(Comment, 'ubx-docs-users')].Id | [0]" \
  --output text 2>/dev/null || echo None)"

if [ "$DIST_ID" = "None" ] || [ -z "$DIST_ID" ]; then
  # Its own statement, status checked. See the note at the top for why
  # this must not be wrapped in a command substitution.
  if ! created="$(aws cloudfront create-distribution \
      --distribution-config file://infra/cloudfront/distribution.json \
      --query 'Distribution.[Id,DomainName]' --output text)"; then
    echo "create-distribution failed, stopping before anything references it" >&2
    exit 1
  fi
  read -r DIST_ID DIST_DOMAIN <<<"$created"
  echo "   created $DIST_ID ($DIST_DOMAIN)"
else
  if ! DIST_DOMAIN="$(aws cloudfront get-distribution --id "$DIST_ID" \
      --query 'Distribution.DomainName' --output text)"; then
    echo "could not read the existing distribution $DIST_ID" >&2
    exit 1
  fi
  echo "   already exists: $DIST_ID ($DIST_DOMAIN)"
fi

# The gate. Everything past this point writes a policy naming this ID, so
# an empty or malformed one must stop the script rather than propagate.
# CloudFront distribution IDs are uppercase alphanumeric beginning with E.
case "$DIST_ID" in
  E[A-Z0-9]*) ;;
  *)
    echo "refusing to continue: '$DIST_ID' is not a CloudFront distribution id" >&2
    exit 1
    ;;
esac
if [ -z "$DIST_DOMAIN" ]; then
  echo "refusing to continue: distribution domain is empty" >&2
  exit 1
fi

echo "== 2. Bucket policy, granting read to that distribution alone =="
# Not a blanket public-read. The bucket stays fully private and this
# condition is what lets exactly one distribution read it.
cat > /tmp/ubx-docs-users-bucket-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$BUCKET/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT:distribution/$DIST_ID"
      }
    }
  }]
}
JSON
aws s3api put-bucket-policy --bucket "$BUCKET" \
  --policy file:///tmp/ubx-docs-users-bucket-policy.json
echo "   applied, scoped to $DIST_ID"

echo "== 3. IAM deploy role =="
if aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  echo "   already exists"
else
  aws iam create-role --role-name "$ROLE" \
    --assume-role-policy-document file://infra/iam/trust-policy.json \
    --description "GitHub Actions OIDC deploy role for ubx-docs-users (UBI-247)" >/dev/null
  echo "   created"
fi

# The committed policy carries a placeholder because the distribution ID
# is not knowable until step 1. Substituted here rather than committed,
# so the repo never holds a half-real policy.
sed "s/REPLACE_ME_DISTRIBUTION_ID/$DIST_ID/" infra/iam/deploy-policy.json \
  > /tmp/ubx-docs-users-deploy-policy.json
if grep -q REPLACE_ME /tmp/ubx-docs-users-deploy-policy.json; then
  echo "placeholder substitution failed" >&2
  exit 1
fi
aws iam put-role-policy --role-name "$ROLE" \
  --policy-name "$ROLE" \
  --policy-document file:///tmp/ubx-docs-users-deploy-policy.json
echo "   inline policy attached, scoped to $DIST_ID and $BUCKET"

echo "== 4. ACM certificate =="
CERT_ARN="$(aws acm list-certificates --region "$REGION" \
  --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" \
  --output text 2>/dev/null || echo None)"

if [ "$CERT_ARN" = "None" ] || [ -z "$CERT_ARN" ]; then
  if ! CERT_ARN="$(aws acm request-certificate --region "$REGION" \
      --domain-name "$DOMAIN" --validation-method DNS \
      --query CertificateArn --output text)"; then
    echo "request-certificate failed" >&2
    exit 1
  fi
  echo "   requested $CERT_ARN"
  # ACM populates the validation record asynchronously.
  for _ in $(seq 1 12); do
    rr="$(aws acm describe-certificate --region "$REGION" --certificate-arn "$CERT_ARN" \
      --query 'Certificate.DomainValidationOptions[0].ResourceRecord' --output json)"
    [ "$rr" != "null" ] && break
    sleep 5
  done
else
  echo "   already requested: $CERT_ARN"
fi

echo
echo "================ what to do next ================"
echo
echo "Add this CNAME at name.com:"
aws acm describe-certificate --region "$REGION" --certificate-arn "$CERT_ARN" \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord' --output table
echo
echo "Then send these three values back so deploy.yml's placeholders can be filled:"
echo
echo "  DISTRIBUTION_ID  $DIST_ID"
echo "  DEPLOY_ROLE      arn:aws:iam::$ACCOUNT:role/$ROLE"
echo "  CLOUDFRONT_HOST  $DIST_DOMAIN"
echo
echo "The certificate and the docs.ubiquex.io alias get attached after"
echo "validation completes. DNS for docs.ubiquex.io is NOT touched by"
echo "this script: it still points at Mintlify, and stays there until the"
echo "new site is confirmed serving on $DIST_DOMAIN."
