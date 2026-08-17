/**
 * Options for the Fastly Image Optimizer.
 *
 * Every key is named exactly like the corresponding Fastly IO query parameter,
 * so serialization is a plain loop and the
 * {@link https://www.fastly.com/documentation/reference/io/ | Fastly IO reference}
 * doubles as this type's documentation. Compound values (e.g. `crop`) are
 * passed through as strings in Fastly's own syntax.
 */
export type FastlyImageOptions = {
  /** Output width: px int 1–8192, fraction 0–0.99 of source, or `"Np"` percent (e.g. `"250p"`). */
  width?: number | string;
  /** Output height: px int 1–8192, fraction 0–0.99 of source, or `"Np"` percent. */
  height?: number | string;
  /**
   * Lossy compression quality 1–100. Optional second value applies when
   * `auto=webp` negotiates (e.g. `"85,75"`). Fastly's service default is 85;
   * this package defaults to 75 to match next/image.
   */
  quality?: number | string;
  /** Device pixel ratio multiplier 1–10 (decimals allowed) applied to width/height. */
  dpr?: number;
  /** How the image fits the width+height box: contain, cover, or exact center-crop. Requires both width and height. */
  fit?: "bounds" | "cover" | "crop";
  /** Content-negotiated modern format via the Accept header. Single value only; `format=auto` takes precedence. `avif` is a paid Fastly feature. */
  auto?: "webp" | "avif";
  /** Explicit output format (overrides content negotiation). Default keeps the source format. */
  format?:
    | "auto"
    | "avif"
    | "bjpg"
    | "gif"
    | "jpg"
    | "jxl"
    | "mp4"
    | "pjpg"
    | "pjxl"
    | "png"
    | "png8"
    | "svg"
    | "webp"
    | "webpll"
    | "webply";
  /** Crop region: `"w,h"` px/% or `"wr:hr"` ratio, optional `x`/`y` or `offset-x`/`offset-y` position, `smart`/`safe` flags. E.g. `"16:9,smart"`, `"1000,500,x400,y50"`. */
  crop?: string;
  /** Same syntax as `crop`, but applied before all other transformations. */
  precrop?: string;
  /** Gaussian blur radius: 0.5–1000 px, or `"Np"` percent of image dimensions (e.g. `"0.5p"`). */
  blur?: number | string;
  /** Rotate/flip: `r`/`l` (rotate), `h`/`v`/`hv` (flip) and combinations, or EXIF orientation digits `1`–`8`. Default `1`. */
  orient?:
    | "r"
    | "l"
    | "h"
    | "v"
    | "hv"
    | "vh"
    | "rv"
    | "vr"
    | "lv"
    | "vl"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8";
  /** Background fill for pad/canvas/transparency: hex without `#` (`"cf23a5"`), `"r,g,b"` (0–255), or `"r,g,b,a"` (alpha 0–1). */
  "bg-color"?: string;
  /** Brightness adjustment, -100 (black) to 100 (white). Default 0. */
  brightness?: number;
  /** Contrast adjustment, -100 (solid grey) to 100. Default 0. */
  contrast?: number;
  /** Color saturation adjustment, -100 (grayscale) to 100. Default 0. */
  saturation?: number;
  /** Unsharp mask `"a{amount},r{radius},t{threshold}"`: amount 0–10, radius 0.5–1000, threshold 0–255. E.g. `"a5,r2,t1"`. */
  sharpen?: string;
  /** Remove pixels from edges, CSS shorthand of 1–4 comma-separated values (px, or <1 fraction = percent). E.g. `"25,50,75,100"`. */
  trim?: number | string;
  /** Add pixels to edges, CSS shorthand of 1–4 comma-separated values (px, or <1 fraction = percent). Ignored when `canvas` is set. */
  pad?: number | string;
  /** Canvas size `"w,h"` px/% or `"wr:hr"` ratio, optional `x`/`y` or `offset-x`/`offset-y` position. Image is centered by default. */
  canvas?: string;
  /** Resampling filter used when scaling. Default `lanczos3`. */
  "resize-filter"?: "nearest" | "bilinear" | "bicubic" | "lanczos2" | "lanczos3";
  /** Extract the first frame of an animated GIF. Only value `1` is supported. */
  frame?: 1 | "1";
  /** Automatic compression level for JPEG/WebP/AVIF output. An explicit `quality` takes precedence. */
  optimize?: "low" | "medium" | "high";
  /** H.264 encoder profile, only with `format=mp4`. Default `baseline`. */
  profile?: "baseline" | "main" | "high";
  /** H.264 level, only with `format=mp4`. Default `"3.0"`. */
  level?:
    | "1.0"
    | "1.1"
    | "1.2"
    | "1.3"
    | "2.0"
    | "2.1"
    | "2.2"
    | "3.0"
    | "3.1"
    | "3.2"
    | "4.0"
    | "4.1"
    | "4.2"
    | "5.0"
    | "5.1"
    | "5.2"
    | "6.0"
    | "6.1"
    | "6.2";
  /** Metadata to preserve (everything is stripped by default): `copyright` (JPEG only), `c2pa`, or both. */
  metadata?: "copyright" | "c2pa" | "copyright,c2pa";
  /** Enable disabled-by-default features. Only value: `upscale` (with width/height/dpr). */
  enable?: "upscale";
  /** Disable default features. Only value: `upscale` (with width/height/dpr). */
  disable?: "upscale";
  /** 1-bit black & white: `"threshold"` (optional luminance 0–100, e.g. `"threshold,75"`) or `"atkinson"` dithering. */
  bw?: string;
  /** SVG output only: `1` replaces width/height attributes with a viewBox for responsive scaling. */
  viewbox?: 1 | "1";
};

/** Default lossy quality, matching next/image's default of 75 (Fastly's own service default is 85). */
export const DEFAULT_QUALITY = 75;

export const FASTLY_IMAGE_PRESETS = {
  /** Full-size content images: negotiate webp, default quality. */
  default: { auto: "webp", quality: DEFAULT_QUALITY },
  /** Small previews: crop to the box, cheaper quality. */
  thumbnail: { auto: "webp", fit: "crop", quality: 60 },
} as const satisfies Record<string, FastlyImageOptions>;

export type FastlyImagePreset = keyof typeof FASTLY_IMAGE_PRESETS;

/**
 * Every valid Fastly IO query parameter name, as a runtime list.
 * `satisfies` guarantees each entry is a real `FastlyImageOptions` key;
 * a unit test guarantees the list is complete.
 */
export const FASTLY_IMAGE_PARAM_NAMES = [
  "width",
  "height",
  "quality",
  "dpr",
  "fit",
  "auto",
  "format",
  "crop",
  "precrop",
  "blur",
  "orient",
  "bg-color",
  "brightness",
  "contrast",
  "saturation",
  "sharpen",
  "trim",
  "pad",
  "canvas",
  "resize-filter",
  "frame",
  "optimize",
  "profile",
  "level",
  "metadata",
  "enable",
  "disable",
  "bw",
  "viewbox",
] as const satisfies readonly (keyof FastlyImageOptions)[];

const FASTLY_PARAM_SET: ReadonlySet<string> = new Set(FASTLY_IMAGE_PARAM_NAMES);

/** Behavior switches for {@link fastlyImageUrl} (all off by default). */
export type FastlyImageUrlConfig = {
  /**
   * When true, query params already present on `src` that are not valid
   * Fastly IO params (e.g. cache busters like `?v=123`) are removed, so the
   * output carries only Fastly IO params. Off by default — stripping params
   * changes the URL your origin receives and the CDN cache key.
   */
  restricted?: boolean;
};

/**
 * Serialize options into `URLSearchParams`, skipping undefined values.
 * Key order follows the option object; keys are Fastly IO param names verbatim.
 */
export function fastlyImageSearchParams(options: FastlyImageOptions): URLSearchParams {
  return new URLSearchParams(
    Object.entries(options)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
}

/** Parse `src` against a placeholder base so relative paths are parseable; undefined if unparseable. */
function parseImageUrl(src: string): URL | undefined {
  try {
    return new URL(src, "resolve://resolve");
  } catch {
    return undefined;
  }
}

/** Only site-/protocol-relative paths and absolute http(s) URLs can carry IO params. */
function canCarryParams(src: string, url: URL): boolean {
  return src.startsWith("/") || url.protocol === "http:" || url.protocol === "https:";
}

/** Restricted mode: drop query params that are not valid Fastly IO param names. */
function stripForeignParams(params: URLSearchParams): void {
  [...params.keys()]
    .filter((key) => !FASTLY_PARAM_SET.has(key))
    .forEach((key) => {
      params.delete(key);
    });
}

/** Merge serialized options into existing params, overwriting same-key entries. */
function applyOptions(params: URLSearchParams, options: FastlyImageOptions): void {
  fastlyImageSearchParams(options).forEach((value, key) => {
    params.set(key, value);
  });
}

/** Re-emit the URL in the same shape the caller gave us (relative, protocol-relative, or absolute). */
function serializeImageUrl(src: string, url: URL): string {
  if (src.startsWith("//")) return `//${url.host}${url.pathname}${url.search}${url.hash}`;
  if (src.startsWith("/")) return url.pathname + url.search + url.hash;
  return url.href;
}

/**
 * Append Fastly IO params to `src`, preserving any existing query params
 * (e.g. cache busters). Accepts site-relative paths (`/a.png`),
 * protocol-relative URLs (`//images.example.com/a.png`), and absolute
 * http(s) URLs on any host — the origin is never inspected or rewritten.
 *
 * Anything that can't carry IO params is returned unchanged: unparseable
 * strings, non-http(s) schemes (`data:`, `blob:`, …), and paths without a
 * leading slash.
 */
export function fastlyImageUrl(
  src: string,
  options: FastlyImageOptions,
  config: FastlyImageUrlConfig = {},
): string {
  const url = parseImageUrl(src);
  if (!url || !canCarryParams(src, url)) return src;

  if (config.restricted) stripForeignParams(url.searchParams);
  applyOptions(url.searchParams, options);

  return serializeImageUrl(src, url);
}
