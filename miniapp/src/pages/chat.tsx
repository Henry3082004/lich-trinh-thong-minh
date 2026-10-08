import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "zmp-ui";
import { Screen } from "../components/layout";
import { api } from "../lib/api";
import type { Place } from "../types";

type Msg = { role: "user" | "model"; text: string; placeIds?: string[]; error?: boolean };

const SUGGESTIONS = ["Ở Đắk Song có gì đẹp?", "Gợi ý chỗ ăn ngon", "Đi 1 ngày nên ghé đâu?", "Có chỗ nào cho trẻ em?"];
const MAX_SENT = 10; // số tin gần nhất gửi kèm để trợ lý nhớ ngữ cảnh

export default function ChatPage() {
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [places, setPlaces] = useState<Map<string, Place>>(new Map());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.places().then((l) => setPlaces(new Map(l.map((p) => [p.id, p])))).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 500);
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      // Tối đa MAX_SENT tin gần nhất, bắt đầu bằng lượt của khách
      // Bỏ tin lỗi và câu hỏi đã dẫn tới lỗi đó, để lượt hỏi/đáp luôn xen kẽ
      const history = next.filter((m, i) => !m.error && !next[i + 1]?.error).slice(-MAX_SENT);
      while (history.length > 0 && history[0].role !== "user") history.shift();
      const res = await api.chat(history.map((m) => ({ role: m.role, text: m.text })));
      setMsgs((l) => [...l, { role: "model", text: res.reply, placeIds: res.placeIds }]);
    } catch (e) {
      setMsgs((l) => [...l, { role: "model", text: (e as Error).message || "Có lỗi, bạn thử lại nhé", error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Hỏi đáp Đắk Song"
      bottom={
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi về Đắk Song…" aria-label="Câu hỏi" />
          <button className="btn-primary" type="submit" disabled={busy || !input.trim()} aria-label="Gửi">
            Gửi
          </button>
        </form>
      }
    >
      <div className="content narrow chat">
        {msgs.length === 0 && (
          <div className="chat-intro">
            <div className="chat-hello">Xin chào! Mình là trợ lý du lịch Đắk Song. Bạn muốn hỏi gì?</div>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`bubble-row ${m.role}`}>
            <div className={`bubble ${m.role} ${m.error ? "error" : ""}`}>{m.text}</div>
            {m.placeIds && m.placeIds.length > 0 && (
              <div className="chips" style={{ marginTop: 6 }}>
                {m.placeIds
                  .map((id) => places.get(id))
                  .filter((p): p is Place => !!p)
                  .map((p) => (
                    <button key={p.id} className="chip" onClick={() => navigate(`/place/${p.id}`)}>
                      📍 {p.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="bubble-row model">
            <div className="bubble model typing" aria-label="Đang trả lời">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        {msgs.length > 0 && <div className="muted" style={{ textAlign: "center", fontSize: 12 }}>Trợ lý AI có thể nhầm. Hãy kiểm tra lại giờ mở cửa, giá vé trước khi đi.</div>}
        <div ref={endRef} />
      </div>
    </Screen>
  );
}
