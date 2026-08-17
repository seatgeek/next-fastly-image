import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FastlyImage } from "./component";

const render = (element: Parameters<typeof renderToStaticMarkup>[0]) => {
  const html = renderToStaticMarkup(element);
  const srcSet = /srcSet="([^"]*)"/i.exec(html)?.[1]?.replaceAll("&amp;", "&") ?? "";
  return { html, srcSet };
};

describe("FastlyImage", () => {
  it("defaults to the default preset", () => {
    const { srcSet } = render(<FastlyImage src="/hero.jpg" width={100} height={100} alt="" />);
    expect(srcSet).toContain("/hero.jpg?auto=webp&quality=75&width=");
    expect(srcSet).not.toContain("/_next/image");
  });

  it("accepts a named preset", () => {
    const { srcSet } = render(
      <FastlyImage src="/a.png" width={100} height={100} alt="" preset="thumbnail" />,
    );
    expect(srcSet).toContain("fit=crop");
    expect(srcSet).toContain("quality=60");
  });

  it("accepts ad-hoc options", () => {
    const { srcSet } = render(
      <FastlyImage src="/a.png" width={100} height={100} alt="" preset={{ blur: 50 }} />,
    );
    expect(srcSet).toContain("blur=50");
    expect(srcSet).toContain("quality=75");
  });

  it("passes fastlyConfig through (restricted strips foreign params)", () => {
    const { srcSet } = render(
      <FastlyImage
        src="/a.png?v=123"
        width={100}
        height={100}
        alt=""
        fastlyConfig={{ restricted: true }}
      />,
    );
    expect(srcSet).toContain("/a.png?auto=webp");
    expect(srcSet).not.toContain("v=123");
  });

  it("preserves foreign params by default", () => {
    const { srcSet } = render(<FastlyImage src="/a.png?v=123" width={100} height={100} alt="" />);
    expect(srcSet).toContain("v=123");
  });

  it("forwards standard next/image props like quality", () => {
    const { srcSet } = render(
      <FastlyImage src="/a.png" width={100} height={100} alt="" quality={90} />,
    );
    expect(srcSet).toContain("quality=90");
  });
});
