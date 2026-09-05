# infra

Infrastructure for the deployed site that is not expressible as
application code. AWS account `839333509514`, us-east-1.

This mirrors `ubx-docs-providers/infra`, which exists because it did not:
that site's CloudFront Function was created directly with the CLI and
lived only in AWS, shipped with a bug that 404'd every version landing
page, and because the source was in no repository the bug was never
reviewable and the fix was never version controlled. Everything here is
committed before it is applied.

## Status

Partially created. **This is not deployed yet.**

| Resource | Identifier | State |
|---|---|---|
| S3 bucket | `ubx-docs-users-site` | created |
| Origin Access Control | `E3VO6LIHTNN70Q` | created |
| CloudFront Function | `ubx-docs-users-rewrite` | created, **published to LIVE** |
| CloudFront distribution | see below | **not created** |
| ACM certificate (us-east-1) | for `docs.ubiquex.io` | **not requested** |
| IAM deploy role | `ubx-docs-users-deploy` | **not created** |
| Bucket policy | conditioned on the distribution ARN | **not applied** |

The bucket blocks all public access and has default AES256 encryption.
It is not an S3 website endpoint, which is what makes Origin Access
Control usable at all. It is currently unreadable by anything, which is
correct until the distribution exists to grant read to.

`deploy.yml` refuses to run while `DISTRIBUTION_ID` and `DEPLOY_ROLE`
are placeholders, rather than failing deep inside the AWS CLI or
deploying somewhere unintended.

## Remaining steps

Each is a single command. They must run in this order: the bucket policy
names the distribution ARN, and the deploy policy names the distribution
ID.

### 1. The distribution

```
aws cloudfront create-distribution \
  --distribution-config file://infra/cloudfront/distribution.json
```

`distribution.json` is the exact config, already carrying the real OAC
ID and the real function ARN. Record the returned `Id` and `DomainName`.

### 2. The bucket policy, granting read to that distribution alone

```
DIST_ID=<the Id from step 1>
cat > /tmp/bucket-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::ubx-docs-users-site/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::839333509514:distribution/$DIST_ID"
      }
    }
  }]
}
JSON
aws s3api put-bucket-policy --bucket ubx-docs-users-site \
  --policy file:///tmp/bucket-policy.json
```

### 3. The IAM deploy role

`trust-policy.json` carries both subject forms. The second is the
immutable one (`repo:Ubiquex@232584184/ubx-docs-users@1358377574:*`),
using this repo's real numeric ID rather than a wildcard. On the
provider site, a trust policy written with only the first form failed
with `Not authorized to perform sts:AssumeRoleWithWebIdentity` because
that org has immutable subject claims enabled.

```
aws iam create-role --role-name ubx-docs-users-deploy \
  --assume-role-policy-document file://infra/iam/trust-policy.json

# fill REPLACE_ME_DISTRIBUTION_ID in deploy-policy.json first
aws iam put-role-policy --role-name ubx-docs-users-deploy \
  --policy-name ubx-docs-users-deploy \
  --policy-document file://infra/iam/deploy-policy.json
```

### 4. Fill in `deploy.yml`

Replace `REPLACE_ME_DISTRIBUTION_ID` and `REPLACE_ME_ROLE_ARN` in
`.github/workflows/deploy.yml`, and `REPLACE_ME_DISTRIBUTION_ID` in
`.github/workflows/function-publish.yml` and
`infra/iam/deploy-policy.json`.

### 5. Deploy and verify on the CloudFront domain, before any DNS change

Push to `main`, or dispatch `deploy`. The workflow's own last step
fetches real pages through CloudFront and fails if they do not serve.
Verify by hand too:

```
curl -sI https://<DomainName>/concepts | head -1
curl -sI https://<DomainName>/tutorial/sdk/install | head -1
```

### 6. The certificate

```
aws acm request-certificate --region us-east-1 \
  --domain-name docs.ubiquex.io --validation-method DNS
aws acm describe-certificate --region us-east-1 \
  --certificate-arn <arn> \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
```

Add that CNAME at name.com, wait for `ISSUED`, then attach the
certificate and the `docs.ubiquex.io` alias to the distribution.

### 7. The DNS cutover, last and deliberately separate

`docs.ubiquex.io` is **live on Mintlify today**, `CNAME
cname.mintlify.builders`. Repointing it at CloudFront is what actually
switches the public documentation site over, so it happens only after
step 5 has confirmed the new site serves correctly on its CloudFront
domain. Nothing before step 7 is visible to a reader.

## cloudfront/rewrite.js

A viewer-request function that maps clean URLs onto the files Next's
static export actually writes.

`output: "export"` with the default `trailingSlash: false` emits
`<route>.html`, **not** `<route>/index.html`. Only the site root is
`index.html`. A function written the other way round 404s the whole site
except the landing page.

It matches a known extension list rather than asking whether the last
path segment contains a dot. This site has no dotted route segments
today, so the dot heuristic would happen to work here, and it is still
not used: it shipped broken on the provider site, where every version
landing page (`/github/1.2.3`) has a dot in its last segment and all of
them 404'd in production. One page slug carrying a version or a decimal
would reproduce it here.

### Running the tests

```
node --test infra/cloudfront/rewrite.test.mjs
```

No AWS call and no credentials. The tests read `rewrite.js` itself and
evaluate it, so what is tested is the exact byte content that gets
uploaded rather than a re-typed copy that could drift. They run in CI on
every PR.

The cases are this site's own real routes, taken from its export. The
provider site's list is not reusable here: none of `/github/1.2.3`,
`/aws/2.2.1` or `/sidebar/*` exists on this site, so every one of them
would fail.

### Updating the deployed function

The repo is the source of truth. Edit `cloudfront/rewrite.js`, make the
tests pass, get the PR merged, then dispatch `function-publish`, which
re-runs the tests, diffs the deployed copy against the committed source,
verifies the DEVELOPMENT stage inside CloudFront before promoting, and
invalidates `/*`.

It is manual-only and separate from `deploy.yml` on purpose. A content
deploy writes objects; a function change sits in front of every request
to every path, so getting it wrong takes the whole site down rather than
one page.
