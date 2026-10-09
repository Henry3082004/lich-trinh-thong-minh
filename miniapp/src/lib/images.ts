// Tải ảnh địa điểm qua proxy của backend rồi đổi thành data URL, để html-to-image nhúng
// được vào poster (máy chủ ảnh của cổng không có CORS nên không lấy thẳng được).
import { API_BASE, USE_MOCK } from "./api";

const cache = new Map<string, Promise<string | null>>();

export const proxiedUrl = (url: string) => `${API_BASE}/api/img?u=${encodeURIComponent(url)}`;

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Ảnh không đọc được"));
    };
    img.src = objectUrl;
  });
}

// Thu nhỏ về đúng cỡ cần dùng (ảnh gốc có thể 700 KB, 1280 px) để poster nhẹ và xuất ảnh nhanh
async function loadAndShrink(url: string, maxWidth: number): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const img = await blobToImage(await res.blob());
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null; // không có ảnh thì poster dùng hình thay thế, không bao giờ vỡ
  }
}

// Trả null nếu không tải được. Có nhớ kết quả để đổi mẫu/đổi tên không phải tải lại.
export function loadPhoto(url: string, maxWidth: number): Promise<string | null> {
  if (USE_MOCK) return Promise.resolve(null); // chế độ dữ liệu giả không có backend để làm trung gian
  const key = `${maxWidth}|${url}`;
  let p = cache.get(key);
  if (!p) {
    p = loadAndShrink(proxiedUrl(url), maxWidth);
    cache.set(key, p);
  }
  return p;
}

// Tải song song có giới hạn để không làm nghẽn mạng điện thoại
export async function loadPhotos(urls: string[], maxWidth: number, concurrency = 4): Promise<Map<string, string | null>> {
  const unique = [...new Set(urls)];
  const result = new Map<string, string | null>();
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, unique.length) }, async () => {
      while (next < unique.length) {
        const url = unique[next++];
        result.set(url, await loadPhoto(url, maxWidth));
      }
    }),
  );
  return result;
}

// Ảnh đóng gói sẵn trong app (nền poster): tải thẳng, không qua proxy. Lỗi thì dùng luôn đường dẫn gốc.
export function loadBundledPhoto(src: string, maxWidth: number): Promise<string> {
  const key = `local|${maxWidth}|${src}`;
  let p = cache.get(key);
  if (!p) {
    p = loadAndShrink(src, maxWidth);
    cache.set(key, p);
  }
  return p.then((d) => d ?? src);
}
