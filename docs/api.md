# API reference

Package entry points, all exports, the full Fastly IO option map, and URL-building semantics.

## Entry points

| Import | Contents | Dependencies |
| --- | --- | --- |
| `@seatgeek/next-fastly-image` | `fastlyImageUrl`, `fastlyImageSearchParams`, types, presets, param list | none |
| `@seatgeek/next-fastly-image/next` | `createFastlyLoader` | none (not even `next`) |
| `@seatgeek/next-fastly-image/component` | `FastlyImage` | `next` + `react` (optional peers, no upper bound) |

Ships dual ESM + CJS with type declarations and `sideEffects: false`. The core and `/next` entries type the loader params structurally, so `next` never has to be installed unless you use `/component`.

## Core

### `fastlyImageUrl(src, options, config?)`

Append Fastly IO params to `src`, preserving any existing query params (cache busters, signatures). Accepts site-relative paths, protocol-relative URLs, and absolute http(s) URLs on any host - the origin is never inspected or rewritten:

```ts
import { fastlyImageUrl } from "@seatgeek/next-fastly-image";

fastlyImageUrl("/img/a.png?t=123", { width: 640, auto: "webp" });
// => "/img/a.png?t=123&width=640&auto=webp"

fastlyImageUrl("https://images.myapp.com/hero.jpg", { crop: "16:9,smart", width: 1200 });
// => "https://images.myapp.com/hero.jpg?crop=16%3A9%2Csmart&width=1200"
```

Inputs that can't carry IO params are returned unchanged: unparseable strings, non-http(s) schemes (`data:`, `blob:`), and paths without a leading slash. It's a pure function with no Node- or browser-specific APIs - it runs in SSR, client, and edge runtimes.

### `fastlyImageSearchParams(options)`

Just the query string, no URL involved. Serializes options to `URLSearchParams`, skipping `undefined` values:

```ts
import { fastlyImageSearchParams } from "@seatgeek/next-fastly-image";

fastlyImageSearchParams({ width: 640, auto: "webp" }).toString();
// => "width=640&auto=webp"
```

### Restricted mode

By default, query params already on the `src` are **preserved**. If you'd rather emit canonical URLs that carry *only* Fastly IO params (fewer cache variants at the edge), opt in to `restricted`:

```ts
fastlyImageUrl("/a.png?v=123&utm_source=mail", { width: 640 }, { restricted: true });
// => "/a.png?width=640"   (v=123 and utm_source stripped; valid IO params on src are kept)

createFastlyLoader("default", { restricted: true });
```

Validity is checked against `FASTLY_IMAGE_PARAM_NAMES` (the runtime list of every Fastly IO param). Off by default because stripping params changes the URL your origin receives and the CDN cache key - don't enable it if your origin needs those params (e.g. signed URLs).

### Other core exports

- `FastlyImageOptions` - the typed option map (table below).
- `FastlyImageUrlConfig` - behavior switches (`restricted`).
- `FASTLY_IMAGE_PRESETS` - the `default` and `thumbnail` presets.
- `FASTLY_IMAGE_PARAM_NAMES` - runtime list of every valid Fastly IO param name.
- `DEFAULT_QUALITY` - `75`, matching `next/image` (Fastly's own service default is 85).

## `/next` - `createFastlyLoader(presetOrOptions?, config?)`

Build a `next/image` loader from a preset name or ad-hoc `FastlyImageOptions`; `config` is passed through to `fastlyImageUrl`:

```ts
import { createFastlyLoader } from "@seatgeek/next-fastly-image/next";

createFastlyLoader();            // "default": auto=webp, quality=75
createFastlyLoader("thumbnail"); // auto=webp, fit=crop, quality=60

// Or pass any FastlyImageOptions directly:
createFastlyLoader({ auto: "avif", fit: "bounds", sharpen: "a5,r2,t1" });
```

Merging rules: the `quality` prop on an individual `<Image quality={90}>` always beats the preset's quality; `width` always comes from Next.js's `deviceSizes`/`imageSizes` - never from a preset.

### Custom presets

Any `FastlyImageOptions` object *is* a preset - define your own typed map and create loaders from it:

```ts
import type { FastlyImageOptions } from "@seatgeek/next-fastly-image";
import { createFastlyLoader } from "@seatgeek/next-fastly-image/next";

export const PRESETS = {
  hero:   { auto: "webp", fit: "cover", quality: 80 },
  avatar: { auto: "webp", crop: "1:1,smart", quality: 60 },
} as const satisfies Record<string, FastlyImageOptions>;

export const heroLoader = createFastlyLoader(PRESETS.hero);
```

## `/component` - `FastlyImage`

`next/image` with the Fastly loader baked in, for [mixed-loader apps](./recipes.md#using-multiple-loaders). Props: everything from `next/image` except `loader`, plus `preset` (a preset name or ad-hoc options) and `fastlyConfig`. It is a Client Component internally, so using it *from* Server Components is fine.

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
