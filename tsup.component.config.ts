import { defineConfig } from "tsup";

// The /component entry. Built AFTER tsup.config.ts by a sequential invocation
// (see the build script) - never merge into that file's config array: tsup
// builds array configs in parallel and the core config's `clean: true` would
// race this build's output.
export default defineConfig({
  entry: ["src/component.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  // Must NOT clean: the core entries were just built into dist/.
  clean: false,
  // treeshake runs a rollup pass that strips module-level directives,
  // deleting the "use client" banner - keep it off for this tiny entry.
  treeshake: false,
  splitting: false,
  // The component ships unbundled peer imports so any consumer version of
  // next/react is used at runtime (version-agnostic by construction).
  external: ["next", "next/image", "react", "react/jsx-runtime"],
  // No banner needed: with treeshake off, esbuild preserves the source file's
  // "use client" directive in the output prologue. (The rollup treeshake pass
  // is what strips directives - see treeshake comment above.)
});
