import {
  DEFAULT_QUALITY,
  FASTLY_IMAGE_PRESETS,
  type FastlyImageOptions,
  type FastlyImagePreset,
  type FastlyImageUrlConfig,
  fastlyImageUrl,
} from "./index";

/**
 * Structurally identical to next/image's `ImageLoaderProps` — deliberately
 * NOT imported from `next` so this entry stays dependency-free.
 * Upstream definition (stable since Next 13):
 * {@link https://github.com/vercel/next.js/blob/v16.3.1/packages/next/src/shared/lib/image-config.ts#L11-L15}
 * Assignability in both directions is compile-checked in `next-compat.test-d.ts`.
 */
type NextLoaderParams = { src: string; width: number; quality?: number };

/**
 * Build a next/image `loader` from a preset (or ad-hoc options), merging in
 * the per-render width/quality that next/image supplies. Pass a `config`
 * to enable behavior switches such as `restricted` (see FastlyImageUrlConfig).
 */
export function createFastlyLoader(
  preset: FastlyImagePreset | FastlyImageOptions = "default",
  config: FastlyImageUrlConfig = {},
): (params: NextLoaderParams) => string {
  const base: FastlyImageOptions =
    typeof preset === "string" ? FASTLY_IMAGE_PRESETS[preset] : preset;
  return ({ src, width, quality }: NextLoaderParams) =>
    fastlyImageUrl(
      src,
      {
        ...base,
        // Explicit per-image quality wins over the preset's default.
        quality: quality ?? base.quality ?? DEFAULT_QUALITY,
        width,
      },
      config,
    );
}
