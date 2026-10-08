import React from "react";
import { Button, useNavigate } from "zmp-ui";
import { Screen } from "../components/layout";
import { useDraft } from "../state/draft";
import { openPortal } from "../lib/zalo";
import { API_BASE, USE_MOCK } from "../lib/api";
import { CATEGORIES } from "../types";

export default function HomePage() {
  const navigate = useNavigate();
  const { draft } = useDraft();

  return (
    <Screen back={false}>
      <div className="hero">
        <div className="hero-inner">
        <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", opacity: 0.8, marginBottom: 10 }}>
          Cổng du lịch Đắk Song
        </div>
        <h1>Lên lịch trình khám phá Đắk Song trong 1 phút</h1>
        <p>Chọn số ngày và sở thích, app gợi ý tuyến đi hợp lý. Chỉnh theo ý bạn rồi lưu ảnh lịch trình về máy.</p>
        </div>
      </div>

      <div className="content stack">
        {USE_MOCK && <div className="notice">Đang dùng dữ liệu mẫu (chưa kết nối backend).</div>}

        <Button fullWidth size="large" onClick={() => navigate("/create")}>
          ✨ Tạo lịch trình mới
        </Button>

        {draft && (
          <div className="card row" style={{ justifyContent: "space-between" }} onClick={() => navigate("/editor")}>
            <div>
              <div style={{ fontWeight: 600 }}>Tiếp tục: {draft.title}</div>
              <div className="muted">{draft.schedule.length} ngày · chưa xong thì làm tiếp</div>
            </div>
            <span style={{ fontSize: 20 }}>›</span>
          </div>
        )}

        <div className="row" style={{ gap: 12 }}>
          <Button fullWidth variant="secondary" onClick={() => navigate("/my")}>
            📋 Lịch của tôi
          </Button>
          <Button fullWidth variant="secondary" onClick={() => navigate("/places")}>
            📍 Điểm đến
          </Button>
        </div>

        <div className="section-title">Khám phá theo chủ đề</div>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <div
              key={c.id}
              className="card"
              style={{ textAlign: "center", cursor: "pointer" }}
              onClick={() => navigate(`/places?category=${c.id}`)}
            >
              <div style={{ fontSize: 30 }}>{c.icon}</div>
              <div style={{ fontWeight: 600, marginTop: 6 }}>{c.name}</div>
            </div>
          ))}
        </div>

        <Button fullWidth variant="tertiary" onClick={() => openPortal()}>
          Xem thêm trên cổng du lịch Đắk Song ↗
        </Button>

        <div className="muted" style={{ textAlign: "center", fontSize: 11 }}>
          {USE_MOCK ? "Dữ liệu mẫu" : `API: ${API_BASE}`}
        </div>
      </div>
    </Screen>
  );
}
