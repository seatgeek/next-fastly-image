# Contributing

Thanks for helping improve `@seatgeek/next-fastly-image`! This is a small, deliberately boring package - most contributions are new Fastly IO option keys, documentation, or edge-case fixes to URL handling.

## Setup

Toolchain is pinned with [mise](https://mise.jdx.dev) (Node 20, pnpm 9):

```sh
make init   # mise install + pnpm install
```

No mise? Any Node ≥ 20 with pnpm 9 works: `pnpm install`.

## Development loop

```sh
make check        # typecheck + lint + test + build + export checks (what CI runs)
make test         # vitest with coverage (thresholds: 100%)
pnpm test:watch   # vitest watch mode
make format       # biome auto-fix
make pack-check   # npm pack --dry-run - verify tarball contents stay minimal
```

## Ground rules

The package's behavioral invariants live in [AGENTS.md](../AGENTS.md) - read them before changing `src/`. The short version:

- Stateless, pure functions; zero runtime dependencies; no `next` imports in runtime sources (CI greps for this - `next` is a devDependency used only by the compile-time compatibility test).
- Option keys map 1:1 to [Fastly IO query params](https://www.fastly.com/documentation/reference/io/). When adding one: use Fastly's exact name, add a JSDoc line with the value range from Fastly's per-param reference page, and add it to the round-trip test table in `src/index.test.ts`.
- Never rewrite hosts. Routing and host policy are README recipes, not API.
- Coverage thresholds are 100% - new behavior needs tests.

## Package minimality

The published tarball is allowlisted via `"files": ["dist"]` in `package.json` (source of truth). `.npmignore` exists only as a defensive denylist behind it. After any packaging change, run `make pack-check` and confirm only `dist/`, `package.json`, `README.md`, and `LICENSE` ship.

## Manual smoke test (Next.js integration)

There is no automated e2e against Next.js; before a release, verify the loader in a real app:

```sh
# 1. Pack this package
pnpm build && pnpm pack   # produces seatgeek-next-fastly-image-<version>.tgz

# 2. Fresh app elsewhere
npx create-next-app@latest smoke --ts --no-eslint --app --no-tailwind --no-src-dir --import-alias "@/*"
cd smoke
npm install ../path/to/seatgeek-next-fastly-image-<version>.tgz

# 3. Wire the loader (README Quick start A):
#    - create image-loader.js with: export default createFastlyLoader("default")
#    - set images.loader='custom' + images.loaderFile='./image-loader.js' in next config
#    - render an <Image src="/vercel.svg" width={640} height={640} alt="" />

# 4. npm run dev, then inspect the rendered <img>:
curl -s localhost:3000 | grep -o 'srcset="[^"]*"'
```

Expected: every `srcset` candidate carries `auto=webp&quality=75&width=<n>` (Fastly IO params), and no `/_next/image` URLs appear for the wired image.

## Releases

Releases use [changesets](https://github.com/changesets/changesets):

1. Include a changeset with your PR: `pnpm changeset` (pick bump level, write a summary - it becomes the CHANGELOG entry).
2. Maintainers run `pnpm changeset version` to bump the version and CHANGELOG.
3. **Merging to `main` never publishes.** Publishing happens only through the manually triggered `release` workflow (`workflow_dispatch`), which additionally refuses to run from any ref but `main`, refuses the `0.0.0` placeholder version or a tree with unconsumed changesets (i.e. step 2 was skipped), and is gated behind the `npm-publish` GitHub Environment (required reviewers) where the `NPM_TOKEN` secret lives. Run the smoke test above first.

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Security issues: see [SECURITY.md](./SECURITY.md) - please report privately.
