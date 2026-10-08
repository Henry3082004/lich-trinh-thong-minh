import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, useNavigate, useSnackbar } from "zmp-ui";
import { Screen } from "../components/layout";
import { PosterCanvas, TEMPLATES } from "../components/poster/PosterCanvas";
import { buildPosterData, photoUrlsOf, pickHeroUrl, POSTER_WIDTH } from "../components/poster/poster-data";
import { api } from "../lib/api";
import { capturePoster, dataUrlToBlob } from "../lib/capture";
import { loadPhoto, loadPhotos } from "../lib/images";
import { isInZalo, saveImage, shareImage } from "../lib/zalo";
import { useDraft } from "../state/draft";

const fileName = (title: string, ext: string) =>
  `${title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "lich-trinh"}.${ext}`;

export default function PosterPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { draft, template, setTemplate, setTitle, markSaved, notice, setNotice } = useDraft();

  const posterRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const [posterHeight, setPosterHeight] = useState(1350);
  const [thumbs, setThumbs] = useState<Map<string, string | null>>(new Map());
  const [hero, setHero] = useState<string | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [busy, setBusy] = useState<"save" | "share" | "keep" | null>(null);

  useEffect(() => {
    if (!draft) navigate("/", { replace: true });
  }, [draft]);

  // Ghi chú chỉ hiện một lần, rời màn ảnh là bỏ
  useEffect(() => () => setNotice(null), []);

  // Tải ảnh thật của các điểm (qua backend) rồi mới điền vào poster; lỗi thì poster dùng hình thay thế
  const photoKey = draft ? photoUrlsOf(draft).join("|") : "";
  useEffect(() => {
    if (!draft) return;
    let cancelled = false;
    setLoadingPhotos(true);
    const heroUrl = pickHeroUrl(draft);
    Promise.all([loadPhotos(photoUrlsOf(draft), 480), heroUrl ? loadPhoto(heroUrl, 1080) : Promise.resolve(null)]).then(([t, h]) => {
      if (cancelled) return;
      setThumbs(t);
      setHero(h);
      setLoadingPhotos(false);
    });
    return () => {
      cancelled = true;
    };
  }, [photoKey]);

  const data = useMemo(() => (draft ? buildPosterData(draft, thumbs, hero) : null), [draft, thumbs, hero]);

  // Xem trước = chính poster 1080 px thu nhỏ vừa khung (đổi mẫu/đổi tên thấy ngay, không phải chụp lại)
  useEffect(() => {
    const frame = frameRef.current;
    const poster = posterRef.current;
    if (!frame || !poster) return;
    const update = () => {
      setScale(frame.clientWidth / POSTER_WIDTH);
      setPosterHeight(poster.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    ro.observe(poster);
    return () => ro.disconnect();
  // Chạy lại khi đổi mẫu: mỗi mẫu là một thẻ DOM khác nên phải theo dõi thẻ mới
  }, [data === null, template]);

  if (!draft || !data) return null;

  const onSave = async () => {
    setBusy("save");
    try {
      const node = posterRef.current!;
      // Điện thoại đời cũ có thể không đủ bộ nhớ cho ảnh 2160 px: lỗi thì thử lại khổ thường
      let dataUrl: string;
      try {
        dataUrl = await capturePoster(node, "png", { pixelRatio: 2 });
      } catch {
        dataUrl = await capturePoster(node, "png", { pixelRatio: 1 });
      }
      await saveImage(dataUrl, fileName(draft.title, "png"));
      openSnackbar({ text: isInZalo() ? "Đã lưu ảnh vào thư viện" : "Đã tải ảnh xuống", type: "success" });
    } catch (e) {
      openSnackbar({ text: `Không lưu được ảnh: ${(e as Error).message ?? ""}`, type: "error" });
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    setBusy("share");
    try {
      const dataUrl = await capturePoster(posterRef.current!, "jpeg", { pixelRatio: 1 });
      const blob = await dataUrlToBlob(dataUrl);
      const result = await shareImage(blob, fileName(draft.title, "jpg"), dataUrl, api.uploadPoster);
      if (result === "saved") openSnackbar({ text: "Chưa gửi trực tiếp được, ảnh đã lưu vào thư viện, bạn gửi từ đó nhé", type: "default" });
      if (result === "downloaded") openSnackbar({ text: "Đã tải ảnh xuống, bạn gửi từ thư viện nhé", type: "success" });
    } catch (e) {
      // Người dùng đóng bảng chia sẻ thì không phải lỗi
      if ((e as Error).name !== "AbortError") openSnackbar({ text: `Không gửi được ảnh: ${(e as Error).message ?? ""}`, type: "error" });
    } finally {
      setBusy(null);
    }
  };

  const onKeep = async () => {
    setBusy("keep");
    try {
      const saved = await api.save(draft);
      markSaved(saved.id);
      openSnackbar({ text: "Đã lưu vào Lịch của tôi", type: "success" });
    } catch (e) {
      openSnackbar({ text: `Không lưu được: ${(e as Error).message}`, type: "error" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen
      title="Ảnh lịch trình"
      bottom={
        <>
          <Button variant="secondary" loading={busy === "save"} disabled={busy !== null && busy !== "save"} onClick={onSave}>
            Lưu ảnh
          </Button>
          <Button loading={busy === "share"} disabled={busy !== null && busy !== "share"} onClick={onShare}>
            {isInZalo() ? "Gửi qua Zalo" : "Chia sẻ ảnh"}
          </Button>
        </>
      }
    >
      <div className="content narrow">
        <input
          className="title-input"
          value={draft.title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Tên chuyến đi"
        />

        {notice && (
          <div className="notice" style={{ marginTop: 10 }}>
            {notice}
          </div>
        )}

        <div className="template-row" role="radiogroup" aria-label="Mẫu ảnh">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={template === t.id}
              className={`template-chip ${template === t.id ? "active" : ""}`}
              onClick={() => setTemplate(t.id)}
            >
              <span className="swatch" style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }} />
              {t.name}
            </button>
          ))}
        </div>

        <div ref={frameRef} className="poster-preview" style={{ height: posterHeight * scale }}>
          <div style={{ width: POSTER_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <PosterCanvas ref={posterRef} data={data} template={template} />
          </div>
          {loadingPhotos && <div className="poster-loading">Đang tải ảnh địa điểm…</div>}
        </div>

        <div className="row" style={{ gap: 10, marginTop: 14 }}>
          <Button fullWidth size="small" variant="tertiary" onClick={() => navigate("/editor")}>
            ✏️ Chỉnh lịch
          </Button>
          <Button fullWidth size="small" variant="tertiary" loading={busy === "keep"} onClick={onKeep}>
            💾 Lưu vào Lịch của tôi
          </Button>
        </div>
      </div>
    </Screen>
  );
}
