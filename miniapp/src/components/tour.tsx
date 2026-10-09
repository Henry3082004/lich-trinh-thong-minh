import React, { useEffect, useState } from "react";

// Hướng dẫn sử dụng lần đầu: làm tối màn hình, khoanh vùng nút cần bấm, mũi tên chỉ vào.
// Khách bấm đúng nút thì sang bước kế; bước nào chưa thấy nút (đang ở trang khác) thì chờ.
// Đã xem xong / bỏ qua thì nhớ trong localStorage. Mở lại: window.dispatchEvent(new Event("tour:start")).

type Step = { target?: string; title: string; text: string; next?: string; endOnClick?: boolean };

const STEPS: Step[] = [
  {
    title: "Chào bạn 👋",
    text: "App giúp bạn chọn chỗ chơi ở Đắk Song, để AI xếp lịch trình rồi tải ảnh lịch trình đẹp về máy. Mình chỉ bạn cách làm trong vài bước nhé!",
    next: "Bắt đầu",
  },
  {
    target: '[data-tour="party"]',
    title: "Chuyến đi của bạn",
    text: "Chọn hình thức chuyến đi, AI sẽ gợi ý địa điểm và lịch trình phù hợp cho bạn. Nếu muốn tự chọn từng địa điểm, hãy bấm Tiếp.",
    next: "Tiếp",
    endOnClick: true,
  },
  { target: '[data-tour="explore"]', title: "Khám phá Đắk Song", text: "Bấm vào đây để xem các địa điểm, món ngon, lễ hội." },
  { target: '[data-tour="place-card"]', title: "Chọn một chỗ", text: "Bấm vào một địa điểm bạn thích để xem thông tin." },
  { target: '[data-tour="add"]', title: "Thêm vào lịch trình", text: "Bấm nút này để bỏ địa điểm vào lịch trình của bạn." },
  { target: '[data-tour="cart"]', title: "Xem lịch trình", text: "Các chỗ đã chọn nằm ở đây. Bấm để xem." },
  {
    target: '[data-tour="ai-plan"]',
    title: "Để AI lên lịch",
    text: "Bấm để AI xếp lịch trình. Xong bạn bấm “Lưu ảnh” là tải ngay ảnh lịch trình về máy 📥",
  },
];

const KEY = "tour-done";
const isDone = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};
const markDone = () => {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* bỏ qua */
  }
};

// Phần tử đang hiện trên màn hình (khi chuyển trang có thể có 2 trang cùng lúc)
function findVisible(selector: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(selector));
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.left > -10 && r.left < window.innerWidth - 10) return el;
  }
  return null;
}

export function Tour() {
  const [step, setStep] = useState<number | null>(() => (isDone() ? null : 0));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cur = step === null ? null : STEPS[step];

  const finish = () => {
    markDone();
    setStep(null);
  };
  const next = () => setStep((s) => (s === null ? null : s + 1 >= STEPS.length ? (markDone(), null) : s + 1));

  // Mở lại hướng dẫn
  useEffect(() => {
    const start = () => setStep(0);
    window.addEventListener("tour:start", start);
    return () => window.removeEventListener("tour:start", start);
  }, []);

  // Theo dõi vị trí nút cần bấm
  useEffect(() => {
    if (!cur?.target) {
      setRect(null);
      return;
    }
    let scrolled = false;
    const tick = () => {
      const el = findVisible(cur.target!);
      if (el && !scrolled) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        scrolled = true;
      }
      setRect(el ? el.getBoundingClientRect() : null);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [step]);

  // Khách bấm đúng nút thì sang bước kế (không chặn thao tác của nút)
  useEffect(() => {
    if (!cur?.target) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest(cur.target!)) setTimeout(cur.endOnClick ? finish : next, 0);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [step]);

  if (!cur) return null;

  // Bước giới thiệu: hộp giữa màn hình
  if (!cur.target) {
    return (
      <div className="tour-layer tour-dim">
        <div className="tour-card center" role="dialog" aria-label="Hướng dẫn sử dụng">
          <b>{cur.title}</b>
          <p>{cur.text}</p>
          <div className="tour-actions">
            <button className="tour-skip" onClick={finish}>
              Bỏ qua
            </button>
            <button className="tour-next" onClick={next}>
              {cur.next ?? "Tiếp"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const skip = (
    <button className="tour-skip floating" onClick={finish}>
      Bỏ qua hướng dẫn ✕
    </button>
  );
  // Chưa thấy nút (đang ở trang khác): chỉ hiện nút bỏ qua
  if (!rect) return <div className="tour-layer">{skip}</div>;

  const pad = 6;
  const below = rect.top + rect.height / 2 < window.innerHeight / 2;
  const cardW = Math.min(300, window.innerWidth - 24);
  const cx = rect.left + rect.width / 2;
  const left = Math.max(12, Math.min(window.innerWidth - cardW - 12, cx - cardW / 2));
  const cardStyle: React.CSSProperties = below
    ? { top: rect.bottom + pad + 34, left, width: cardW }
    : { bottom: window.innerHeight - rect.top + pad + 34, left, width: cardW };
  const arrowStyle: React.CSSProperties = below
    ? { top: rect.bottom + pad + 2, left: cx - 14 }
    : { top: rect.top - pad - 32, left: cx - 14 };

  return (
    <div className="tour-layer">
      <div
        className="tour-hole"
        style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
      />
      <div className={`tour-arrow ${below ? "up" : "down"}`} style={arrowStyle} aria-hidden>
        {below ? "👆" : "👇"}
      </div>
      <div className="tour-card" style={cardStyle} role="dialog" aria-label="Hướng dẫn sử dụng">
        <b>
          {cur.title} <small>{step}/{STEPS.length - 1}</small>
        </b>
        <p>{cur.text}</p>
        {cur.next && (
          <div className="tour-actions">
            <button className="tour-next" onClick={next}>
              {cur.next}
            </button>
          </div>
        )}
      </div>
      {skip}
    </div>
  );
}
