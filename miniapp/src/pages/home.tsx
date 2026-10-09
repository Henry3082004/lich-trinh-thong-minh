import React, { useEffect, useState } from "react";
import { useNavigate } from "zmp-ui";
import { Screen } from "../components/layout";
import { AddButton } from "../components/add-button";
import { BannerCarousel } from "../components/banner-carousel";
import { BANNERS } from "../lib/banners";
import { api, USE_MOCK } from "../lib/api";
import { openPortal, openVr } from "../lib/zalo";
import { useDraft } from "../state/draft";
import { categoryIcon, categoryName, type Place } from "../types";

// Ảnh bìa trang chủ: ảnh thật từ cổng du lịch, nền xanh phía sau đề phòng ảnh tải lỗi
const HERO = "https://static.dggv.edu.vn/360/1679365017974_123201-nam-nung-4.jpg";
const PLACES_TILE = "https://static.dggv.edu.vn/360/1679364818513_thien-vien-truc-lam-dao-nguyen-5.jpg";

// Các dải nội dung trên trang chủ (chỉ hiện dải có dữ liệu)
const RAILS = [
  { id: "le-hoi", title: "🎊 Lễ hội & sự kiện" },
  { id: "thien-nhien", title: "⛰️ Danh thắng thiên nhiên" },
  { id: "van-hoa", title: "🪘 Văn hoá & di tích" },
  { id: "dac-san", title: "🍜 Đặc sản nên thử" },
  { id: "am-thuc", title: "🍲 Quán ăn" },
  { id: "ca-phe", title: "☕ Quán cà phê" },
  { id: "trai-nghiem", title: "🏕️ Trải nghiệm" },
  { id: "luu-tru", title: "🛏️ Lưu trú" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { draft } = useDraft();
  const [places, setPlaces] = useState<Place[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Số liệu nhỏ trên hai ô phụ; lỗi thì chỉ không hiện số, không ảnh hưởng gì khác
  useEffect(() => {
    api.places().then(setPlaces).catch(() => {});
    api.myItineraries().then((l) => setSavedCount(l.length)).catch(() => {});
  }, []);

  return (
    <Screen back={false} cart>
      <div className="home">
        <BannerCarousel
          banners={BANNERS}
          onGo={(b) => navigate(b.to ?? (b.category && places.some((p) => p.category === b.category) ? `/places?category=${b.category}` : "/places"))}
        />

        <div className="home-body">
          <div className="home-cta card-soft">
            <p>Lướt xem chỗ chơi, món ngon, lễ hội, bấm "+ Thêm" những chỗ bạn thích rồi để AI xếp thành lịch trình và làm ảnh đẹp để gửi gia đình, bạn bè.</p>
            <div className="home-actions">
              <button className="act act-ai" onClick={() => navigate("/cart")}>
                <span className="act-ico" aria-hidden>✨</span>
                <b>Để AI lên lịch trình</b>
                <small>Chọn chỗ thích, AI xếp lịch cho bạn</small>
              </button>
              <button className="act act-vr" onClick={() => openVr()}>
                <span className="act-ico" aria-hidden>🥽</span>
                <b>Tham quan VR 3D</b>
                <small>Dạo Đắk Song 360°</small>
              </button>
              <button className="act" onClick={() => navigate("/my")}>
                <span className="act-ico" aria-hidden>⬇️</span>
                <b>Tải lịch trình</b>
                <small>Ảnh lịch trình của bạn</small>
              </button>
              <button className="act" onClick={() => navigate("/create")}>
                <span className="act-ico" aria-hidden>🖼️</span>
                <b>Tạo ảnh nhanh</b>
                <small>Tự nhập, không cần AI</small>
              </button>
              <button className="act" onClick={() => navigate("/places")}>
                <span className="act-ico" aria-hidden>🗺️</span>
                <b>Khám phá</b>
                <small>Địa điểm, món ngon</small>
              </button>
            </div>
          </div>

          {draft && (
            <button className="resume" onClick={() => navigate("/poster")}>
              <div>
                <div className="resume-title">Tiếp tục: {draft.title}</div>
                <div className="muted">{draft.schedule.length} ngày · chưa xong thì làm tiếp</div>
              </div>
              <span aria-hidden>›</span>
            </button>
          )}

          <div className="home-tiles">
            <button className="tile tile-photo" onClick={() => navigate("/places")}>
              <img src={PLACES_TILE} alt="" />
              <span className="tile-shade" />
              <span className="tile-text">
                <b>Điểm đến</b>
                {places.length > 0 && <small>{places.length} mục</small>}
              </span>
            </button>
            <button className="tile tile-sand" onClick={() => navigate("/my")}>
              <span className="tile-icon" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="4" y="5" width="16" height="15" rx="3" />
                  <path d="M4 10h16M9 3v4M15 3v4" />
                </svg>
              </span>
              <span className="tile-text">
                <b>Lịch của tôi</b>
                {savedCount !== null && <small>{savedCount} lịch đã lưu</small>}
              </span>
            </button>
          </div>

          {RAILS.map((r) => {
            const list = places.filter((p) => p.category === r.id);
            if (list.length === 0) return null;
            return (
              <section key={r.id} className="rail-section">
                <div className="rail-head">
                  <h2>{r.title}</h2>
                  <button className="btn-text" onClick={() => navigate(`/places?category=${r.id}`)}>
                    Xem tất cả ›
                  </button>
                </div>
                <div className="rail">
                  {list.map((p) => (
                    <div key={p.id} className="rail-card" onClick={() => navigate(`/place/${p.id}`)}>
                      <div className="rail-img">
                        {p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <span>{categoryIcon(p.category)}</span>}
                        <div className="rail-add">
                          <AddButton place={p} />
                        </div>
                      </div>
                      <div className="rail-name">{p.name}</div>
                      <div className="rail-sub">{p.kind === "festival" && (p.season || p.months.length) ? p.season || `Tháng ${p.months.join(", ")}` : categoryName(p.category)}</div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          <button className="btn-outline" onClick={() => openPortal()}>
            Xem thêm trên cổng du lịch <span aria-hidden>↗</span>
          </button>

          {USE_MOCK && <div className="notice">Đang dùng dữ liệu mẫu (chưa kết nối backend).</div>}
        </div>
      </div>
    </Screen>
  );
}
