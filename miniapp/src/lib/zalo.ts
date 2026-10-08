// Bọc zmp-sdk. Khi chạy ngoài app Zalo (trình duyệt, giả lập) thì dùng cách thay thế
// để vẫn test được toàn bộ luồng.
import { randomId } from "./id";
import { getAccessToken, openOutApp, openPhone, openShareSheet, openWebview, saveImageToGallery } from "zmp-sdk/apis";

export const PORTAL_URL = "https://daksong-daknong.vnasw.vn/";

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
  if (!isInZalo()) {
    // Chỉ dùng được khi backend chạy AUTH_MODE=dev
    return { "X-Dev-User": `web-${browserUserId()}` };
  }
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
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
