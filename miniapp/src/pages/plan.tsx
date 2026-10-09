import React, { useEffect, useRef, useState } from "react";
import { PlaceImg } from "../components/place-card";
import { useNavigate, useSnackbar } from "zmp-ui";
import { Screen } from "../components/layout";
import { api } from "../lib/api";
import { formatDuration } from "../lib/schedule";
import { useDraft } from "../state/draft";
import { useTrip } from "../state/trip";
import { categoryName } from "../types";
import { ImgFallback } from "../components/icons";
import { Mascot } from "../components/mascot";
import { IconBed, IconBus, IconCar, IconMotorbike, IconPhotoCheck, IconSend, IconSparkles } from "@tabler/icons-react";

type Turn = { from: "me" | "ai"; text: string };

const dateLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"][new Date(y, m - 1, d).getDay()];
  return `${wd}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
};

// Lời của AI: ảnh đại diện chú voi + bong bóng
function AiSay({ children }: { children: React.ReactNode }) {
  return (
    <div className="ai-say">
      <span className="ai-avatar" aria-hidden>
        <Mascot size={36} face />
      </span>
      <div className="ai-bubble">{children}</div>
    </div>
  );
}

const durShort = (min: number) => {
  const h = Math.round(min / 30) / 2;
  return h >= 1 ? `~${String(h).replace(".", ",")} giờ` : `~${min} phút`;
};

export default function PlanPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { prefs, plan, setPlan } = useTrip();
  const { fromPlan } = useDraft();
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
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

  const lodging = plan.lodgingIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

  const TravelIcon = prefs.transport === "xe-may" ? IconMotorbike : prefs.transport === "xe-khach" ? IconBus : IconCar;
  // Tổng thời gian một ngày: từ giờ bắt đầu điểm đầu tới lúc rời điểm cuối
  const dayMeta = (stops: (typeof plan.days)[number]["stops"]) => {
    const valid = stops.filter((s) => byId.get(s.placeId));
    if (!valid.length) return "";
    const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const last = valid[valid.length - 1];
    const span = toMin(last.startTime) + (byId.get(last.placeId)?.durationMin ?? 0) - toMin(valid[0].startTime);
    return `${valid.length} điểm · ${durShort(span)}`;
  };

  return (
    <Screen
      title="Lịch AI đề xuất"
      bottom={
        <div className="bottom-stack">
          <form
            className="ai-form"
            onSubmit={(e) => {
              e.preventDefault();
              revise(input);
            }}
          >
            <label>
              <input
                value={input}
                maxLength={500}
                disabled={busy}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhắn AI để chỉnh lịch…"
                aria-label="Nhắn AI để chỉnh lịch"
              />
            </label>
            <button type="submit" aria-label="Gửi" disabled={busy || !input.trim()}>
              <IconSend size={22} stroke={2} />
            </button>
          </form>
          <button className="btn-primary btn-lg" disabled={busy} onClick={confirm}>
            <IconPhotoCheck size={20} stroke={2} aria-hidden />
            Chốt & tạo ảnh
          </button>
        </div>
      }
    >
      <div className="content plan-wrap ai-plan">
        <AiSay>{plan.summary || "Đây là lịch trình mình đề xuất cho bạn."}</AiSay>
        {!plan.usedAi && plan.usedAi !== undefined && <div className="notice">AI đang bận nên mình xếp tạm theo khoảng cách gần nhau. Bạn vẫn có thể nhắn để chỉnh lại.</div>}
        {plan.warnings.map((w, i) => (
          <div key={i} className="notice">
            {w}
          </div>
        ))}

        <div className="days-grid">
          {plan.days.map((d) => (
            <section key={d.day} className="ai-day">
              <div className="ai-day-head">
                <h3>
                  Ngày {d.day} <span>· {dateLabel(d.date)}</span>
                </h3>
                <span className="ai-day-meta">{dayMeta(d.stops)}</span>
              </div>
              {d.stops.length === 0 && <div className="muted">Ngày tự do, chưa có điểm nào.</div>}
              {d.stops.map((s, i) => {
                const p = byId.get(s.placeId);
                if (!p) return null;
                return (
                  <div key={`${s.placeId}-${i}`}>
                    {s.travelMinFromPrev > 0 && (
                      <div className="ai-travel">
                        <span className="ai-travel-line" />
                        <TravelIcon size={16} stroke={2} aria-hidden />
                        khoảng {formatDuration(s.travelMinFromPrev)} di chuyển
                      </div>
                    )}
                    <div className="ai-stop" onClick={() => navigate(`/place/${p.id}`)}>
                      <div className="ai-thumb">
                        <PlaceImg place={p} fallback={<ImgFallback category={p.category} size={24} />} />
                      </div>
                      <div className="ai-stop-body">
                        <div className="ai-stop-tags">
                          <span className="ai-time">{s.startTime}</span>
                          <span className="muted">{formatDuration(p.durationMin)}</span>
                          {s.suggested && (
                            <span className="ai-badge">
                              <IconSparkles size={14} stroke={2} aria-hidden />
                              AI gợi ý thêm
                            </span>
                          )}
                        </div>
                        <b className="ai-name">{p.name}</b>
                        <span className="muted">{[categoryName(p.category), s.note].filter(Boolean).join(" · ")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>

        {lodging.length > 0 && (
          <div className="ai-lodging">
            <span className="ai-lodging-ico">
              <IconBed size={24} stroke={2} aria-hidden />
            </span>
            <div>
              <span className="ai-lodging-label">Nơi lưu trú gợi ý</span>
              <b>{lodging.map((p) => p.name).join(", ")}</b>
              {lodging[0].priceNote && <span>{lodging[0].priceNote}</span>}
            </div>
          </div>
        )}

        {thread.length === 0 && plan.questions.length > 0 && (
          <>
            <AiSay>{plan.questions[0]}</AiSay>
            <div className="ai-chips">
              {["Giữ nguyên, chốt lịch", "Thêm quán cà phê", "Bớt bớt điểm cho nhẹ nhàng"].map((q) => (
                <button key={q} className="ai-chip" onClick={() => (q.startsWith("Giữ nguyên") ? confirm() : revise(q))}>
                  {q}
                </button>
              ))}
            </div>
          </>
        )}
        {thread.map((t, i) =>
          t.from === "me" ? (
            <div key={i} className="me-say">
              {t.text}
            </div>
          ) : (
            <AiSay key={i}>{t.text}</AiSay>
          ),
        )}
        {busy && (
          <div className="ai-say">
            <span className="ai-avatar" aria-hidden>
              <Mascot size={36} face />
            </span>
            <div className="ai-bubble typing" aria-label="AI đang chỉnh lịch">
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
