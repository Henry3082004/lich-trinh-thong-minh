// Nhận dạng định dạng ảnh bằng byte đầu của file (không tin header content-type:
// máy chủ ảnh của cổng trả "application/octet-stream" cho cả ảnh JPEG).
export type ImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export function sniffImage(buf: Uint8Array): ImageMime | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (
    buf.length >= 12 &&
    String.fromCharCode(...buf.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...buf.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buf.length >= 6 && String.fromCharCode(...buf.slice(0, 4)) === "GIF8") return "image/gif";
  return null;
}

export const extensionOf = (mime: ImageMime) => (mime === "image/jpeg" ? "jpg" : mime.split("/")[1]);
