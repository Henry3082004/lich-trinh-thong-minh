import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconArrowRight, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { Banner } from "../lib/banners";

const AUTOPLAY_MS = 3200;
const SLIDE_MS = 650;
const DRAG_MIN_PX = 50;

// Banner lớn: tự lướt sang phải mỗi vài giây, kéo/vuốt để qua lại, vòng tròn không có điểm đầu cuối.
// Tạm dừng khi rê chuột / đang kéo / tab bị ẩn; tôn trọng chế độ giảm chuyển động (không tự lướt).
export function BannerCarousel({ banners, onGo }: { banners: Banner[]; onGo: (b: Banner) => void }) {
  const n = banners.length;
  const [pos, setPos] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const moved = useRef(false);
  const reduced = useRef(false);

  useEffect(() => {
    try {
      reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduced.current = false;
    }
  }, []);

  const go = useCallback((d: number) => setPos((p) => (p + d + n) % n), [n]);

  // Tự lướt: mỗi lần đổi trang (kể cả do khách kéo) bộ đếm bắt đầu lại
  useEffect(() => {
    if (n < 2 || hover || dragging || reduced.current) return;
    const t = setTimeout(() => {
      if (!document.hidden) go(1);
    }, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [pos, hover, dragging, n, go]);

  // Dùng ref cho logic kéo (không phụ thuộc lần render) và state chỉ để vẽ
  const dragRef = useRef(0);
  const draggingRef = useRef(false);
  const capturedRef = useRef(false);

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    dragRef.current = 0;
    moved.current = false;
    capturedRef.current = false;
    draggingRef.current = true;
    setDragging(true);
  };
  const move = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startX.current;
    if (!moved.current && Math.abs(dx) > 6) {
      moved.current = true;
      // chỉ "bắt" con trỏ khi thật sự đang kéo, để nút bên trong (chấm, mũi tên, nút bấm) vẫn bấm được bình thường
      if (!capturedRef.current) {
        capturedRef.current = true;
        try {
          boxRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // trình duyệt không hỗ trợ: vẫn kéo được trong khung
        }
      }
    }
    dragRef.current = dx;
    setDrag(dx);
  };
  const up = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const dx = dragRef.current;
    const w = boxRef.current?.clientWidth ?? 360;
    if (Math.abs(dx) > Math.max(DRAG_MIN_PX, w * 0.15)) go(dx < 0 ? 1 : -1);
    dragRef.current = 0;
    setDrag(0);
    setDragging(false);
  };

  // Vị trí từng trang so với trang hiện tại, chuẩn hoá để vòng tròn liền mạch
  const offsetOf = (i: number) => {
    let d = (((i - pos) % n) + n) % n;
    if (d > n / 2) d -= n;
    return d;
  };

  return (
    <section
      ref={boxRef}
      className="banner"
      aria-roledescription="carousel"
      aria-label="Nổi bật ở Đắk Song"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClickCapture={(e) => {
        // vừa kéo xong thì không tính là bấm nút
        if (moved.current) {
          e.preventDefault();
          e.stopPropagation();
          moved.current = false;
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      {banners.map((b, i) => {
        const d = offsetOf(i);
        const active = d === 0;
        return (
          <div
            key={b.id}
            className="banner-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} trên ${n}`}
            aria-hidden={!active}
            style={{
              transform: `translateX(calc(${d * 100}% + ${drag}px))`,
              // chỉ trang ở gần (đang thấy hoặc sắp thấy) mới có hiệu ứng trượt; trang ở xa nhảy vị trí ngay
              transition: dragging || reduced.current || Math.abs(d) > 1 ? "none" : `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          >
            <img src={b.image} alt="" draggable={false} decoding="async" loading={i === 0 ? "eager" : "lazy"} {...(i === 0 ? { fetchpriority: "high" } : {})} />
            <div className="banner-shade" />
            <div className="banner-text">
              <span className="banner-tag">
                <b.icon size={16} stroke={2} aria-hidden />
                {b.tag}
              </span>
              <h2>{b.title}</h2>
              <p>{b.subtitle}</p>
              <button className="banner-cta" tabIndex={active ? 0 : -1} onClick={() => onGo(b)}>
                {b.cta} <IconArrowRight size={16} stroke={2} aria-hidden />
              </button>
            </div>
          </div>
        );
      })}

      <button className="banner-arrow prev" aria-label="Banner trước" onClick={() => go(-1)}>
        <IconChevronLeft size={22} stroke={2} />
      </button>
      <button className="banner-arrow next" aria-label="Banner kế tiếp" onClick={() => go(1)}>
        <IconChevronRight size={22} stroke={2} />
      </button>
      <div className="banner-dots">
        {banners.map((b, i) => (
          <button key={b.id} aria-label={`Banner ${i + 1}`} aria-current={i === pos} onClick={() => setPos(i)} />
        ))}
      </div>
    </section>
  );
}
