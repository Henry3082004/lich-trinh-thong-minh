import React from "react";
import { useNavigate } from "zmp-ui";
import { Screen } from "../components/layout";
import { useCart } from "../state/cart";
import { categoryIcon, categoryName, PLACE_CATEGORIES, type Place } from "../types";

const monthsText = (p: Place) => (p.kind === "festival" ? p.season || (p.months.length ? `Tháng ${p.months.join(", ")}` : "") : "");

export default function CartPage() {
  const navigate = useNavigate();
  const { items, count, remove, clear } = useCart();

  const groups = PLACE_CATEGORIES.map((c) => ({ ...c, items: items.filter((p) => p.category === c.id) })).filter((g) => g.items.length > 0);

  return (
    <Screen
      title="Lịch trình của bạn"
      bottom={
        <div className="bottom-stack">
          <div className="summary">{count > 0 ? `${count} mục đã chọn` : "Chưa chọn mục nào, AI sẽ chọn giúp các điểm nổi bật"}</div>
          <button className="btn-primary btn-lg" onClick={() => navigate("/trip")}>
            ✨ {count > 0 ? "Để AI lên lịch" : "Để AI chọn giúp"}
          </button>
        </div>
      }
    >
      <div className="content narrow stack">
        {count === 0 && (
          <div className="empty">
            <p>Giỏ lịch trình đang trống. Hãy lướt xem địa điểm, món ăn, lễ hội và bấm "+ Thêm" ở những chỗ bạn thích.</p>
            <button className="btn-soft" onClick={() => navigate("/places")}>
              Khám phá Đắk Song
            </button>
          </div>
        )}
        {groups.map((g) => (
          <section key={g.id}>
            <div className="section-title" style={{ margin: "6px 0 8px" }}>
              {g.icon} {g.name}
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {g.items.map((p) => (
                <div key={p.id} className="edit-stop">
                  <div className="edit-thumb" onClick={() => navigate(`/place/${p.id}`)}>
                    {p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : categoryIcon(p.category)}
                  </div>
                  <div className="edit-body" onClick={() => navigate(`/place/${p.id}`)}>
                    <div className="edit-name">{p.name}</div>
                    <div className="muted">{[categoryName(p.category), monthsText(p)].filter(Boolean).join(" · ")}</div>
                  </div>
                  <button className="edit-remove" aria-label={`Bỏ ${p.name}`} onClick={() => remove(p.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
        {count > 0 && (
          <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
            <button className="btn-text" onClick={() => navigate("/places")}>
              + Thêm mục khác
            </button>
            <button className="btn-text brown" onClick={() => window.confirm("Xoá hết các mục trong giỏ?") && clear()}>
              Xoá hết
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
