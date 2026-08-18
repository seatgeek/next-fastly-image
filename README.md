# next-fastly-image

[![CI](https://github.com/seatgeek/next-fastly-image/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/seatgeek/next-fastly-image/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40seatgeek%2Fnext-fastly-image)](https://www.npmjs.com/package/@seatgeek/next-fastly-image)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/%40seatgeek%2Fnext-fastly-image)](https://bundlephobia.com/package/@seatgeek/next-fastly-image)
[![install size](https://packagephobia.com/badge?p=%40seatgeek%2Fnext-fastly-image)](https://packagephobia.com/result?p=%40seatgeek%2Fnext-fastly-image)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)

A stateless, **zero-dependency** loader that lets [`next/image`](https://nextjs.org/docs/app/api-reference/components/image) delegate image transformation to [Fastly Image Optimizer](https://www.fastly.com/documentation/reference/io/) ("Fastly IO"). Instead of your Next.js server resizing every image, Fastly transforms and caches each `srcset` variant at the CDN edge - driven purely by query parameters.

It's the [Fastly snippet from the Next.js docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/images#fastly), productionized: typed against the full Fastly IO API, host-agnostic, preset-driven, and tested at 100% coverage.

> [!IMPORTANT]
> **Fastly Image Optimizer must be enabled on your Fastly service** (paid add-on + VCL/Compute routing - see [Fastly's setup guide](https://www.fastly.com/documentation/guides/imageopto/setting-up-image-optimizer/)). Without it, the params are silently ignored and untransformed originals are served - degraded, not broken.

## Install

```sh
npm install @seatgeek/next-fastly-image   # or pnpm add / yarn add / bun add
```

Node ≥ 22 for local development. Works with **Next.js ≥ 13**, both routers - verified in CI against 13, 14, 15, and 16 ([compatibility details](./docs/nextjs-compatibility.md)).

## Quick start

If **all** your images go through Fastly, wire it once globally. Create a loader file:

```js
// image-loader.js
"use client";

import { createFastlyLoader } from "@seatgeek/next-fastly-image/next";

export default createFastlyLoader("default");
```

Reference it in `next.config.js`:

```js
module.exports = {
  images: { loader: "custom", loaderFile: "./image-loader.js" },
};
```

Every `<Image>` now renders a Fastly-parameterized `srcset`:

```text
/img/hero.jpg?auto=webp&quality=75&width=640 640w, …?width=1080 1080w, …
```

> [!WARNING]
> A global loader is all-or-nothing: it opts **every** image out of the built-in optimizer, and `/_next/image` stops existing entirely. If only *some* images go through Fastly, use the [`FastlyImage` component](./docs/recipes.md#using-multiple-loaders) instead of a global loader.

## Only some images on Fastly?

Skip the global config and use the wrapper component where Fastly applies - plain `<Image>` keeps the built-in optimizer:

```jsx
import Image from "next/image";
import { FastlyImage } from "@seatgeek/next-fastly-image/component";

<FastlyImage src="/img/hero.jpg" width={1200} height={630} alt="Hero" />   // Fastly IO
<Image src="/other/logo.png" width={200} height={50} alt="Logo" />         // built-in optimizer
```

See [recipes](./docs/recipes.md) for the full decision matrix, per-component loaders, multi-CDN routing, and dedicated image hosts.

## Beyond Next.js

The core is framework-agnostic - a pure function you can use anywhere:

```ts
import { fastlyImageUrl } from "@seatgeek/next-fastly-image";

fastlyImageUrl("/img/a.png?t=123", { width: 640, auto: "webp" });
// => "/img/a.png?t=123&width=640&auto=webp"
```

## Documentation

| Doc | Contents |
| --- | --- |
| [API reference](./docs/api.md) | All exports, the full 29-option Fastly IO table, presets, restricted mode |
| [Recipes](./docs/recipes.md) | Multiple loaders, `FastlyImage`, multi-CDN routing, dedicated image hosts |
| [Next.js compatibility](./docs/nextjs-compatibility.md) | Version support, App Router notes, Next 16 `qualities`, `remotePatterns` |
| [Contributing](./docs/CONTRIBUTING.md) | Setup, quality gates, smoke test |
| [Releasing](./docs/RELEASING.md) | One-time setup, changesets flow, release guards, tagging |

Package invariants (host-agnostic, 1:1 param naming, pure functions, zero deps) live in [AGENTS.md](./AGENTS.md) and are enforced by tests and CI.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Fastly, Inc. "Fastly" and "Fastly Image Optimizer" are trademarks of Fastly, Inc. SeatGeek does not operate or control the Fastly IO service; its behavior, availability, and pricing are governed solely by Fastly.

## License

[Apache-2.0](./LICENSE) © SeatGeek
