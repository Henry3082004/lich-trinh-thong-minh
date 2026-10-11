import React, { useEffect, useState } from "react";
import { PlaceImg } from "../components/place-card";
import { useNavigate } from "zmp-ui";
import { Screen } from "../components/layout";
import { BannerCarousel } from "../components/banner-carousel";
import { BANNERS } from "../lib/banners";
import { api, USE_MOCK } from "../lib/api";
import { useTrip } from "../state/trip";
import { useCart } from "../state/cart";
import { CartButton } from "../components/cart-button";
import type { Party } from "../types";
import { openPortal, openVr } from "../lib/zalo";
import { categoryName, type Place } from "../types";
import { CatIcon, ImgFallback } from "../components/icons";
import { monthsUntil } from "../lib/collections";
import {
  Icon3dCubeSphere,
  IconBabyCarriage,
  IconCalendar,
  IconCalendarEvent,
  IconCheck,
  IconChevronRight,
  IconCompass,
  IconExternalLink,
  IconHeart,
  IconHelpCircle,
  IconHome,
  IconLeaf,
  IconMapPin,
  IconPointFilled,
  IconSearch,
  IconSparkles,
  IconUser,
  IconUsersGroup,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

const PLACES_TILE = "https://static.dggv.edu.vn/360/1679364818513_thien-vien-truc-lam-dao-nguyen-5.jpg";
// Ảnh nền ô "Lịch của tôi": thác ở khu bảo tồn Nâm Nung (ảnh lỗi thì còn nền nâu chuyển màu)
const MY_TILE = "https://static.dggv.edu.vn/360/1679365017974_123201-nam-nung-4.jpg";

// Các dải nội dung trên trang chủ (chỉ hiện dải có dữ liệu)
const RAILS = [
  { id: "le-hoi", title: "Lễ hội & sự kiện" },
  { id: "thien-nhien", title: "Danh thắng thiên nhiên" },
  { id: "van-hoa", title: "Văn hoá & di tích" },
  { id: "dac-san", title: "Đặc sản nên thử" },
  { id: "am-thuc", title: "Quán ăn" },
  { id: "ca-phe", title: "Quán cà phê" },
  { id: "trai-nghiem", title: "Trải nghiệm" },
  { id: "luu-tru", title: "Lưu trú" },
];

const PARTIES: { id: Party; Icon: TablerIcon; name: string; people: number; kids: number }[] = [
  { id: "solo", Icon: IconUser, name: "Một mình", people: 1, kids: 0 },
  { id: "couple", Icon: IconHeart, name: "Cặp đôi", people: 2, kids: 0 },
  { id: "friends", Icon: IconUsersGroup, name: "Nhóm bạn", people: 4, kids: 0 },
  { id: "family", Icon: IconBabyCarriage, name: "Gia đình", people: 4, kids: 1 },
];

// Nhãn lễ hội: "Đang diễn ra" / "Còn N tháng"
function FestivalStatus({ place }: { place: Place }) {
  if (place.kind !== "festival" || !place.months.length) return null;
  const m = monthsUntil(place);
  return m === 0 ? (
    <span className="h-status live">
      <IconPointFilled size={14} aria-hidden />
      Đang diễn ra
    </span>
  ) : (
    <span className="h-status">
      <IconCalendarEvent size={14} stroke={2} aria-hidden />
      Còn {m} tháng
    </span>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { has: inCart } = useCart();
  const { prefs, setPrefs } = useTrip();
  // Chọn kiểu đi: sang màn thông tin chuyến đi, AI tự chọn địa điểm
  const pickParty = (id: Party, people: number, kids: number) => {
    setPrefs({ ...prefs, party: id, people, kids, autoPick: true });
    navigate("/trip?auto=1");
  };
  const [places, setPlaces] = useState<Place[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Số liệu nhỏ trên hai ô phụ; lỗi thì chỉ không hiện số, không ảnh hưởng gì khác
  useEffect(() => {
    api.places().then(setPlaces).catch(() => {});
    api.myItineraries().then((l) => setSavedCount(l.length)).catch(() => {});
  }, []);

  const [q, setQ] = useState("");
  const search = () => navigate(q.trim() ? `/places?q=${encodeURIComponent(q.trim())}` : "/places");

  return (
    <Screen back={false}>
      <div className="h2">
        {/* Thanh điều hướng trên cùng: chỉ hiện ở máy tính */}
        <nav className="h-topnav" aria-label="Điều hướng chính">
          <div className="h-topnav-in">
            <span className="h-logo">
              <span className="h-logo-mark">
                <IconLeaf size={22} stroke={2} aria-hidden />
              </span>
              Lịch trình Đắk Song
            </span>
            <button className="h-nav on">
              <IconHome size={20} stroke={2} aria-hidden />
              Trang chủ
            </button>
            <button className="h-nav" onClick={() => navigate("/places")}>
              <IconMapPin size={20} stroke={2} aria-hidden />
              Điểm đến
            </button>
            <button className="h-nav" onClick={() => navigate("/my")}>
              <IconCalendar size={20} stroke={2} aria-hidden />
              Lịch của tôi
            </button>
            <form
              className="h-search"
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              <IconSearch size={20} stroke={2} aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm thác, quán ăn, homestay…" aria-label="Tìm địa điểm" />
            </form>
            <CartButton inline />
          </div>
        </nav>

        <div className="h-hero">
          <div className="h-banner-wrap">
            <span className="h-brand">
              <IconLeaf size={22} stroke={2} aria-hidden />
              Lịch trình Đắk Song
            </span>
            <BannerCarousel
              banners={BANNERS}
              onGo={(b) => navigate(b.collection ? `/places?collection=${b.collection}` : b.to ?? (b.category && places.some((p) => p.category === b.category) ? `/places?category=${b.category}` : "/places"))}
            />
          </div>

          <div className="h-trip">
            <div className="h-trip-head">
              <div>
                <b>Chuyến đi của bạn</b>
                <span>Chọn kiểu đi, AI gợi ý điểm đến</span>
              </div>
              <span className="h-trip-cart">
                <CartButton inline />
              </span>
            </div>
            <div className="h-parties" data-tour="party" role="group" aria-label="Hình thức chuyến đi">
              {PARTIES.map((x) => (
                <button key={x.id} className={`h-party${prefs.party === x.id ? " on" : ""}`} aria-pressed={prefs.party === x.id} onClick={() => pickParty(x.id, x.people, x.kids)}>
                  <x.Icon size={24} stroke={2} aria-hidden />
                  {x.name}
                </button>
              ))}
            </div>
            <div className="h-actions">
              <button className="btn-primary btn-lg" onClick={() => navigate("/cart")}>
                <IconSparkles size={20} stroke={2} aria-hidden />
                Để AI lên lịch trình
              </button>
              <div className="h-actions-2">
                <button className="btn-soft" onClick={() => openVr()}>
                  <Icon3dCubeSphere size={20} stroke={2} aria-hidden />
                  Tham quan VR 3D
                </button>
                <button className="btn-soft" data-tour="explore" onClick={() => navigate("/places")}>
                  <IconCompass size={20} stroke={2} aria-hidden />
                  Khám phá
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-tiles">
          <button className="h-tile photo" onClick={() => navigate("/places")}>
            <img src={PLACES_TILE} alt="" />
            <span className="h-tile-shade" />
            <span className="h-tile-text">
              <IconMapPin size={20} stroke={2} aria-hidden />
              <b>Điểm đến</b>
              {places.length > 0 && <small>{places.length} mục</small>}
            </span>
          </button>
          <button className="h-tile photo earth" onClick={() => navigate("/my")}>
            <img src={MY_TILE} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
            <span className="h-tile-shade" />
            <span className="h-tile-text">
              <IconCalendar size={20} stroke={2} aria-hidden />
              <b>Lịch của tôi</b>
              {savedCount !== null && <small>{savedCount} lịch đã lưu</small>}
            </span>
            <IconChevronRight className="h-tile-go" size={22} stroke={2} aria-hidden />
          </button>
        </div>

        {RAILS.map((r) => {
          const list = places.filter((p) => p.category === r.id);
          if (list.length === 0) return null;
          return (
            <section key={r.id} className="h-rail">
              <div className="h-rail-head">
                <div className="h-rail-title">
                  <span className="h-rail-ico">
                    <CatIcon category={r.id} size={20} />
                  </span>
                  <h3>{r.title}</h3>
                </div>
                <button className="btn-text" onClick={() => navigate(`/places?category=${r.id}`)}>
                  Xem tất cả
                  <IconChevronRight size={18} stroke={2} aria-hidden />
                </button>
              </div>
              <div className="h-rail-list">
                {list.map((p) => (
                  <div key={p.id} className="h-card" onClick={() => navigate(`/place/${p.id}`)}>
                    <div className="h-card-img">
                      <PlaceImg place={p} fallback={<ImgFallback category={p.category} />} />
                      <FestivalStatus place={p} />
                      {inCart(p.id) && (
                        <span className="h-added" aria-label="Đã thêm vào lịch trình">
                          <IconCheck size={16} stroke={2.5} />
                        </span>
                      )}
                    </div>
                    <div className="h-card-name">{p.name}</div>
                    <div className="h-card-sub">{p.kind === "festival" && (p.season || p.months.length) ? p.season || `Tháng ${p.months.join(", ")}` : categoryName(p.category)}</div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <div className="h-foot">
          <button className="btn-outline" onClick={() => openPortal()}>
            Xem thêm trên cổng du lịch
            <IconExternalLink size={18} stroke={2} aria-hidden />
          </button>
          <button className="btn-text h-help" onClick={() => window.dispatchEvent(new Event("tour:start"))}>
            <IconHelpCircle size={18} stroke={2} aria-hidden />
            Xem hướng dẫn sử dụng
          </button>
          {USE_MOCK && <div className="notice">Đang dùng dữ liệu mẫu (chưa kết nối backend).</div>}
        </div>
      </div>
    </Screen>
  );
}
