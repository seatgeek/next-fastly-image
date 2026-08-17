# AGENTS.md

Instructions for AI coding agents (and a good summary for humans).

## What this package is

`@seatgeek/next-fastly-image` is a **stateless, zero-runtime-dependency** URL builder that lets `next/image` delegate image transformation to [Fastly Image Optimizer](https://www.fastly.com/documentation/reference/io/) via Next.js [custom loaders](https://nextjs.org/docs/app/api-reference/components/image#loaderfile). Two entry points:

- `@seatgeek/next-fastly-image` - framework-agnostic core: `fastlyImageUrl`, `fastlyImageSearchParams`, `FastlyImageOptions`, `FASTLY_IMAGE_PRESETS`, `FASTLY_IMAGE_PARAM_NAMES`, `DEFAULT_QUALITY`
- `@seatgeek/next-fastly-image/next` - `createFastlyLoader` for `next/image`
- `@seatgeek/next-fastly-image/component` - `FastlyImage` wrapper for mixed-loader apps (the only entry with peer deps)

## Invariants - do not break these

1. **Host-agnostic.** Never inspect, validate, or rewrite hosts. Relative input → relative output; absolute input → same origin with params appended. No configured base URL, ever. Host/routing policy belongs in the consumer's loader file (documented as README recipes, not API).
2. **Existing query params are preserved by default**; same-key params are overwritten by the options. The only sanctioned exception is the opt-in `restricted` config (off by default), which strips params not present in `FASTLY_IMAGE_PARAM_NAMES` - keep that list in lockstep with `FastlyImageOptions` (a unit test enforces it).
3. **Unusable input is returned unchanged** - unparseable strings, non-http(s) schemes (`data:`, `blob:`), and paths without a leading slash.
4. **Option keys are named exactly like Fastly IO query params**, so serialization stays a plain `Object.entries` loop. When adding a param, use Fastly's name verbatim (quote hyphenated keys), give it a JSDoc line with its value range, and add a round-trip test.
5. **Per-image `quality` beats preset quality; `width` always comes from Next.js**, never from a preset.
6. **Pure functions only.** No I/O, no state, no Node- or browser-specific APIs - the code must run in SSR, client, and edge runtimes.
7. **Zero runtime dependencies in the core entries, and no imports from `next`** in `src/index.ts` / `src/next.ts` (CI greps for this). The one sanctioned exception is `src/component.tsx` (the `/component` entry), which imports `next/image`/`react` as **optional, unbounded peer dependencies** shipped as unbundled externals - consumers who never import `/component` need neither. `next`/`react` are also devDependencies for the compile-time compatibility test (`src/next-compat.test-d.ts`) and the component render tests.

## Rules of engagement

- **Extend, don't redesign.** The core is deliberately tiny; new capability should be a new option key or a documented recipe, not an abstraction.
- Sources of truth: the [Fastly IO parameter reference](https://www.fastly.com/documentation/reference/io/) for option names/values (fetch it - don't work from memory) and the [Next.js image docs](https://nextjs.org/docs/app/api-reference/components/image) for the loader contract.
- Tests live next to sources (`src/*.test.ts`), run with vitest, and coverage thresholds are 100% - add tests with any behavior change.
- Keep the published tarball minimal: `files: ["dist"]` is the allowlist; check with `npm pack --dry-run`.
- Never publish. Releases are human-triggered (`workflow_dispatch` + `npm-publish` environment); merging to `main` must never publish.

## Commands

```sh
make init       # mise install + pnpm install
make check      # typecheck + lint + test + build + export checks
make test       # vitest with coverage
make format     # biome auto-fix
make pack-check # npm pack --dry-run
```
