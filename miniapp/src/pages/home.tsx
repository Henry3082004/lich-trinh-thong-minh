import React, { useEffect, useState } from "react";
import { useNavigate } from "zmp-ui";
import { Screen } from "../components/layout";
import { api, USE_MOCK } from "../lib/api";
import { openPortal } from "../lib/zalo";
import { useDraft } from "../state/draft";

// Ảnh bìa trang chủ: ảnh thật từ cổng du lịch, nền xanh phía sau đề phòng ảnh tải lỗi
const HERO = "https://static.dggv.edu.vn/360/1679365017974_123201-nam-nung-4.jpg";
const PLACES_TILE = "https://static.dggv.edu.vn/360/1679364818513_thien-vien-truc-lam-dao-nguyen-5.jpg";

export default function HomePage() {
  const navigate = useNavigate();
  const { draft } = useDraft();
  const [placeCount, setPlaceCount] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Số liệu nhỏ trên hai ô phụ; lỗi thì chỉ không hiện số, không ảnh hưởng gì khác
  useEffect(() => {
    api.places().then((l) => setPlaceCount(l.length)).catch(() => {});
    api.myItineraries().then((l) => setSavedCount(l.length)).catch(() => {});
  }, []);

  return (
    <Screen back={false}>
      <div className="home">
        <div className="home-hero">
          <img src={HERO} alt="" />
          <div className="home-hero-shade" />
        </div>

        <div className="home-body">
          <div className="home-greeting">
            <div className="eyebrow">Cổng du lịch Đắk Song</div>
            <h1>Chào bạn, đi Đắk Song mấy ngày?</h1>
          </div>

          <div className="home-cta card-soft">
            <p>App lên lịch và làm sẵn một tấm ảnh đẹp để bạn lưu về hoặc gửi cho gia đình.</p>
            <button className="btn-primary btn-lg" onClick={() => navigate("/create")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Tạo ảnh lịch trình
            </button>
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
                {placeCount !== null && <small>{placeCount} địa điểm</small>}
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

          <button className="btn-outline" onClick={() => openPortal()}>
            Xem thêm trên cổng du lịch <span aria-hidden>↗</span>
          </button>

          {USE_MOCK && <div className="notice">Đang dùng dữ liệu mẫu (chưa kết nối backend).</div>}
        </div>
      </div>
    </Screen>
  );
}
