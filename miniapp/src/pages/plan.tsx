import React, { useEffect, useRef, useState } from "react";
import { PlaceImg } from "../components/place-card";
import { useNavigate, useSnackbar } from "zmp-ui";
import { Screen } from "../components/layout";
import { api } from "../lib/api";
import { formatDuration } from "../lib/schedule";
import { useDraft } from "../state/draft";
import { useTrip } from "../state/trip";
import { categoryIcon, categoryName } from "../types";

type Turn = { from: "me" | "ai"; text: string };

const dateLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"][new Date(y, m - 1, d).getDay()];
  return `${wd}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
};

export default function PlanPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { prefs, plan, setPlan } = useTrip();
  const { fromPlan } = useDraft();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<Turn[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plan) navigate("/cart", { replace: true });
  }, [plan]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread, busy]);

  if (!plan) return null;
  const byId = new Map(plan.places.map((p) => [p.id, p]));

  const revise = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setThread((t) => [...t, { from: "me", text: message }]);
    setInput("");
    try {
      const next = await api.revisePlan(prefs, plan, message);
      setPlan(next);
      setThread((t) => [...t, { from: "ai", text: next.summary || "Mình đã chỉnh lịch xong." }]);
    } catch (e) {
      setThread((t) => [...t, { from: "ai", text: (e as Error).message || "Mình chưa chỉnh được, bạn thử nói lại nhé." }]);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    fromPlan(plan);
    navigate("/poster");
  };
  const manual = () => {
    fromPlan(plan);
    navigate("/editor");
  };

  const lodging = plan.lodgingIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <Screen
      title="Lịch AI đề xuất"
      bottom={
        <div className="bottom-stack">
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              revise(input);
            }}
          >
            <input value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} placeholder='Muốn chỉnh gì? vd "thêm quán cà phê buổi tối"' aria-label="Yêu cầu chỉnh lịch" />
            <button className="btn-soft" type="submit" disabled={busy || !input.trim()}>
              Gửi
            </button>
          </form>
          <div className="action-row">
            <button className="btn-soft btn-lg" disabled={busy} onClick={manual}>
              Sửa tay
            </button>
            <button className="btn-primary btn-lg" disabled={busy} onClick={confirm}>
              Chốt & tạo ảnh
            </button>
          </div>
        </div>
      }
    >
      <div className="content plan-wrap stack" style={{ paddingBottom: 90 }}>
        <div className="bubble-row model">
          <div className="bubble model">{plan.summary || "Đây là lịch trình mình đề xuất cho bạn."}</div>
        </div>
        {!plan.usedAi && plan.usedAi !== undefined && <div className="notice">AI đang bận nên mình xếp tạm theo khoảng cách gần nhau. Bạn vẫn có thể chỉnh lại.</div>}
        {plan.warnings.map((w, i) => (
          <div key={i} className="notice">
            {w}
          </div>
        ))}

        <div className="days-grid">
        {plan.days.map((d) => (
          <section key={d.day} className="day-block">
            <div className="day-header">
              <h3>
                Ngày {d.day} <span className="muted">· {dateLabel(d.date)}</span>
              </h3>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {d.stops.length === 0 && <div className="muted">Ngày tự do, chưa có điểm nào.</div>}
              {d.stops.map((s, i) => {
                const p = byId.get(s.placeId);
                if (!p) return null;
                return (
                  <div key={`${s.placeId}-${i}`}>
                    {s.travelMinFromPrev > 0 && <div className="travel">↓ khoảng {formatDuration(s.travelMinFromPrev)} di chuyển</div>}
                    <div className="edit-stop" onClick={() => navigate(`/place/${p.id}`)}>
                      <div className="edit-thumb"><PlaceImg place={p} fallback={categoryIcon(p.category)} /></div>
                      <div className="edit-body">
                        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                          <span className="time-pill">{s.startTime}</span>
                          <span className="muted">{formatDuration(p.durationMin)}</span>
                          {s.suggested && <span className="badge-green">AI gợi ý thêm</span>}
                        </div>
                        <div className="edit-name">{p.name}</div>
                        <div className="muted">{[categoryName(p.category), s.note].filter(Boolean).join(" · ")}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        </div>

        {lodging.length > 0 && (
          <div className="card">
            <b>🛏️ Nơi nghỉ bạn đã chọn</b>
            <div className="muted" style={{ marginTop: 4 }}>
              {lodging.map((p) => p.name).join(", ")}
            </div>
          </div>
        )}

        {thread.length === 0 && plan.questions.length > 0 && (
          <>
            <div className="bubble-row model">
              <div className="bubble model">{plan.questions[0]}</div>
            </div>
            <div className="chips">
              {["Giữ nguyên, chốt lịch", "Thêm quán cà phê", "Bớt bớt điểm cho nhẹ nhàng"].map((q) => (
                <button key={q} className="chip" onClick={() => (q.startsWith("Giữ nguyên") ? confirm() : revise(q))}>
                  {q}
                </button>
              ))}
            </div>
          </>
        )}
        {thread.map((t, i) => (
          <div key={i} className={`bubble-row ${t.from === "me" ? "user" : "model"}`}>
            <div className={`bubble ${t.from === "me" ? "user" : "model"}`}>{t.text}</div>
          </div>
        ))}
        {busy && (
          <div className="bubble-row model">
            <div className="bubble model typing" aria-label="AI đang chỉnh lịch">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </Screen>
  );
}
