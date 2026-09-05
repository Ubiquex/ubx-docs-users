// Validates infra/cloudfront/distribution.json against the CloudFront
// limits and invariants that this repo actually depends on.
//
// WHY. The committed config shipped with a 138-character Comment.
// CloudFront caps it at 128 and rejects the entire create-distribution
// call, so the failure only appeared after a real API round trip, in a
// script that then continued and applied two IAM and bucket policies
// naming an empty distribution ID.
//
// Nothing about that was visible in review: 138 characters of prose
// looks exactly like 128 characters of prose. This runs in CI so the
// limit is a build failure at PR time instead of a runtime one.
//
// Deliberately not a general CloudFront schema validator. These are the
// specific constraints this config has already violated or that this
// repo's own scripts rely on.

import { readFileSync } from "node:fs";

const path = "infra/cloudfront/distribution.json";
const config = JSON.parse(readFileSync(path, "utf8"));
const problems = [];

// 1. The limit that actually broke a run.
const comment = config.Comment ?? "";
if (comment.length > 128) {
  problems.push(`Comment is ${comment.length} chars, CloudFront's limit is 128`);
}

// 2. create.sh finds an existing distribution with
//    starts_with(Comment, 'ubx-docs-users'). If the Comment stops
//    starting with that, the lookup silently returns None, the script
//    decides nothing exists, and a second distribution gets created
//    alongside the live one.
if (!comment.startsWith("ubx-docs-users")) {
  problems.push(
    `Comment must start with "ubx-docs-users": create.sh's idempotency lookup filters on that prefix`,
  );
}

// 3. The origin must point at the real bucket via OAC, not an S3 website
//    endpoint. A website endpoint cannot be used with Origin Access
//    Control at all, which is what keeps the bucket private.
const origin = config.Origins?.Items?.[0];
if (!origin?.OriginAccessControlId) {
  problems.push("origin has no OriginAccessControlId, so the bucket would have to be public");
}
if (origin?.DomainName?.includes("s3-website")) {
  problems.push(`origin DomainName "${origin.DomainName}" is a website endpoint, incompatible with OAC`);
}

// 4. The viewer-request function is what maps clean URLs onto the
//    <route>.html files the export writes. Without it every route except
//    the root 404s.
const fns = config.DefaultCacheBehavior?.FunctionAssociations;
const viewerRequest = fns?.Items?.some((f) => f.EventType === "viewer-request");
if (!viewerRequest) {
  problems.push("no viewer-request function association, so every extensionless route would 404");
}

// 5. Both 403 and 404 must map to the 404 page.
//
// This is not belt and braces. A private bucket behind Origin Access
// Control answers a missing key with 403 AccessDenied, never 404,
// because the CloudFront principal holds s3:GetObject but not
// s3:ListBucket and S3 will not disclose whether the key exists. The
// first deployed config mapped only 404, so every nonexistent URL on the
// site returned a raw S3 XML error document instead of the 404 page.
// Nothing about that is visible in the config: mapping 404 looks like
// exactly the right thing to do.
const errorCodes = new Set(
  (config.CustomErrorResponses?.Items ?? []).map((i) => i.ErrorCode),
);
for (const code of [403, 404]) {
  const entry = config.CustomErrorResponses?.Items?.find((i) => i.ErrorCode === code);
  if (!entry) {
    problems.push(
      `no CustomErrorResponse for ${code}` +
        (code === 403 ? ": S3 behind OAC returns 403 for a missing key, not 404" : ""),
    );
  } else if (entry.ResponsePagePath !== "/404.html" || entry.ResponseCode !== "404") {
    problems.push(
      `CustomErrorResponse ${code} should serve /404.html as 404, ` +
        `got ${entry.ResponsePagePath} as ${entry.ResponseCode}`,
    );
  }
}
void errorCodes;

// 5. Declared quantities must match the arrays they describe. CloudFront
//    trusts Quantity, so a mismatch is accepted and then behaves as
//    though the extra items were never configured.
for (const [label, node] of [
  ["Origins", config.Origins],
  ["CustomErrorResponses", config.CustomErrorResponses],
  ["DefaultCacheBehavior.FunctionAssociations", fns],
]) {
  if (node && node.Quantity !== (node.Items?.length ?? 0)) {
    problems.push(
      `${label}.Quantity is ${node.Quantity} but there are ${node.Items?.length ?? 0} items`,
    );
  }
}

console.log(`${path}: Comment ${comment.length}/128 chars, ${Object.keys(config).length} top-level keys`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("ok: distribution config is within CloudFront's limits and this repo's invariants");
