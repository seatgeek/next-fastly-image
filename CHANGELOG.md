# @seatgeek/next-fastly-image

## 0.1.0

### Minor Changes

- Initial release: a stateless, zero-dependency Fastly Image Optimizer adapter for `next/image`.

  - **Core** (`@seatgeek/next-fastly-image`): `fastlyImageUrl` appends Fastly IO params to any path or URL - host-agnostic, preserves existing query params, returns unusable input unchanged. Complete typed option map of all 29 Fastly IO params (verified against Fastly's reference), `fastlyImageSearchParams`, `FASTLY_IMAGE_PRESETS` (`default`, `thumbnail`), `FASTLY_IMAGE_PARAM_NAMES`, and an opt-in `restricted` mode that strips non-Fastly params (e.g. cache busters).
  - **Next.js loader** (`/next`): `createFastlyLoader(presetOrOptions?, config?)` for `images.loaderFile` or per-image `loader` props. No `next` import - params are typed structurally, compile-checked against `next/image`'s own `ImageLoader` type.
  - **Component** (`/component`): `FastlyImage`, a `next/image` wrapper with the Fastly loader baked in, for apps that mix Fastly with the built-in optimizer. Requires `next`/`react` as optional peer dependencies (no upper version bound); the other entry points stay dependency-free.
  - Dual ESM/CJS with type declarations; runs in SSR, client, and edge runtimes; supports Next.js 13-16 (primary target 16.x).

This changelog is managed by [changesets](https://github.com/changesets/changesets). Entries are generated from `.changeset/*.md` files when a release is versioned.
