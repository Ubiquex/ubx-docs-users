#!/usr/bin/env bash
#
# Creates the three resources that could not be created from the agent
# session: the CloudFront distribution, the IAM deploy role, and the ACM
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

echo "== 1. CloudFront distribution =="
DIST_ID="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?starts_with(Comment, 'ubx-docs-users')].Id | [0]" \
  --output text 2>/dev/null || echo None)"

if [ "$DIST_ID" = "None" ] || [ -z "$DIST_ID" ]; then
  read -r DIST_ID DIST_DOMAIN <<<"$(aws cloudfront create-distribution \
    --distribution-config file://infra/cloudfront/distribution.json \
    --query 'Distribution.[Id,DomainName]' --output text)"
  echo "   created $DIST_ID ($DIST_DOMAIN)"
else
  DIST_DOMAIN="$(aws cloudfront get-distribution --id "$DIST_ID" \
    --query 'Distribution.DomainName' --output text)"
  echo "   already exists: $DIST_ID ($DIST_DOMAIN)"
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
echo "   applied"

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
grep -q REPLACE_ME /tmp/ubx-docs-users-deploy-policy.json && {
  echo "placeholder substitution failed" >&2; exit 1; }
aws iam put-role-policy --role-name "$ROLE" \
  --policy-name "$ROLE" \
  --policy-document file:///tmp/ubx-docs-users-deploy-policy.json
echo "   inline policy attached, scoped to $DIST_ID and $BUCKET"

echo "== 4. ACM certificate =="
CERT_ARN="$(aws acm list-certificates --region "$REGION" \
  --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" \
  --output text 2>/dev/null || echo None)"

if [ "$CERT_ARN" = "None" ] || [ -z "$CERT_ARN" ]; then
  CERT_ARN="$(aws acm request-certificate --region "$REGION" \
    --domain-name "$DOMAIN" --validation-method DNS \
    --query CertificateArn --output text)"
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
