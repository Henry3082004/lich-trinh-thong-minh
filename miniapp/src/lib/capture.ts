import { toJpeg, toPng } from "html-to-image";

// Safari/WKWebView (iOS, kể cả Zalo trên iPhone) hay vẽ thiếu ảnh ở lần chụp đầu
// nên chụp một lần "làm nóng" rồi chụp lần thật.
const isWebKit = () => /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Android/.test(navigator.userAgent);

async function decodeImages(node: HTMLElement) {
  await Promise.all([...node.querySelectorAll("img")].map((img) => img.decode().catch(() => undefined)));
}

type Options = { pixelRatio: number };

// html-to-image: skipFonts vì poster chỉ dùng font hệ thống, khỏi tải font icon của zmp-ui
const base = { cacheBust: false, skipFonts: true } as const;

export async function capturePoster(node: HTMLElement, kind: "png" | "jpeg", { pixelRatio }: Options): Promise<string> {
  await document.fonts.ready;
  await decodeImages(node);
  const run = () =>
    kind === "png" ? toPng(node, { ...base, pixelRatio }) : toJpeg(node, { ...base, pixelRatio, quality: 0.9, backgroundColor: "#ffffff" });
  if (isWebKit()) await run();
  return run();
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}
