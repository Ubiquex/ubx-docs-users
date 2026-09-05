import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Not application code. rewrite.js runs in the CloudFront Functions
    // runtime (cloudfront-js-2.0), which is ES5-shaped and invokes a bare
    // global `handler` with no export, so the app's rules flag it as an
    // unused variable. It has its own real test suite, which loads and
    // evaluates the file itself, and function-publish.yml re-runs those
    // tests before anything reaches LIVE.
    "infra/cloudfront/rewrite.js",
  ]),
]);

export default eslintConfig;
