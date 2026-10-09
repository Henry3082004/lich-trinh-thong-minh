// Bọc zmp-sdk. Khi chạy ngoài app Zalo (trình duyệt, giả lập) thì dùng cách thay thế
// để vẫn test được toàn bộ luồng.
import { randomId } from "./id";
import { getAccessToken, openOutApp, openPhone, openShareSheet, openWebview, saveImageToGallery } from "zmp-sdk/apis";

// Trang chủ cổng du lịch Đắk Song, đổi được bằng biến VITE_PORTAL_URL
export const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL as string | undefined) || "https://dulichdaksong.vnasw.vn";

export const isInZalo = () => /zalo/i.test(navigator.userAgent);

// Mỗi trình duyệt một mã riêng để "Lịch của tôi" không bị lẫn giữa người dùng thử
function browserUserId() {
  const KEY = "web-user-id";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export async function authHeaders(): Promise<Record<string, string>> {
  const guest = { "X-Dev-User": `${isInZalo() ? "zalo" : "web"}-${browserUserId()}` };
  if (!isInZalo()) {
    // Chỉ dùng được khi backend chạy AUTH_MODE=dev
    return guest;
  }
  try {
    const token = await getAccessToken();
    // Gửi kèm mã khách: backend dev/demo dùng nó khi thẻ Zalo không kiểm tra được; backend zalo (production) bỏ qua nó
    return token ? { Authorization: `Bearer ${token}`, ...guest } : guest;
  } catch {
    // Chưa cấp quyền hoặc Zalo không trả thẻ: vẫn dùng được với mã khách (chỉ khi backend ở chế độ dev/demo)
    return guest;
  }
}

export async function saveImage(dataUrl: string, fileName: string) {
  if (isInZalo()) {
    await saveImageToGallery({ imageBase64Data: dataUrl });
    return;
  }
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}

export async function shareText(text: string) {
  if (isInZalo()) {
    await openShareSheet({ type: "text", data: { text } });
    return;
  }
  if (navigator.share) {
    await navigator.share({ text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}

export async function openPortal() {
  if (isInZalo()) {
    await openWebview({ url: PORTAL_URL });
  } else {
    window.open(PORTAL_URL, "_blank");
  }
}

export async function callPhone(phoneNumber: string) {
  if (isInZalo()) await openPhone({ phoneNumber });
  else window.location.href = `tel:${phoneNumber}`;
}

// Link Google Maps / Facebook của điểm đến: mở trình duyệt ngoài Zalo
export async function openLink(url: string) {
  if (isInZalo()) await openOutApp({ url });
  else window.open(url, "_blank");
}

export type ShareResult = "shared" | "saved" | "downloaded";

// Gửi ảnh lịch trình cho người khác.
// Trong Zalo: tải ảnh lên backend để có link công khai rồi mở bảng chia sẻ ảnh của Zalo
// (openShareSheet chỉ nhận link ảnh). Lỗi thì lưu ảnh vào thư viện để người dùng tự gửi.
// Ngoài Zalo: chia sẻ tệp bằng Web Share nếu trình duyệt hỗ trợ, không thì tải về.
export async function shareImage(
  blob: Blob,
  fileName: string,
  dataUrlForSave: string,
  upload: (blob: Blob) => Promise<string>,
): Promise<ShareResult> {
  if (isInZalo()) {
    try {
      const url = await upload(blob);
      await openShareSheet({ type: "image", data: { imageUrls: [url] } });
      return "shared";
    } catch {
      await saveImage(dataUrlForSave, fileName);
      return "saved";
    }
  }

  const file = new File([blob], fileName, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Lịch trình Đắk Song" });
    return "shared";
  }
  await saveImage(dataUrlForSave, fileName);
  return "downloaded";
}
