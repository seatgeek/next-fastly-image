# next-fastly-image

[![CI](https://github.com/seatgeek/next-fastly-image/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/seatgeek/next-fastly-image/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40seatgeek%2Fnext-fastly-image)](https://www.npmjs.com/package/@seatgeek/next-fastly-image)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/%40seatgeek%2Fnext-fastly-image)](https://bundlephobia.com/package/@seatgeek/next-fastly-image)
[![install size](https://packagephobia.com/badge?p=%40seatgeek%2Fnext-fastly-image)](https://packagephobia.com/result?p=%40seatgeek%2Fnext-fastly-image)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)

A stateless, **zero-dependency** loader that lets [`next/image`](https://nextjs.org/docs/app/api-reference/components/image) delegate image transformation to [Fastly Image Optimizer](https://www.fastly.com/documentation/reference/io/) ("Fastly IO") instead of Next.js's own `/_next/image` endpoint. Fastly IO transforms and caches every variant at the CDN edge POP, driven purely by query parameters - so your Next.js server does zero image work, and each `srcset` candidate is a cache hit close to the user.

Next.js's own docs carry an [8-line Fastly loader example](https://nextjs.org/docs/pages/api-reference/config/next-config-js/images#fastly) with a hardcoded domain. This package is that snippet, productionized: **typed against the full Fastly IO API, host-agnostic, preset-driven, and tested** (100% coverage). The published package is ~11 kB packed.

> [!IMPORTANT]
> **Prerequisite: Fastly Image Optimizer must be enabled on your Fastly service.**
> Fastly IO is a paid add-on, activated per service, and your service config (VCL or Compute) must route image paths through the optimizer. See Fastly's [Image Optimizer setup guide](https://www.fastly.com/documentation/guides/imageopto/setting-up-image-optimizer/).
> Without it, the query parameters this package appends are **silently ignored** and the original, untransformed images are served - your site degrades (larger images), but does not break.

> [!NOTE]
> **Disclaimer:** This project is not affiliated with, endorsed by, or sponsored by Fastly, Inc. "Fastly" and "Fastly Image Optimizer" are trademarks of Fastly, Inc. SeatGeek does not operate or control the Fastly IO service; its behavior, availability, and pricing are governed solely by Fastly - consult [Fastly's documentation](https://www.fastly.com/documentation/reference/io/) and your Fastly account team.

## Why offload from `/_next/image`?

By default, `next/image` rewrites every image through your Next.js server's optimizer endpoint. That means CPU-bound image work (resize + re-encode per `srcset` variant) on your own infrastructure, warm-up latency on cache misses, and images that are only as close to users as your server is. If your site already sits behind Fastly with IO enabled, the optimizer is *already at the edge*, this package just builds the right URLs for it.

## Install

```sh
npm install @seatgeek/next-fastly-image
# or
pnpm add @seatgeek/next-fastly-image
# or
yarn add @seatgeek/next-fastly-image
# or
bun add @seatgeek/next-fastly-image
```

Requires Node ≥ 20 to build/run locally. Works with **Next.js ≥ 13** (Pages Router and App Router, the loader contract is identical through Next 16).

## Quick start A - global loader

Point every `next/image` on your site at Fastly IO.

> [!WARNING]
> A global loader is all-or-nothing: `loader: "custom"` opts **every** `next/image` in the app out of the built-in `/_next/image` optimizer. Images *not* served through Fastly IO will carry params that get silently ignored - originals served unoptimized. If only some of your images go through Fastly, see [Using multiple loaders](#using-multiple-loaders) before choosing this setup.

**1.** Create a loader file at your project root:

```js
// image-loader.js
"use client";

import { createFastlyLoader } from "@seatgeek/next-fastly-image/next";

export default createFastlyLoader("default");
```

**2.** Reference it in `next.config.js`:

```js
// next.config.js
module.exports = {
  images: {
    loader: "custom",
    loaderFile: "./image-loader.js",
  },
};
```

**3.** Use `next/image` exactly as before:

```jsx
import Image from "next/image";

export function Hero() {
  return <Image src="/img/hero.jpg" alt="Hero" width={1200} height={630} />;
}
```

The rendered `<img>` now carries a Fastly-IO-parameterized `srcset`:

```text
/img/hero.jpg?auto=webp&quality=75&width=640 640w,
/img/hero.jpg?auto=webp&quality=75&width=1080 1080w,
/img/hero.jpg?auto=webp&quality=75&width=1920 1920w, …
```

## Quick start B - per-component loader

Attach a loader to individual images instead of globally:

```jsx
"use client"; // App Router: functions can't cross the server boundary

import Image from "next/image";
import { createFastlyLoader } from "@seatgeek/next-fastly-image/next";

const thumbnailLoader = createFastlyLoader("thumbnail");

export function Avatar({ src }) {
  return <Image loader={thumbnailLoader} src={src} alt="" width={64} height={64} />;
}
```

In the **App Router**, a `loader` prop must be passed from a Client Component (`"use client"`) - functions can't cross the server boundary ([vercel/next.js#41924](https://github.com/vercel/next.js/issues/41924)). The global `loaderFile` approach from Quick start A has no such constraint and works in both routers.

## Using multiple loaders

Next.js supports exactly **one** global loader ([vercel/next.js#23820](https://github.com/vercel/next.js/discussions/23820) is the long-standing upstream ask for more). Pick the pattern that matches how your images are split:

| Your situation | Pattern |
| --- | --- |
| All images served through Fastly | Global loader (Quick start A) |
| Mostly Fastly, exceptions identifiable by path | Global [dispatching loader](#recipe---selective-routing) with a `/_next/image` fallback ([vercel/next.js#60993](https://github.com/vercel/next.js/discussions/60993)) |
| Mixed sources, identifiable by component | **No global loader** + `<FastlyImage>` where Fastly applies (below) |
| One-off exceptions | Per-image `loader` prop (overrides a global loader) or `unoptimized` |

### The `FastlyImage` component

When you skip the global config, plain `<Image>` keeps the built-in `/_next/image` optimizer, and `<FastlyImage>` routes just its own image through Fastly IO:

```jsx
import Image from "next/image";
import { FastlyImage } from "@seatgeek/next-fastly-image/component";

export default function Page() {
  return (
    <>
      {/* Served through Fastly IO */}
      <FastlyImage src="/img/hero.jpg" width={1200} height={630} alt="Hero" />
      <FastlyImage src="/img/avatar.png" width={64} height={64} alt="" preset="thumbnail" />

      {/* Still uses the built-in Next.js optimizer */}
      <Image src="/other/logo.png" width={200} height={50} alt="Logo" />
    </>
  );
}
```

`FastlyImage` accepts every `next/image` prop except `loader`, plus `preset` (a preset name or ad-hoc `FastlyImageOptions`) and `fastlyConfig` (e.g. `{ restricted: true }`). It is a Client Component internally, so using it *from* Server Components is fine - it is the boundary itself.

Importing `@seatgeek/next-fastly-image/component` requires `next` and `react`, declared as **optional peer dependencies with no upper version bound** (`next >= 13`, `react >= 18`) - the component ships unbundled imports, so whatever versions your app uses are the versions that run. The core and `/next` entry points remain zero-dependency; if you never import `/component`, `next` and `react` are not required at all.

## Presets and ad-hoc options

```ts
import { createFastlyLoader } from "@seatgeek/next-fastly-image/next";

createFastlyLoader();            // "default": auto=webp, quality=75
createFastlyLoader("thumbnail"); // auto=webp, fit=crop, quality=60

// Or pass any FastlyImageOptions directly:
createFastlyLoader({ auto: "avif", fit: "bounds", sharpen: "a5,r2,t1" });
```

Merging rules: the `quality` prop on an individual `<Image quality={90}>` always beats the preset's quality; `width` always comes from Next.js's `deviceSizes`/`imageSizes` - never from a preset.

## Recipe - selective routing

Many sites serve only *some* paths through Fastly IO. Routing policy belongs in **your** loader file, not in this package's API - compose it:

```js
// image-loader.js
"use client";

import { createFastlyLoader } from "@seatgeek/next-fastly-image/next";

const fastly = createFastlyLoader("default");
const FASTLY_PREFIXES = ["/img/", "/media/"];

export default function loader({ src, width, quality }) {
  if (FASTLY_PREFIXES.some((p) => src.startsWith(p))) {
    return fastly({ src, width, quality });
  }
  // Everything else falls back to the built-in Next.js optimizer.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
```

## Recipe - dedicated image host

Pages served from `www.myapp.com`, images from `images.myapp.com`? This package never rewrites hosts (that's what makes it work unchanged for multi-domain and multi-tenant sites), so prefix the host yourself:

```js
// image-loader.js
"use client";

import { createFastlyLoader } from "@seatgeek/next-fastly-image/next";

const fastly = createFastlyLoader("default");

export default function loader({ src, width, quality }) {
  const absolute = src.startsWith("/") ? `https://images.myapp.com${src}` : src;
  return fastly({ src: absolute, width, quality });
}
```

Absolute srcs on any host (`images.`, `static.`, `assets.`, any port) pass through with their origin untouched; existing query params (cache busters, signatures) are preserved.

## Framework-agnostic usage

The core entry point has no Next.js coupling at all - use it anywhere you build image URLs:

```ts
import { fastlyImageUrl } from "@seatgeek/next-fastly-image";

fastlyImageUrl("/img/a.png?t=123", { width: 640, auto: "webp" });
// => "/img/a.png?t=123&width=640&auto=webp"

fastlyImageUrl("https://images.myapp.com/hero.jpg", { crop: "16:9,smart", width: 1200 });
// => "https://images.myapp.com/hero.jpg?crop=16%3A9%2Csmart&width=1200"
```

Inputs that can't carry IO params are returned unchanged: unparseable strings, non-http(s) schemes (`data:`, `blob:`), and paths without a leading slash. `fastlyImageUrl` is a pure function with no Node- or browser-specific APIs - it runs in SSR, client, and edge runtimes.

Need just the query string? `fastlyImageSearchParams(options)` returns the serialized `URLSearchParams` without touching a URL:

```ts
import { fastlyImageSearchParams } from "@seatgeek/next-fastly-image";

fastlyImageSearchParams({ width: 640, auto: "webp" }).toString();
// => "width=640&auto=webp"
```

## Restricted mode

By default, query params already on the `src` are **preserved** - cache busters and signatures keep working. If you'd rather emit canonical URLs that carry *only* Fastly IO params (fewer cache variants at the edge), opt in to `restricted`:

```ts
fastlyImageUrl("/a.png?v=123&utm_source=mail", { width: 640 }, { restricted: true });
// => "/a.png?width=640"   (v=123 and utm_source stripped; valid IO params on src are kept)

createFastlyLoader("default", { restricted: true });
```

Validity is checked against `FASTLY_IMAGE_PARAM_NAMES` (the runtime list of every Fastly IO param). Off by default because stripping params changes the URL your origin receives and the CDN cache key - don't enable it if your origin needs those params (e.g. signed URLs).

## Options

Every option key is named **exactly** like the corresponding [Fastly IO query parameter](https://www.fastly.com/documentation/reference/io/), so Fastly's reference doubles as this package's documentation. All options are optional; each has JSDoc with its value range in your editor.

| Option | Type | Values / range |
| --- | --- | --- |
| `width` | `number \| string` | px 1–8192, fraction 0–0.99 of source, or `"Np"` percent |
| `height` | `number \| string` | px 1–8192, fraction 0–0.99, or `"Np"` percent |
| `quality` | `number \| string` | 1–100; optional second value for `auto=webp` (`"85,75"`). Package default 75 |
| `dpr` | `number` | device pixel ratio 1–10 |
| `fit` | enum | `bounds` \| `cover` \| `crop` (requires width + height) |
| `auto` | enum | `webp` \| `avif` (content-negotiated; `avif` is a paid Fastly feature) |
| `format` | enum | `auto` `avif` `bjpg` `gif` `jpg` `jxl` `mp4` `pjpg` `pjxl` `png` `png8` `svg` `webp` `webpll` `webply` |
| `crop` | `string` | `"w,h"` px/% or `"wr:hr"` ratio + optional `x`/`y`/`offset-x`/`offset-y`, `smart`/`safe` |
| `precrop` | `string` | same syntax as `crop`, applied before other transforms |
| `blur` | `number \| string` | 0.5–1000 px, or `"Np"` percent |
| `orient` | enum | `r` `l` `h` `v` `hv` `vh` `rv` `vr` `lv` `vl` or EXIF digits `1`–`8` |
| `bg-color` | `string` | hex without `#`, `"r,g,b"` (0–255), or `"r,g,b,a"` (alpha 0–1) |
| `brightness` | `number` | -100 to 100 |
| `contrast` | `number` | -100 to 100 |
| `saturation` | `number` | -100 to 100 |
| `sharpen` | `string` | `"a{0–10},r{0.5–1000},t{0–255}"`, e.g. `"a5,r2,t1"` |
| `trim` | `number \| string` | CSS shorthand 1–4 values; px or <1 fraction |
| `pad` | `number \| string` | CSS shorthand 1–4 values; ignored when `canvas` is set |
| `canvas` | `string` | `"w,h"` or `"wr:hr"` + optional position |
| `resize-filter` | enum | `nearest` `bilinear` `bicubic` `lanczos2` `lanczos3` (default) |
| `frame` | `1` | first frame of an animated GIF |
| `optimize` | enum | `low` \| `medium` \| `high` (explicit `quality` wins) |
| `profile` | enum | `baseline` \| `main` \| `high` (`format=mp4` only) |
| `level` | enum | `"1.0"`–`"6.2"` H.264 levels (`format=mp4` only) |
| `metadata` | enum | `copyright` \| `c2pa` \| `copyright,c2pa` (all stripped by default) |
| `enable` / `disable` | enum | `upscale` |
| `bw` | `string` | `"threshold"` (optional `,luminance` 0–100) or `"atkinson"` |
| `viewbox` | `1` | SVG output only: emit a responsive `viewBox` |

## Next.js compatibility

- **Primary target: Next.js 16.x.** This package's types are compile-time checked against `next/image`'s own `ImageLoader` type from Next 16 in CI. Because there is zero runtime coupling to `next` (the loader params are typed structurally), the package also works on **Next.js 13-15**, Pages Router and App Router - the custom-loader contract, `({ src, width, quality }) => string`, is unchanged across those versions. A types-only CI matrix formally verifying 14.x/15.x is planned.
- **App Router:** pass `loader` props only from Client Components; prefer the global `loaderFile` (Quick start A), which has no client/server constraint.
- **Next 16:** `images.qualities` defaults to `[75]` and acts as an allowlist. A `quality` prop not in the list is **silently coerced to the closest allowed value** *before* your loader sees it (`quality={60}` arrives as `75` unless you set `images: { qualities: [60, 75] }`). Preset qualities are unaffected - they're applied inside the loader, after Next.js. The selective-routing recipe's `/_next/image` fallback is stricter: direct requests with an unlisted quality return `400 Bad Request`.
- **`remotePatterns` is not required** for remote srcs when `loader: "custom"` is set - that allowlist guards the built-in `/_next/image` endpoint, which your Fastly-routed images never touch. (You still need it for any images left on the built-in optimizer, e.g. via the selective-routing recipe.)

## API

### `@seatgeek/next-fastly-image` (core, framework-agnostic)

- `fastlyImageUrl(src, options, config?)` - append Fastly IO params to a path or URL. `config.restricted` strips non-Fastly params from `src` (off by default).
- `fastlyImageSearchParams(options)` - serialize options to `URLSearchParams` (skips `undefined`).
- `FastlyImageOptions` - the typed option map above.
- `FastlyImageUrlConfig` - behavior switches (`restricted`).
- `FASTLY_IMAGE_PARAM_NAMES` - runtime list of every valid Fastly IO param name.
- `FASTLY_IMAGE_PRESETS` - `default` and `thumbnail` presets.
- `DEFAULT_QUALITY` - `75`, matching `next/image`.

### `@seatgeek/next-fastly-image/next`

- `createFastlyLoader(presetOrOptions?, config?)` - build a `next/image` loader from a preset name or ad-hoc `FastlyImageOptions`; `config` is passed through to `fastlyImageUrl`.

### `@seatgeek/next-fastly-image/component`

- `FastlyImage` - `next/image` with the Fastly loader baked in, for [mixing loaders](#using-multiple-loaders). Props: everything from `next/image` except `loader`, plus `preset` and `fastlyConfig`. Requires the optional `next`/`react` peers (unbounded versions).

Ships dual ESM + CJS with type declarations, `sideEffects: false`, and zero runtime dependencies - `next` is not even a peer dependency (the loader params are typed structurally).

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md). TL;DR: `make init && make check`. The package's invariants (host-agnostic, 1:1 param naming, pure functions, zero deps) are documented in [AGENTS.md](./AGENTS.md) and enforced by tests and CI.

## License

[Apache-2.0](./LICENSE) © SeatGeek
