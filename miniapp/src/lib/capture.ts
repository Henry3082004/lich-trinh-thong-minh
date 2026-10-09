import { toJpeg, toPng } from "html-to-image";

// Safari/WKWebView (iOS, kể cả Zalo trên iPhone) hay vẽ thiếu ảnh ở lần chụp đầu
// nên chụp một lần "làm nóng" rồi chụp lần thật.
const isWebKit = () => /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Android/.test(navigator.userAgent);

async function decodeImages(node: HTMLElement) {
  await Promise.all([...node.querySelectorAll("img")].map((img) => img.decode().catch(() => undefined)));
}

type Options = { pixelRatio: number; quality?: number };

// html-to-image: skipFonts vì poster chỉ dùng font hệ thống, khỏi tải font icon của zmp-ui
const base = { cacheBust: false, skipFonts: true } as const;

export async function capturePoster(node: HTMLElement, kind: "png" | "jpeg", { pixelRatio, quality = 0.9 }: Options): Promise<string> {
  await document.fonts.ready;
  await decodeImages(node);
  const run = () =>
    kind === "png" ? toPng(node, { ...base, pixelRatio }) : toJpeg(node, { ...base, pixelRatio, quality, backgroundColor: "#ffffff" });
  if (isWebKit()) await run();
  return run();
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

// Ảnh để lưu: thử từ nét nhất xuống, lấy cách đầu tiên ra chuỗi dưới maxChars
// (Zalo saveImageToGallery chỉ nhận tối đa 7.000.000 ký tự base64). Bước nào lỗi (hết bộ nhớ) thì thử bước sau.
const SAVE_STEPS: { kind: "png" | "jpeg"; pixelRatio: number; quality?: number }[] = [
  { kind: "png", pixelRatio: 2 },
  { kind: "jpeg", pixelRatio: 2, quality: 0.92 },
  { kind: "jpeg", pixelRatio: 1.5, quality: 0.9 },
  { kind: "jpeg", pixelRatio: 1, quality: 0.85 },
];

export async function captureForSave(node: HTMLElement, maxChars: number): Promise<{ dataUrl: string; ext: "png" | "jpg" }> {
  let lastError: unknown = new Error("Ảnh lịch trình quá lớn");
  for (const step of SAVE_STEPS) {
    try {
      const dataUrl = await capturePoster(node, step.kind, step);
      if (dataUrl.length <= maxChars) return { dataUrl, ext: step.kind === "png" ? "png" : "jpg" };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}
