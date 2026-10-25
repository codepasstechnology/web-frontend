import { describe, it, expect, vi, afterEach } from "vitest";
import { compressImage } from "@/lib/compressImage";

const photo = (bytes: number, type = "image/jpeg", name = "plot.jpeg") =>
  new File([new Uint8Array(bytes)], name, { type });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubBrowserImageTools(outputBytes: number) {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(() => Promise.resolve({ width: 4000, height: 3000, close: vi.fn() })),
  );
  const draw = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    fillRect: vi.fn(),
    drawImage: draw,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (callback) {
    callback(new Blob([new Uint8Array(outputBytes)], { type: "image/jpeg" }));
  });
  return draw;
}

describe("compressImage", () => {
  it("scales a large photo down to 2560px and re-encodes it as a smaller JPEG", async () => {
    const draw = stubBrowserImageTools(400_000);

    const result = await compressImage(photo(6_000_000, "image/png", "deed.png"));

    expect(result.name).toBe("deed.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBe(400_000);
    expect(draw).toHaveBeenCalledWith(expect.anything(), 0, 0, 2560, 1920);
  });

  it("keeps the original when compressing wouldn't make it smaller", async () => {
    stubBrowserImageTools(900_000);
    const original = photo(500_000);

    expect(await compressImage(original)).toBe(original);
  });

  it("leaves PDFs, GIFs and photos the browser can't decode untouched", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => Promise.reject(new Error("HEIC"))),
    );
    const pdf = photo(1_000, "application/pdf", "deed.pdf");
    const gif = photo(1_000, "image/gif", "plot.gif");
    const heic = photo(1_000, "image/heic", "plot.heic");

    expect(await compressImage(pdf)).toBe(pdf);
    expect(await compressImage(gif)).toBe(gif);
    expect(await compressImage(heic)).toBe(heic);
  });
});
