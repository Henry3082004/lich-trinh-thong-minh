import React, { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button, useNavigate, useSnackbar } from "zmp-ui";
import { Loading, Screen } from "../components/layout";
import { ItineraryPoster } from "../components/itinerary-poster";
import { isInZalo, saveImage, shareText } from "../lib/zalo";
import { useDraft } from "../state/draft";
import type { Draft } from "../types";

function toText(draft: Draft) {
  const lines = [`🗺️ ${draft.title}`];
  for (const d of draft.schedule) {
    lines.push("", `Ngày ${d.day}:`);
    for (const s of d.stops) lines.push(`• ${s.startTime ?? ""} ${s.place.name}`.trim());
  }
  lines.push("", "Lên lịch bằng Mini App Lịch trình Đắk Song trên Zalo");
  return lines.join("\n");
}

const fileName = (title: string) =>
  `${title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()}.png`;

export default function ExportPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { draft } = useDraft();
  const posterRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!draft || !posterRef.current) return;
    // Đợi font render xong rồi mới chụp
    const node = posterRef.current;
    document.fonts.ready
      // skipFonts: poster chỉ dùng font hệ thống, khỏi tải font icon của zmp-ui
      .then(() => toPng(node, { pixelRatio: 1, cacheBust: true, skipFonts: true }))
      .then(setImage)
      .catch(() => openSnackbar({ text: "Không tạo được ảnh, thử lại nhé", type: "error" }));
  }, [draft]);

  if (!draft) {
    navigate("/", { replace: true });
    return null;
  }

  const onSave = async () => {
    setBusy(true);
    try {
      await saveImage(image, fileName(draft.title));
      openSnackbar({ text: isInZalo() ? "Đã lưu ảnh vào thư viện" : "Đã tải ảnh xuống", type: "success" });
    } catch (e) {
      openSnackbar({ text: `Không lưu được ảnh: ${(e as Error).message ?? ""}`, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    try {
      await shareText(toText(draft));
      if (!isInZalo() && !navigator.share) openSnackbar({ text: "Đã sao chép lịch trình", type: "success" });
    } catch {
      // Người dùng đóng bảng chia sẻ: không cần báo lỗi
    }
  };

  return (
    <Screen
      title="Ảnh lịch trình"
      bottom={
        <>
          <Button variant="secondary" onClick={onShare}>
            Chia sẻ
          </Button>
          <Button loading={busy} disabled={!image} onClick={onSave}>
            Lưu ảnh
          </Button>
        </>
      }
    >
      <div className="content">
        {image ? (
          <div className="poster-frame">
            <img src={image} alt="Ảnh lịch trình" style={{ width: "100%", display: "block" }} />
          </div>
        ) : (
          <Loading />
        )}
      </div>

      {/* Poster kích thước thật, đặt ngoài màn hình để chụp ảnh */}
      <div style={{ position: "fixed", left: -10000, top: 0 }} aria-hidden>
        <ItineraryPoster ref={posterRef} draft={draft} />
      </div>
    </Screen>
  );
}
