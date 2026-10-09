import React from "react";

// Linh vật "voi con" Đắk Song, dáng chibi (SVG, đổi được màu theo bảng xanh lá của app).
// waving: vẫy tay + lấp lánh; flying: vỗ tai bay; happy: mắt cười; face: chỉ lấy khuôn mặt (ảnh đại diện).
export function Mascot({ size = 104, waving = false, flying = false, happy = false, face = false }: { size?: number; waving?: boolean; flying?: boolean; happy?: boolean; face?: boolean }) {
  const skin = "url(#mascot-skin)";
  const pink = "url(#mascot-pink)";
  const viewBox = face ? "18 14 104 104" : "0 0 140 150";
  const w = size;
  const h = face ? size : (size * 150) / 140;
  return (
    <svg
      className={`mascot ${waving ? "waving" : ""} ${flying ? "flying" : ""}`}
      viewBox={viewBox}
      width={w}
      height={h}
      role="img"
      aria-label="Voi con Đắk Song"
      focusable="false"
    >
      <defs>
        <linearGradient id="mascot-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6f0f8" />
          <stop offset="1" stopColor="#b4c9de" />
        </linearGradient>
        <linearGradient id="mascot-pink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd0da" />
          <stop offset="1" stopColor="#ff9db4" />
        </linearGradient>
      </defs>

      {!face && <ellipse className="mascot-shadow" cx="70" cy="146" rx="34" ry="5" fill="rgba(27,77,32,0.2)" />}

      {/* tai (vỗ khi bay) */}
      <g className="mascot-ear mascot-ear-l">
        <circle cx="29" cy="60" r="27" fill={skin} />
        <circle cx="31" cy="62" r="17" fill={pink} />
      </g>
      <g className="mascot-ear mascot-ear-r">
        <circle cx="111" cy="60" r="27" fill={skin} />
        <circle cx="109" cy="62" r="17" fill={pink} />
      </g>

      {/* thân, chân, tay */}
      {!face && (
        <g>
          <ellipse cx="54" cy="140" rx="12" ry="7" fill="#a6bdd2" />
          <ellipse cx="86" cy="140" rx="12" ry="7" fill="#a6bdd2" />
          <ellipse cx="70" cy="118" rx="29" ry="24" fill={skin} />
          <ellipse cx="70" cy="125" rx="17" ry="14" fill="#f3f8fc" opacity="0.75" />
          <ellipse cx="42" cy="116" rx="8" ry="12.5" fill={skin} transform="rotate(14 42 116)" />
          <g className="mascot-arm">
            <ellipse cx="98" cy="114" rx="8" ry="13" fill={skin} />
            <ellipse cx="98" cy="125" rx="5" ry="3.4" fill={pink} />
          </g>
        </g>
      )}

      {/* đầu */}
      <circle cx="70" cy="62" r="45" fill={skin} />
      <ellipse cx="50" cy="34" rx="15" ry="7" fill="#fff" opacity="0.38" transform="rotate(-28 50 34)" />

      {/* chiếc lá trên đầu */}
      <path d="M70 19 C60 8 64 -1 76 0 C80 9 77 16 70 19Z" fill="#43a047" />
      <path d="M70 19 C77 11 88 11 91 16 C85 23 76 23 70 19Z" fill="#66bb6a" />

      {/* khăn thổ cẩm */}
      {!face && (
        <g>
          <path d="M43 100 Q70 120 97 100 L100 113 Q70 135 40 113 Z" fill="#2e7d32" />
          <path d="M44.5 107 Q70 127 95.5 107" stroke="#e53935" strokeWidth="2" fill="none" />
          <g fill="#ffd54f">
            <path d="M52 113 l3.4 3.6 -3.4 3.6 -3.4 -3.6z" />
            <path d="M64 120 l3.4 3.6 -3.4 3.6 -3.4 -3.6z" />
            <path d="M76 120 l3.4 3.6 -3.4 3.6 -3.4 -3.6z" />
            <path d="M88 113 l3.4 3.6 -3.4 3.6 -3.4 -3.6z" />
          </g>
        </g>
      )}

      {/* vòi ngắn mũm mĩm */}
      <path d="M70 72 C70 90 70 98 62 103" stroke={skin} strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M62 84 h16 M63 91 h14" stroke="#a6bdd2" strokeWidth="1.8" strokeLinecap="round" />

      {/* má hồng + mắt long lanh */}
      <ellipse cx="40" cy="78" rx="8.5" ry="5.5" fill="#ff9db4" opacity="0.6" />
      <ellipse cx="100" cy="78" rx="8.5" ry="5.5" fill="#ff9db4" opacity="0.6" />
      <g className="mascot-eyes">
        {happy ? (
          <>
            <path d="M44 64 Q53 53 62 64" stroke="#1d2b3a" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M78 64 Q87 53 96 64" stroke="#1d2b3a" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="53" cy="62" rx="8.5" ry="10.5" fill="#1d2b3a" />
            <ellipse cx="87" cy="62" rx="8.5" ry="10.5" fill="#1d2b3a" />
            <circle cx="56.5" cy="57" r="3.6" fill="#fff" />
            <circle cx="90.5" cy="57" r="3.6" fill="#fff" />
            <circle cx="50" cy="67.5" r="1.8" fill="#fff" />
            <circle cx="84" cy="67.5" r="1.8" fill="#fff" />
          </>
        )}
      </g>

      {/* lấp lánh khi vẫy tay */}
      {!face && (
        <g className="mascot-sparkles" fill="#ffd54f">
          <path className="sp sp1" d="M122 86 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
          <path className="sp sp2" d="M128 108 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4z" />
          <path className="sp sp3" d="M112 74 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4z" />
        </g>
      )}
    </svg>
  );
}
