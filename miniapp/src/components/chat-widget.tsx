import { IconMapPin, IconRefresh, IconSend, IconX } from "@tabler/icons-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "zmp-ui";
import { api } from "../lib/api";
import type { Place } from "../types";
import { Mascot } from "./mascot";

type Msg = { role: "user" | "model"; text: string; placeIds?: string[]; error?: boolean };

const SUGGESTIONS = ["Ở Đắk Song có gì đẹp?", "Gợi ý chỗ ăn ngon", "Có quán cà phê nào không?", "Đi 1 ngày nên ghé đâu?"];
const MAX_SENT = 10; // số tin gần nhất gửi kèm để trợ lý nhớ ngữ cảnh
const BUBBLE_KEY = "mascot-bubble-off";
const FLY_MS = 2200; // thời gian bay vào
const GREET_MS = 2300; // vẫy tay chào "Xin chào!"
const ASK_MS = 8000; // hỏi "Mình giúp gì được cho bạn?"
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
  // Giai đoạn linh vật: fly (bay vào) -> greet (vẫy tay chào) -> ask (hỏi) -> idle (đứng yên); ask lặp lại thỉnh thoảng
  const [phase, setPhase] = useState<"hidden" | "fly" | "greet" | "ask" | "idle">("hidden");
  const [waving, setWaving] = useState(false);
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
    // Đo thanh nút dưới cả khi tắt chat: nút giỏ cũng dựa vào --bar-h để không đè thanh
    root.style.setProperty("--mascot-h", enabled ? "var(--mascot-size, 84px)" : "0px");
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

  // Mới mở web: linh vật bay vào, vẫy tay chào, rồi hỏi; sau đó thỉnh thoảng hỏi lại nếu bạn chưa mở chat
  useEffect(() => {
    if (!enabled) return;
    const reduce = (() => {
      try {
        return matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        return false;
      }
    })();
    const off = () => {
      try {
        return sessionStorage.getItem(BUBBLE_KEY) === "1";
      } catch {
        return false;
      }
    };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    const ask = () => {
      if (openedOnce.current || off()) return;
      setPhase("ask");
      setWaving(true);
      later(() => setWaving(false), 3200);
      later(() => setPhase("idle"), ASK_MS);
    };
    if (reduce) {
      later(ask, 800);
    } else {
      setPhase("fly");
      setWaving(false);
      later(() => {
        if (off()) return setPhase("idle");
        setPhase("greet");
        setWaving(true);
      }, FLY_MS);
      later(ask, FLY_MS + GREET_MS);
    }
    const again = setInterval(ask, 90000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(again);
    };
  }, [enabled]);

  const dismissBubble = () => {
    setPhase("idle");
    setWaving(false);
    try {
      sessionStorage.setItem(BUBBLE_KEY, "1");
    } catch {
      // không lưu được thì lần sau bóng thoại có thể hiện lại, không sao
    }
  };

  const openChat = () => {
    openedOnce.current = true;
    setPhase("idle");
    setWaving(false);
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
        <div className={`mascot-dock ${phase === "fly" ? "fly" : ""}`}>
          {(phase === "greet" || phase === "ask") && (
            <div className="mascot-bubble" role="status" key={phase}>
              <button className="mascot-bubble-text" onClick={openChat}>
                {phase === "greet" ? (
                  <>
                    Xin chào!
                  </>
                ) : (
                  <>Mình giúp gì được cho bạn?</>
                )}
              </button>
              <button className="mascot-bubble-x" aria-label="Tắt lời chào" onClick={dismissBubble}>
                <IconX size={16} stroke={2} />
              </button>
            </div>
          )}
          <button className="mascot-btn" aria-label="Mở chat hỏi trợ lý Đắk Song" aria-expanded={false} onClick={openChat}>
            <Mascot waving={waving} flying={phase === "fly"} />
          </button>
        </div>
      )}

      {open && (
        <>
          <div className="chat-backdrop" onClick={close} />
          <section className="chat-panel" role="dialog" aria-label="Trợ lý Đắk Song" aria-modal="true">
            <header className="chat-head">
              <div className="chat-avatar">
                <Mascot size={46} happy face />
              </div>
              <div className="chat-head-text">
                <b>Trợ lý Đắk Song</b>
                <small>
                  <span className="chat-online" aria-hidden />
                  Hỏi về địa điểm, món ăn, lễ hội
                </small>
              </div>
              <button className="chat-head-btn" aria-label="Làm mới cuộc trò chuyện" disabled={msgs.length === 0 || busy} onClick={() => setMsgs([])}>
                <IconRefresh size={22} stroke={2} />
              </button>
              <button className="chat-head-btn close" aria-label="Đóng chat" onClick={close}>
                <IconX size={22} stroke={2} />
              </button>
            </header>

            <div className="chat-body">
              <div className="bubble-row model">
                <div className="bubble model">{GREETING}</div>
              </div>
              {msgs.length === 0 && (
                <div className="chat-suggest">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="ai-chip" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`bubble-row ${m.role}`}>
                  <div className={`bubble ${m.role} ${m.error ? "error" : ""}`}>{m.text}</div>
                  {m.placeIds && m.placeIds.length > 0 && (
                    <div className="chat-places">
                      {m.placeIds
                        .map((id) => places.get(id))
                        .filter((p): p is Place => !!p)
                        .map((p) => (
                          <button
                            key={p.id}
                            className="chat-place"
                            onClick={() => {
                              setOpen(false);
                              navigate(`/place/${p.id}`);
                            }}
                          >
                            <IconMapPin size={16} stroke={2} aria-hidden />
                            {p.name}
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
              <button className="chat-send" type="submit" disabled={busy || !input.trim()} aria-label="Gửi">
                <IconSend size={22} stroke={2} />
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
