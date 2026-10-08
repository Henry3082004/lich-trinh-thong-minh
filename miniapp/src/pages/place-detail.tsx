import React, { useEffect, useState } from "react";
import { Button, useNavigate, useParams, useSearchParams, useSnackbar } from "zmp-ui";
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

  return (
    <Screen title={place?.name ?? "Điểm đến"}>
      {error && <div className="empty">{error}</div>}
      {!place && !error && <Loading />}
      {place && (
        <div className="content narrow stack">
          {place.images.length > 0 && !imageFailed ? (
            <img
              src={place.images[0]}
              alt={place.name}
              onError={() => setImageFailed(true)}
              style={{ width: "100%", borderRadius: 14, objectFit: "cover", maxHeight: 240 }}
            />
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PlaceThumb place={place} />
            </div>
          )}
          <div>
            <h2 style={{ margin: "4px 0 8px" }}>{place.name}</h2>
            <div className="row" style={{ gap: 6 }}>
              <span className="badge">{categoryName(place.category)}</span>
              <span className="muted">Tham quan ~{formatDuration(place.durationMin)}</span>
            </div>
          </div>
          <div className="card" style={{ lineHeight: 1.6 }}>
            {place.description}
          </div>
          <div className="row" style={{ gap: 12 }}>
            {place.phone && (
              <Button fullWidth variant="secondary" onClick={() => callPhone(place.phone!)}>
                📞 Gọi {place.phone}
              </Button>
            )}
            <Button fullWidth variant="secondary" onClick={() => openLink(directionsUrl(place))}>
              🧭 Chỉ đường
            </Button>
          </div>
          {place.mapLink && (
            <Button fullWidth variant="tertiary" onClick={() => openLink(place.mapLink!)}>
              Xem địa điểm trên Google Maps ↗
            </Button>
          )}
          {(place.address || place.openHours) && (
            <div className="card stack" style={{ gap: 6 }}>
              {place.address && <div>📍 {place.address}</div>}
              {place.openHours && <div>🕒 {place.openHours}</div>}
            </div>
          )}

          {draft && (
            <>
              <div className="section-title" style={{ marginBottom: 0 }}>
                Thêm vào lịch “{draft.title}”
              </div>
              <div className="chips">
                {draft.schedule.map((d) => (
                  <Button
                    key={d.day}
                    size="small"
                    variant={presetDay === d.day ? "primary" : "secondary"}
                    onClick={() => add(d.day)}
                  >
                    Ngày {d.day}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Screen>
  );
}
