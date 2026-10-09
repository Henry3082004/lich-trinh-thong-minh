import React, { useEffect, useState } from "react";
import { PlaceImg } from "../components/place-card";
import { useNavigate } from "zmp-ui";
import { Screen } from "../components/layout";
import { BannerCarousel } from "../components/banner-carousel";
import { BANNERS } from "../lib/banners";
import { api, USE_MOCK } from "../lib/api";
import { useTrip } from "../state/trip";
import { useCart } from "../state/cart";
import type { Party } from "../types";
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

const PARTIES: { id: Party; icon: string; name: string; people: number; kids: number }[] = [
  { id: "solo", icon: "🧍", name: "Solo travel", people: 1, kids: 0 },
  { id: "couple", icon: "💑", name: "Couple", people: 2, kids: 0 },
  { id: "friends", icon: "🧑‍🤝‍🧑", name: "Nhóm bạn", people: 4, kids: 0 },
  { id: "family", icon: "👨‍👩‍👧", name: "Gia đình", people: 4, kids: 1 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { has: inCart } = useCart();
  const { prefs, setPrefs } = useTrip();
  const pickParty = (id: Party, people: number, kids: number) => setPrefs({ ...prefs, party: prefs.party === id ? undefined : id, people, kids });
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
          onGo={(b) => navigate(b.collection ? `/places?collection=${b.collection}` : b.to ?? (b.category && places.some((p) => p.category === b.category) ? `/places?category=${b.category}` : "/places"))}
        />

        <div className="home-body">
          <div className="home-cta card-soft">
            <div className="party">
              <div className="party-label">Bạn đi:</div>
              <div className="party-chips" role="group" aria-label="Bạn đi cùng ai">
                {PARTIES.map((x) => (
                  <button key={x.id} className={`party-chip${prefs.party === x.id ? " on" : ""}`} aria-pressed={prefs.party === x.id} onClick={() => pickParty(x.id, x.people, x.kids)}>
                    <span aria-hidden>{x.icon}</span> {x.name}
                  </button>
                ))}
              </div>
            </div>
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
                        <PlaceImg place={p} fallback={<span>{categoryIcon(p.category)}</span>} />
                        {inCart(p.id) && <span className="in-cart-badge">✓ Trong lịch trình</span>}
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
