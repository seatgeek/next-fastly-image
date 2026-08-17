"use client";

import Image, { type ImageProps } from "next/image";
import type { FastlyImageOptions, FastlyImagePreset, FastlyImageUrlConfig } from "./index";
import { createFastlyLoader } from "./next";

export type FastlyImageProps = Omit<ImageProps, "loader"> & {
  /** Preset name or ad-hoc Fastly IO options for this image. Defaults to the `default` preset. */
  preset?: FastlyImagePreset | FastlyImageOptions;
  /** Behavior switches passed through to `fastlyImageUrl` (e.g. `restricted`). */
  fastlyConfig?: FastlyImageUrlConfig;
};

/**
 * `next/image` with the Fastly loader baked in - for apps that mix loaders.
 *
 * Use this instead of a global `loaderFile` when only *some* images go
 * through Fastly IO: `<FastlyImage>` routes its image to Fastly, while plain
 * `<Image>` elsewhere keeps the built-in `/_next/image` optimizer.
 *
 * This is a Client Component (`"use client"`) because it passes a loader
 * function to `next/image`; rendering it from Server Components is fine.
 * Importing it requires the optional `next` and `react` peer dependencies -
 * the core and `/next` entry points remain zero-dependency.
 */
export function FastlyImage({ preset, fastlyConfig, ...rest }: FastlyImageProps) {
  return <Image loader={createFastlyLoader(preset, fastlyConfig)} {...rest} />;
}
