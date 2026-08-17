import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/next.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    // Each entry bundles its imports inline (no cross-entry runtime import),
    // so ESM and CJS consumers never mix module instances of ./index.
  },
  {
    entry: ["src/component.tsx"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    // Must NOT clean: it would wipe the index/next output built above.
    clean: false,
    // treeshake runs a rollup pass that strips module-level directives,
    // deleting the "use client" banner - keep it off for this tiny entry.
    treeshake: false,
    splitting: false,
    // The component ships unbundled peer imports so any consumer version of
    // next/react is used at runtime (version-agnostic by construction).
    external: ["next", "next/image", "react", "react/jsx-runtime"],
    // esbuild strips module-level directives when bundling; re-add the RSC
    // client boundary marker. Scoped to this entry only - a directive on the
    // core entries would poison fastlyImageUrl for Server Component callers.
    banner: { js: '"use client";' },
  },
]);
