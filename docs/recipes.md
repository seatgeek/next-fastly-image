# Recipes

Patterns for wiring the loader into real apps: per-component usage, mixing multiple loaders, routing between CDNs, and dedicated image hosts.

## Per-component loader

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

In the **App Router**, a `loader` prop must be passed from a Client Component (`"use client"`) - functions can't cross the server boundary ([vercel/next.js#41924](https://github.com/vercel/next.js/issues/41924)). The global `loaderFile` approach has no such constraint and works in both routers.

## Using multiple loaders

Next.js supports exactly **one** global loader ([vercel/next.js#23820](https://github.com/vercel/next.js/discussions/23820) is the long-standing upstream ask for more). Pick the pattern that matches how your images are split:

| Your situation | Pattern |
| --- | --- |
| All images served through Fastly | Global loader (README quick start) |
| Some images through Fastly, the rest on the built-in optimizer | **No global loader** + `<FastlyImage>` where Fastly applies (below) |
| Multiple *external* CDNs, routable by path | Global [dispatching loader](#selective-routing-between-external-cdns) between them ([vercel/next.js#60993](https://github.com/vercel/next.js/discussions/60993)) |
| One-off exceptions | Per-image `loader` prop (overrides a global loader) or `unoptimized` |

> [!CAUTION]
> A global dispatching loader **cannot fall back to the built-in optimizer**: when `loader: "custom"` is set, Next.js does not bootstrap the `/_next/image` endpoint at all - hand-built `/_next/image?url=...` URLs return **404** (verified against Next 16.3.1). If any of your images need the built-in optimizer, don't set a global loader - use component-level loaders (`<FastlyImage>` or the `loader` prop) instead.

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

## Selective routing between external CDNs

If **all** your images go through external services (none need the built-in optimizer), a global dispatching loader can route between them by path. Routing policy belongs in **your** loader file, not in this package's API - compose it:

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
  // Everything else: another CDN, or the untransformed original.
  return src;
}
```

Two caveats when returning `src` unchanged for the non-Fastly branch: the image is served **untransformed** (full-size original for every srcset candidate), and Next.js prints a dev-mode warning that the loader "does not implement width". If those images should be optimized instead, you need the built-in optimizer back - which means no global loader and [component-level routing](#using-multiple-loaders) (the `/_next/image` endpoint does not exist under `loader: "custom"`).

## Dedicated image host

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
