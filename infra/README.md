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

All infrastructure exists. `docs.ubiquex.io` still resolves to Mintlify:
the alias and the DNS cutover are the last steps, deliberately after the
site has been confirmed serving on its own CloudFront domain.

| Resource | Identifier | State |
|---|---|---|
| S3 bucket | `ubx-docs-users-site` | created |
| Origin Access Control | `E3VO6LIHTNN70Q` | created |
| CloudFront Function | `ubx-docs-users-rewrite` | created, **published to LIVE** |
| CloudFront distribution | `EJSUGHAX0MZCR` (`d3919omo84z6mg.cloudfront.net`) | created |
| ACM certificate (us-east-1) | `2a020e28-a797-4440-a5f7-c79564570bbb` | **ISSUED** |
| IAM deploy role | `ubx-docs-users-deploy` | created, policy scoped to the above |
| Bucket policy | conditioned on the distribution ARN | applied |

The bucket blocks all public access and has default AES256 encryption.
It is not an S3 website endpoint, which is what makes Origin Access
Control usable at all. It is currently unreadable by anything, which is
correct until the distribution exists to grant read to.

`deploy.yml` and `function-publish.yml` now carry the real distribution
ID and role ARN. `deploy.yml` keeps its guard refusing to run on a
placeholder, which stays useful if this is ever stood up again in
another account.

`infra/iam/deploy-policy.json` deliberately keeps its
`REPLACE_ME_DISTRIBUTION_ID`. It is a template that `create.sh`
substitutes at run time, not a finished document. Hardcoding the current
ID would silently produce a policy scoped to a dead distribution if the
distribution were ever recreated.

## Remaining steps

Three resources could not be created from the agent session: the
CloudFront distribution, the IAM deploy role and the ACM certificate.
The permission classifier refused those calls, and they were not worked
around.

Run `./infra/create.sh` from the repo root, with credentials for account
`839333509514`. It creates all three plus the bucket policy, in the one
order that works, and prints the ACM validation CNAME along with the two
values `deploy.yml` needs.

It is a script rather than a list of commands because the ordering
carries real dependencies: the bucket policy names the distribution ARN
and the deploy role's policy names the distribution ID, so both wait on
the distribution and both need an ID substituted in. Hand-copying an ID
between six commands is where a typo produces a policy that reads
correctly and grants nothing. It is safe to re-run; every step looks up
what it would create and skips it if present.

It deliberately does not touch DNS. See step 7 below.

### After it runs

1. Add the printed CNAME at name.com and wait for the certificate to
   reach `ISSUED`.
2. Fill `REPLACE_ME_DISTRIBUTION_ID` and `REPLACE_ME_ROLE_ARN` in
   `.github/workflows/deploy.yml`, plus `REPLACE_ME_DISTRIBUTION_ID` in
   `.github/workflows/function-publish.yml`. `deploy.yml` refuses to run
   while they are placeholders rather than deploying into nothing.
3. Deploy and verify on the CloudFront domain, before any DNS change.
   Push to `main` or dispatch `deploy`. Its own last step fetches real
   pages through CloudFront and fails if they do not serve. Check by
   hand too:

   ```
   curl -sI https://<CLOUDFRONT_HOST>/concepts | head -1
   curl -sI https://<CLOUDFRONT_HOST>/tutorial/sdk/install | head -1
   ```

4. Attach the certificate and the `docs.ubiquex.io` alias to the
   distribution.
5. **The DNS cutover, last and deliberately separate.**
   `docs.ubiquex.io` is live on Mintlify today, `CNAME
   cname.mintlify.builders`. Repointing it at CloudFront is what
   actually switches the public documentation site over, so it happens
   only after step 3 has confirmed the new site serves correctly.
   Nothing before that point is visible to a reader.

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
