import React from "react";
import { PlaceImg } from "../components/place-card";
import { useNavigate } from "zmp-ui";
import { Screen } from "../components/layout";
import { useCart } from "../state/cart";
import { categoryName, PLACE_CATEGORIES, type Place } from "../types";
import { CatIcon, ImgFallback } from "../components/icons";
import { IconCompass, IconListCheck, IconPlus, IconSparkles, IconTrash, IconX } from "@tabler/icons-react";

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
          <button className="btn-primary btn-lg" data-tour="ai-plan" onClick={() => navigate("/trip")}>
            <IconSparkles size={20} stroke={2} aria-hidden />
            {count > 0 ? "Để AI lên lịch" : "Để AI chọn giúp"}
          </button>
        </div>
      }
    >
      <div className="content narrow stack">
        {count === 0 && (
          <div className="empty p-empty">
            <IconListCheck size={32} stroke={2} aria-hidden />
            <p>Lịch trình đang trống. Hãy xem địa điểm, món ăn, lễ hội và bấm "Thêm vào lịch trình" ở những nơi bạn thích.</p>
            <button className="btn-soft" onClick={() => navigate("/places")}>
              <IconCompass size={20} stroke={2} aria-hidden />
              Khám phá Đắk Song
            </button>
          </div>
        )}
        {groups.map((g) => (
          <section key={g.id}>
            <div className="h-rail-title c-group">
              <span className="h-rail-ico">
                <CatIcon category={g.id} size={20} />
              </span>
              <h3>{g.name}</h3>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {g.items.map((p) => (
                <div key={p.id} className="ai-stop">
                  <div className="ai-thumb" onClick={() => navigate(`/place/${p.id}`)}>
                    <PlaceImg place={p} fallback={<ImgFallback category={p.category} size={24} />} />
                  </div>
                  <div className="ai-stop-body" onClick={() => navigate(`/place/${p.id}`)}>
                    <b className="ai-name">{p.name}</b>
                    <span className="muted">{[categoryName(p.category), monthsText(p)].filter(Boolean).join(" · ")}</span>
                  </div>
                  <button className="c-remove" aria-label={`Bỏ ${p.name}`} onClick={() => remove(p.id)}>
                    <IconX size={20} stroke={2} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
        {count > 0 && (
          <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
            <button className="btn-text" onClick={() => navigate("/places")}>
              <IconPlus size={18} stroke={2} aria-hidden />
              Thêm địa điểm khác
            </button>
            <button className="btn-text c-clear" onClick={() => window.confirm("Xoá hết các mục trong lịch trình?") && clear()}>
              <IconTrash size={18} stroke={2} aria-hidden />
              Xoá hết
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
