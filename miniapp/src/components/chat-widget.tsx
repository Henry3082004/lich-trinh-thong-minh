import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "zmp-ui";
import { api } from "../lib/api";
import type { Place } from "../types";
import { Mascot } from "./mascot";

type Msg = { role: "user" | "model"; text: string; placeIds?: string[]; error?: boolean };

const SUGGESTIONS = ["Ở Đắk Song có gì đẹp?", "Gợi ý chỗ ăn ngon", "Có quán cà phê nào không?", "Đi 1 ngày nên ghé đâu?"];
const MAX_SENT = 10; // số tin gần nhất gửi kèm để trợ lý nhớ ngữ cảnh
const BUBBLE_KEY = "mascot-bubble-off";
const GREETING = "Xin chào, mình là chú voi con ở Đắk Song! Bạn cần hỗ trợ gì? Mình có thể gợi ý chỗ chơi, món ngon, quán cà phê và lễ hội.";

const isTouch = () => {
  try {
    return matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
};

// Linh vật voi con ở góc màn hình: vẫy tay, hỏi "Bạn cần hỗ trợ gì?", bấm vào thì mở cửa sổ chat.
// Gắn một lần ở gốc app nên cuộc trò chuyện được giữ khi chuyển màn.
export function ChatWidget() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [places, setPlaces] = useState<Map<string, Place>>(new Map());
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const openedOnce = useRef(false);

  useEffect(() => {
    api.chatEnabled().then(setEnabled);
    api.places().then((l) => setPlaces(new Map(l.map((p) => [p.id, p])))).catch(() => {});
  }, []);

  // Báo cho CSS biết linh vật chiếm chỗ nào ở góc dưới và thanh nút dưới (nếu có) cao bao nhiêu,
  // để nút giỏ và linh vật không đè lên nhau hay che nút hành động.
  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      root.style.setProperty("--mascot-h", "0px");
      return;
    }
    root.style.setProperty("--mascot-h", "var(--mascot-size, 84px)");
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const bars = Array.from(document.querySelectorAll<HTMLElement>(".bottom-bar"));
        // trang đang hiện (khi chuyển màn có thể có hai trang cùng lúc): lấy thanh cao nhất đang thấy
        const h = bars.reduce((m, b) => (b.offsetParent !== null || getComputedStyle(b).position === "fixed" ? Math.max(m, b.offsetHeight) : m), 0);
        root.style.setProperty("--bar-h", `${h}px`);
      });
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  // Bóng thoại: hiện sau ~2 giây, tự ẩn sau ~9 giây, thỉnh thoảng hiện lại nếu chưa mở chat; ✕ để tắt hẳn trong phiên
  useEffect(() => {
    if (!enabled) return;
    const off = () => {
      try {
        return sessionStorage.getItem(BUBBLE_KEY) === "1";
      } catch {
        return false;
      }
    };
    let hide: ReturnType<typeof setTimeout>;
    const show = () => {
      if (off() || openedOnce.current) return;
      setBubble(true);
      clearTimeout(hide);
      hide = setTimeout(() => setBubble(false), 9000);
    };
    const first = setTimeout(show, 2000);
    const again = setInterval(show, 90000);
    return () => {
      clearTimeout(first);
      clearTimeout(hide);
      clearInterval(again);
    };
  }, [enabled]);

  const dismissBubble = () => {
    setBubble(false);
    try {
      sessionStorage.setItem(BUBBLE_KEY, "1");
    } catch {
      // không lưu được thì lần sau bóng thoại có thể hiện lại, không sao
    }
  };

  const openChat = () => {
    openedOnce.current = true;
    setBubble(false);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);

  // Esc đóng; điện thoại thì khoá cuộn nền khi mở; máy có chuột thì tự đưa con trỏ vào ô nhập
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!isTouch()) inputRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy, open]);

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 500);
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
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

  if (!enabled) return null;

  return (
    <div ref={rootRef} className="mascot-root">
      {!open && (
        <>
          {bubble && (
            <div className="mascot-bubble" role="status">
              <button className="mascot-bubble-text" onClick={openChat}>
                Bạn cần hỗ trợ gì? <span aria-hidden>👋</span>
              </button>
              <button className="mascot-bubble-x" aria-label="Tắt lời chào" onClick={dismissBubble}>
                ✕
              </button>
            </div>
          )}
          <button className="mascot-btn" aria-label="Mở chat hỏi trợ lý Đắk Song" aria-expanded={false} onClick={openChat}>
            <Mascot waving={bubble || undefined} />
          </button>
        </>
      )}

      {open && (
        <>
          <div className="chat-backdrop" onClick={close} />
          <section className="chat-panel" role="dialog" aria-label="Trợ lý Đắk Song" aria-modal="true">
            <header className="chat-head">
              <div className="chat-avatar">
                <Mascot size={44} happy />
              </div>
              <div className="chat-head-text">
                <b>Trợ lý Đắk Song</b>
                <small>Hỏi về địa điểm, món ăn, lễ hội</small>
              </div>
              <button className="chat-head-btn" aria-label="Làm mới cuộc trò chuyện" disabled={msgs.length === 0 || busy} onClick={() => setMsgs([])}>
                ↻
              </button>
              <button className="chat-head-btn" aria-label="Đóng chat" onClick={close}>
                ✕
              </button>
            </header>

            <div className="chat-body">
              <div className="bubble-row model">
                <div className="bubble model">{GREETING}</div>
              </div>
              {msgs.length === 0 && (
                <div className="chat-suggest">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="chip" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
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
                          <button
                            key={p.id}
                            className="chip"
                            onClick={() => {
                              setOpen(false);
                              navigate(`/place/${p.id}`);
                            }}
                          >
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
              <div className="chat-note">Trợ lý AI có thể nhầm. Hãy kiểm tra lại giờ mở cửa, giá vé trước khi đi.</div>
              <div ref={endRef} />
            </div>

            <form
              className="chat-form chat-foot"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input ref={inputRef} value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi về Đắk Song…" aria-label="Câu hỏi" />
              <button className="btn-primary" type="submit" disabled={busy || !input.trim()} aria-label="Gửi">
                Gửi
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
