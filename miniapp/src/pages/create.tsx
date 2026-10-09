import React, { useState } from "react";
import { useNavigate, useSnackbar } from "zmp-ui";
import { Screen } from "../components/layout";
import { api } from "../lib/api";
import { useDraft } from "../state/draft";
import { IconCheck } from "@tabler/icons-react";

const IMG = "https://static.dggv.edu.vn/360/";
// Mỗi sở thích một ảnh thật; id trùng với category của điểm đến để thuật toán gợi ý chấm điểm
const INTERESTS = [
  { id: "thien-nhien", name: "Thiên nhiên", img: IMG + "1679365135640_daknong-thac-luu-ly.jpg" },
  { id: "van-hoa", name: "Văn hoá", img: IMG + "1679364818513_thien-vien-truc-lam-dao-nguyen-5.jpg" },
  { id: "am-thuc", name: "Ẩm thực", img: IMG + "1682415746498_2022-04-21.jpg" },
  { id: "trai-nghiem", name: "Trải nghiệm", img: IMG + "1681379418700_330464010_1349343925899736_2201816785743800654_n.jpg" },
];

// Một màn hình duy nhất: chọn số ngày (có sẵn mặc định) rồi "Tạo ảnh" là ra poster ngay
export default function CreatePage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { fromSuggest, setNotice } = useDraft();
  const [days, setDays] = useState(2);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => setInterests((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const submit = async () => {
    setLoading(true);
    try {
      const res = await api.suggest({ days, interests, pace: "normal" });
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
        <div className="bottom-stack">
          <div className="summary">{`${days} ngày · ${interests.length ? `${interests.length} sở thích` : "gợi ý đủ loại điểm"}`}</div>
          <button className="btn-primary btn-lg" disabled={loading} onClick={submit}>
            {loading ? "Đang tạo…" : "Tạo ảnh"}
          </button>
        </div>
      }
    >
      <div className="content narrow create">
        <h2 className="q-title">Bạn đi mấy ngày?</h2>
        <div className="day-picker" role="radiogroup" aria-label="Số ngày">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={days === n} className={days === n ? "on" : ""} onClick={() => setDays(n)}>
              <b>{n}</b>
              <span>ngày</span>
            </button>
          ))}
        </div>

        <div className="q-head">
          <h2 className="q-title">Bạn thích gì?</h2>
          <span className="muted">Không bắt buộc</span>
        </div>
        <div className="interest-grid">
          {INTERESTS.map((c) => {
            const on = interests.includes(c.id);
            return (
              <button key={c.id} role="checkbox" aria-checked={on} className={`interest ${on ? "on" : ""}`} onClick={() => toggle(c.id)}>
                <img src={c.img} alt="" loading="lazy" />
                <span className="interest-shade" />
                <span className="interest-name">{c.name}</span>
                <span className="interest-check" aria-hidden>
                  {on ? <IconCheck size={16} stroke={3} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}
