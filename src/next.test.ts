import { describe, expect, it } from "vitest";
import { createFastlyLoader } from "./next";

const params = (url: string) => new URLSearchParams(url.split("?")[1]);

describe("createFastlyLoader", () => {
  it('defaults to the "default" preset', () => {
    const loader = createFastlyLoader();
    const out = loader({ src: "/img/a.png", width: 640 });
    expect(out).toBe("/img/a.png?auto=webp&quality=75&width=640");
  });

  it("accepts a named preset", () => {
    const loader = createFastlyLoader("thumbnail");
    const out = params(loader({ src: "/img/a.png", width: 128 }));
    expect(out.get("auto")).toBe("webp");
    expect(out.get("fit")).toBe("crop");
    expect(out.get("quality")).toBe("60");
    expect(out.get("width")).toBe("128");
  });

  it("accepts ad-hoc options instead of a preset", () => {
    const loader = createFastlyLoader({ format: "avif", blur: 50 });
    const out = params(loader({ src: "/img/a.png", width: 320 }));
    expect(out.get("format")).toBe("avif");
    expect(out.get("blur")).toBe("50");
    expect(out.get("quality")).toBe("75"); // falls back to DEFAULT_QUALITY
    expect(out.get("width")).toBe("320");
  });

  it("lets a per-image quality prop win over the preset quality", () => {
    const loader = createFastlyLoader("thumbnail");
    const out = params(loader({ src: "/img/a.png", width: 128, quality: 90 }));
    expect(out.get("quality")).toBe("90");
  });

  it("falls back to the preset quality when next/image passes none", () => {
    const loader = createFastlyLoader("thumbnail");
    const out = params(loader({ src: "/img/a.png", width: 128 }));
    expect(out.get("quality")).toBe("60");
  });

  it("always takes width from next/image, ignoring a preset width", () => {
    const loader = createFastlyLoader({ width: 9999 });
    const out = params(loader({ src: "/img/a.png", width: 640 }));
    expect(out.get("width")).toBe("640");
  });

  it("stays host-agnostic through the loader", () => {
    const loader = createFastlyLoader();
    expect(loader({ src: "https://images.myapp.com/a.png", width: 640 })).toBe(
      "https://images.myapp.com/a.png?auto=webp&quality=75&width=640",
    );
  });

  it("passes restricted mode through to fastlyImageUrl", () => {
    const loader = createFastlyLoader("default", { restricted: true });
    expect(loader({ src: "/img/a.png?v=123", width: 640 })).toBe(
      "/img/a.png?auto=webp&quality=75&width=640",
    );
  });

  it("builds distinct srcset candidate URLs per width, like next/image does", () => {
    const loader = createFastlyLoader();
    const widths = [640, 750, 1080, 1920];
    const urls = widths.map((width) => loader({ src: "/hero.jpg", width }));
    expect(new Set(urls).size).toBe(widths.length);
    for (const [i, url] of urls.entries()) {
      expect(params(url).get("width")).toBe(String(widths[i]));
    }
  });
});
