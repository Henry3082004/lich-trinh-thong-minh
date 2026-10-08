import React, { useState } from "react";
import { Button, useNavigate, useSnackbar } from "zmp-ui";
import { Screen } from "../components/layout";
import { api } from "../lib/api";
import { useDraft } from "../state/draft";
import { CATEGORIES, type Pace } from "../types";

const EXTRA_INTERESTS = [
  { id: "check-in", name: "Check-in", icon: "📸" },
  { id: "gia-dinh", name: "Gia đình", icon: "👨‍👩‍👧" },
];

const PACES: { id: Pace; name: string; hint: string }[] = [
  { id: "relaxed", name: "Thư thả", hint: "≤ 3 điểm/ngày" },
  { id: "normal", name: "Vừa phải", hint: "≤ 4 điểm/ngày" },
  { id: "packed", name: "Khám phá tối đa", hint: "≤ 5 điểm/ngày" },
];

// Một màn hình duy nhất: chọn số ngày (có sẵn mặc định) rồi "Tạo ảnh" là ra poster ngay
export default function CreatePage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { fromSuggest, setNotice } = useDraft();
  const [days, setDays] = useState(2);
  const [interests, setInterests] = useState<string[]>([]);
  const [pace, setPace] = useState<Pace>("normal");
  const [showPace, setShowPace] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) =>
    setInterests((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const submit = async () => {
    setLoading(true);
    try {
      const res = await api.suggest({ days, interests, pace });
      if (res.schedule.length === 0) throw new Error("Chưa có điểm đến phù hợp");
      fromSuggest(res);
      setNotice(
        res.schedule.length < days
          ? `Hiện chỉ đủ điểm đến cho ${res.schedule.length} ngày. Bạn có thể thêm điểm ở bước "Chỉnh lịch".`
          : null,
      );
      navigate("/poster", { replace: true });
    } catch (e) {
      openSnackbar({ text: (e as Error).message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Tạo ảnh lịch trình"
      bottom={
        <Button fullWidth size="large" loading={loading} onClick={submit}>
          ✨ Tạo ảnh
        </Button>
      }
    >
      <div className="content narrow">
        <div className="section-title" style={{ marginTop: 4 }}>
          Bạn đi mấy ngày?
        </div>
        <div className="card stepper" style={{ justifyContent: "center" }}>
          <button aria-label="Bớt ngày" onClick={() => setDays((d) => Math.max(1, d - 1))}>
            −
          </button>
          <div className="value">{days} ngày</div>
          <button aria-label="Thêm ngày" onClick={() => setDays((d) => Math.min(5, d + 1))}>
            +
          </button>
        </div>

        <div className="section-title">
          Bạn thích gì? <span className="muted">(không chọn cũng được)</span>
        </div>
        <div className="chips">
          {[...CATEGORIES.filter((c) => c.id !== "am-thuc"), ...EXTRA_INTERESTS].map((c) => (
            <button key={c.id} className={`chip ${interests.includes(c.id) ? "active" : ""}`} onClick={() => toggle(c.id)}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        <button className="link-btn" onClick={() => setShowPace((v) => !v)}>
          {showPace ? "Ẩn tuỳ chọn ▲" : "Tuỳ chọn nhịp độ ▼"}
        </button>
        {showPace && (
          <div className="stack" style={{ marginTop: 8 }}>
            {PACES.map((p) => (
              <button
                key={p.id}
                className={`chip ${pace === p.id ? "active" : ""}`}
                style={{ display: "flex", justifyContent: "space-between", borderRadius: 12, padding: "12px 14px" }}
                onClick={() => setPace(p.id)}
              >
                <span>{p.name}</span>
                <span className="muted">{p.hint}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
