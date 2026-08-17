import { defineConfig } from "tsup";

// Core entries only. The /component entry lives in tsup.component.config.ts and
// is built by a SEPARATE, SEQUENTIAL tsup invocation (see the build script):
// tsup runs array configs in parallel (Promise.all), so a second config in this
// file would race this config's `clean: true` and intermittently lose its
// output - observed as missing dist/component.d.ts in CI.
export default defineConfig({
  entry: ["src/index.ts", "src/next.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  // Each entry bundles its imports inline (no cross-entry runtime import),
  // so ESM and CJS consumers never mix module instances of ./index.
});
