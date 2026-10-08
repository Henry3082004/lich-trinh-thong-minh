import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useSnackbar } from "zmp-ui";
import { Loading, Screen } from "../components/layout";
import { PlaceThumb } from "../components/place-card";
import { api } from "../lib/api";
import { formatDuration } from "../lib/schedule";
import { directionsUrl } from "../lib/maps";
import { callPhone, openLink } from "../lib/zalo";
import { useDraft } from "../state/draft";
import { categoryName, type Place } from "../types";

export default function PlaceDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { draft, addStop } = useDraft();
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const presetDay = Number(params.get("day")) || undefined;

  useEffect(() => {
    setImageFailed(false);
    api.place(id).then(setPlace).catch((e) => setError((e as Error).message));
  }, [id]);

  const add = (day: number) => {
    if (!place) return;
    addStop(day, place);
    openSnackbar({ text: `Đã thêm vào ngày ${day}`, type: "success" });
    // Đến từ "Thêm điểm" của Editor (Editor → Places → đây) thì quay về đúng Editor cũ
    if (presetDay) navigate(-2);
    else navigate("/editor");
  };

  const heroOk = !!place && place.images.length > 0 && !imageFailed;

  return (
    <Screen
      bottom={
        place && draft ? (
          <div className="bottom-stack">
            <div className="chips" style={{ justifyContent: "center" }}>
              {draft.schedule.map((d) => (
                <button key={d.day} className={`chip ${presetDay === d.day ? "active" : ""}`} onClick={() => add(d.day)}>
                  Thêm vào ngày {d.day}
                </button>
              ))}
            </div>
          </div>
        ) : undefined
      }
    >
      <button className="round-back" aria-label="Quay lại" onClick={() => navigate(-1)}>
        ‹
      </button>
      {error && <div className="empty">{error}</div>}
      {!place && !error && <Loading />}
      {place && (
        <div className="detail">
          <div className="detail-hero">
            {heroOk ? <img src={place.images[0]} alt={place.name} onError={() => setImageFailed(true)} /> : <PlaceThumb place={place} />}
            <div className="detail-hero-shade" />
          </div>
          <div className="detail-sheet content narrow stack">
            <div>
              <span className="badge-green">
                {categoryName(place.category)} · ~{formatDuration(place.durationMin)}
              </span>
              <h2 className="detail-name">{place.name}</h2>
              {place.address && <div className="detail-addr">{place.address}</div>}
            </div>
            <div className="detail-desc">{place.description}</div>
            <div className="detail-actions">
              {place.phone && (
                <button className="btn-outline" onClick={() => callPhone(place.phone!)}>
                  Gọi {place.phone}
                </button>
              )}
              <button className="btn-outline" onClick={() => openLink(directionsUrl(place))}>
                Chỉ đường
              </button>
              {place.mapLink && (
                <button className="btn-outline brown" onClick={() => openLink(place.mapLink!)}>
                  Xem địa điểm trên Google Maps ↗
                </button>
              )}
            </div>
            {place.openHours && <div className="muted">🕒 {place.openHours}</div>}
          </div>
        </div>
      )}
    </Screen>
  );
}
