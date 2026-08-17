import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUALITY,
  FASTLY_IMAGE_PARAM_NAMES,
  FASTLY_IMAGE_PRESETS,
  type FastlyImageOptions,
  fastlyImageSearchParams,
  fastlyImageUrl,
} from "./index";

describe("fastlyImageUrl", () => {
  describe("invariant 1 — host-agnostic", () => {
    it("keeps relative input relative", () => {
      expect(fastlyImageUrl("/img/a.png", { width: 640 })).toBe("/img/a.png?width=640");
    });

    it.each([
      "https://images.myapp.com/a.png",
      "https://static.myapp.com/a.png",
      "https://assets.myapp.com/a.png",
      "http://images.myapp.com/a.png",
      "https://assets.myapp.com:8443/a.png",
    ])("preserves the origin of %s", (src) => {
      const out = fastlyImageUrl(src, { width: 640 });
      expect(out).toBe(`${src}?width=640`);
    });

    it("supports protocol-relative URLs without dropping the host", () => {
      expect(fastlyImageUrl("//images.myapp.com/a.png", { width: 640 })).toBe(
        "//images.myapp.com/a.png?width=640",
      );
    });
  });

  describe("invariant 2 — existing query params are preserved", () => {
    it("appends after existing params", () => {
      expect(fastlyImageUrl("/a.png?t=123", { auto: "webp", quality: 75, width: 640 })).toBe(
        "/a.png?t=123&auto=webp&quality=75&width=640",
      );
    });

    it("overwrites a same-key param instead of duplicating it", () => {
      expect(fastlyImageUrl("/a.png?width=100", { width: 640 })).toBe("/a.png?width=640");
    });

    it("preserves params on absolute URLs", () => {
      expect(fastlyImageUrl("https://static.myapp.com/a.png?v=abc", { width: 640 })).toBe(
        "https://static.myapp.com/a.png?v=abc&width=640",
      );
    });
  });

  describe("invariant 3 — unusable input is returned unchanged", () => {
    it.each([
      "https://",
      "data:image/png;base64,iVBOR",
      "blob:https://myapp.com/uuid",
      "img/a.png",
      "",
    ])("returns %j unchanged", (src) => {
      expect(fastlyImageUrl(src, { width: 640, auto: "webp" })).toBe(src);
    });
  });

  describe("invariant 4 — every option key maps 1:1 to a Fastly IO query param", () => {
    const allOptions: Required<FastlyImageOptions> = {
      width: 640,
      height: 480,
      quality: 80,
      dpr: 2,
      fit: "cover",
      auto: "webp",
      format: "pjpg",
      crop: "16:9,smart",
      precrop: "1000,500,x400,y50",
      blur: "0.5p",
      orient: "hv",
      "bg-color": "0,255,0,0.5",
      brightness: 10,
      contrast: -5,
      saturation: -100,
      sharpen: "a5,r2,t1",
      trim: "25,50,75,100",
      pad: "0.25",
      canvas: "320:240,offset-x50",
      "resize-filter": "lanczos3",
      frame: 1,
      optimize: "medium",
      profile: "main",
      level: "4.1",
      metadata: "copyright,c2pa",
      enable: "upscale",
      disable: "upscale",
      bw: "threshold,75",
      viewbox: 1,
    };

    it.each(Object.entries(allOptions))("round-trips %s", (key, value) => {
      const out = fastlyImageUrl("/a.png", { [key]: value });
      const params = new URLSearchParams(out.split("?")[1]);
      expect(params.get(key)).toBe(String(value));
    });

    it("serializes every option at once with no renaming", () => {
      const out = fastlyImageUrl("/a.png", allOptions);
      const params = new URLSearchParams(out.split("?")[1]);
      expect([...params.keys()].sort()).toEqual(Object.keys(allOptions).sort());
    });

    it("FASTLY_IMAGE_PARAM_NAMES lists exactly the FastlyImageOptions keys", () => {
      // allOptions is Required<FastlyImageOptions>, so its keys are the full
      // compile-time key set; the runtime list must match it 1:1.
      expect([...FASTLY_IMAGE_PARAM_NAMES].sort()).toEqual(Object.keys(allOptions).sort());
    });
  });

  describe("restricted mode", () => {
    it("is off by default — foreign params are preserved", () => {
      expect(fastlyImageUrl("/a.png?v=123", { width: 640 })).toBe("/a.png?v=123&width=640");
    });

    it("strips non-Fastly params like cache busters when enabled", () => {
      expect(
        fastlyImageUrl("/a.png?v=123&utm_source=mail", { width: 640 }, { restricted: true }),
      ).toBe("/a.png?width=640");
    });

    it("keeps valid Fastly params already present on the src", () => {
      expect(fastlyImageUrl("/a.png?quality=90&v=123", { width: 640 }, { restricted: true })).toBe(
        "/a.png?quality=90&width=640",
      );
    });

    it("works on absolute URLs without touching the origin", () => {
      expect(
        fastlyImageUrl(
          "https://images.myapp.com/a.png?sig=abc",
          { width: 640 },
          { restricted: true },
        ),
      ).toBe("https://images.myapp.com/a.png?width=640");
    });

    it("leaves unusable input unchanged even when enabled", () => {
      expect(
        fastlyImageUrl("data:image/png;base64,x?v=1", { width: 640 }, { restricted: true }),
      ).toBe("data:image/png;base64,x?v=1");
    });
  });

  describe("value handling", () => {
    it("skips undefined values", () => {
      expect(fastlyImageUrl("/a.png", { width: 640, height: undefined })).toBe("/a.png?width=640");
    });

    it("keeps falsy-but-defined values like 0", () => {
      expect(fastlyImageUrl("/a.png", { brightness: 0 })).toBe("/a.png?brightness=0");
    });

    it("produces the src untouched when no options apply", () => {
      expect(fastlyImageUrl("/a.png", {})).toBe("/a.png");
    });

    it("keeps percent-encoded paths intact", () => {
      expect(fastlyImageUrl("https://images.myapp.com/%C3%A9.png", { width: 1 })).toBe(
        "https://images.myapp.com/%C3%A9.png?width=1",
      );
    });

    it("encodes unencoded spaces the way URL does", () => {
      expect(fastlyImageUrl("/path with spaces/a b.png", { width: 1 })).toBe(
        "/path%20with%20spaces/a%20b.png?width=1",
      );
    });
  });

  describe("hash fragments", () => {
    it("keeps the fragment on relative paths, after the query", () => {
      expect(fastlyImageUrl("/a.png#frag", { width: 640 })).toBe("/a.png?width=640#frag");
    });

    it("keeps the fragment on absolute URLs, after the query", () => {
      expect(fastlyImageUrl("https://images.myapp.com/a.png#frag", { width: 640 })).toBe(
        "https://images.myapp.com/a.png?width=640#frag",
      );
    });

    it("keeps the fragment on protocol-relative URLs", () => {
      expect(fastlyImageUrl("//images.myapp.com/a.png#frag", { width: 640 })).toBe(
        "//images.myapp.com/a.png?width=640#frag",
      );
    });
  });
});

describe("fastlyImageSearchParams", () => {
  it("serializes defined options in object order", () => {
    const params = fastlyImageSearchParams({ auto: "webp", quality: 75, width: 640 });
    expect(params.toString()).toBe("auto=webp&quality=75&width=640");
  });

  it("skips undefined values and stringifies the rest", () => {
    const params = fastlyImageSearchParams({ width: 640, height: undefined, brightness: 0 });
    expect([...params.entries()]).toEqual([
      ["width", "640"],
      ["brightness", "0"],
    ]);
  });

  it("returns empty params for an empty options object", () => {
    expect(fastlyImageSearchParams({}).size).toBe(0);
  });
});

describe("presets", () => {
  it("default preset negotiates webp at the package default quality", () => {
    expect(FASTLY_IMAGE_PRESETS.default).toEqual({ auto: "webp", quality: DEFAULT_QUALITY });
  });

  it("thumbnail preset crops at reduced quality", () => {
    expect(FASTLY_IMAGE_PRESETS.thumbnail).toEqual({ auto: "webp", fit: "crop", quality: 60 });
  });

  it("DEFAULT_QUALITY matches the next/image default", () => {
    expect(DEFAULT_QUALITY).toBe(75);
  });
});
