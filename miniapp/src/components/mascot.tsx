import React from "react";

// Linh vật "voi con" của Đắk Song (vẽ bằng SVG, đổi màu theo bảng xanh lá của app).
// waving: vẫy tay; happy: mắt cười (khi đang mở chat).
export function Mascot({ size = 84, waving = false, happy = false }: { size?: number; waving?: boolean; happy?: boolean }) {
  const skin = "url(#mascot-skin)";
  return (
    <svg className={`mascot ${waving ? "waving" : ""}`} viewBox="0 0 120 130" width={size} height={(size * 130) / 120} role="img" aria-label="Voi con Đắk Song" focusable="false">
      <defs>
        <linearGradient id="mascot-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbe3ea" />
          <stop offset="1" stopColor="#b6c3cf" />
        </linearGradient>
      </defs>

      {/* bóng dưới chân */}
      <ellipse cx="60" cy="124" rx="30" ry="4.5" fill="rgba(27,77,32,0.18)" />

      {/* tai */}
      <circle cx="25" cy="52" r="18" fill={skin} />
      <circle cx="26" cy="53" r="11" fill="#f4bcc1" />
      <circle cx="95" cy="52" r="18" fill={skin} />
      <circle cx="94" cy="53" r="11" fill="#f4bcc1" />

      {/* thân và chân */}
      <rect x="31" y="80" width="58" height="42" rx="21" fill={skin} />
      <ellipse cx="46" cy="121" rx="11" ry="5.5" fill="#a9b8c5" />
      <ellipse cx="74" cy="121" rx="11" ry="5.5" fill="#a9b8c5" />
      {/* tay trái (đứng yên) */}
      <ellipse cx="32" cy="100" rx="6.5" ry="12" fill={skin} transform="rotate(8 32 100)" />
      {/* tay phải (vẫy) */}
      <g className="mascot-arm">
        <ellipse cx="89" cy="97" rx="6.5" ry="12" fill={skin} />
        <ellipse cx="89" cy="107" rx="5" ry="3.2" fill="#a9b8c5" />
      </g>

      {/* đầu */}
      <circle cx="60" cy="52" r="32" fill={skin} />

      {/* chiếc lá trên đầu */}
      <path d="M60 21 C52 12 56 4 66 4 C70 12 66 19 60 21Z" fill="#43a047" />
      <path d="M60 21 C66 14 74 14 77 18 C72 24 65 24 60 21Z" fill="#66bb6a" />

      {/* vòi */}
      <path d="M60 62 C60 78 60 86 53 93" stroke={skin} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M55 73 h10 M55 80 h9" stroke="#a9b8c5" strokeWidth="1.6" strokeLinecap="round" />

      {/* khăn thổ cẩm */}
      <path d="M36 85 Q60 101 84 85 L86 96 Q60 113 34 96 Z" fill="#2e7d32" />
      <path d="M37.5 91 Q60 107 82.5 91" stroke="#e53935" strokeWidth="1.8" fill="none" />
      <g fill="#ffd54f">
        <path d="M45 97 l3 3.2 -3 3.2 -3 -3.2z" />
        <path d="M56 101.5 l3 3.2 -3 3.2 -3 -3.2z" />
        <path d="M68 101.5 l3 3.2 -3 3.2 -3 -3.2z" />
        <path d="M79 97 l3 3.2 -3 3.2 -3 -3.2z" />
      </g>

      {/* mặt */}
      <circle cx="41" cy="60" r="5.5" fill="#f4a3aa" opacity="0.55" />
      <circle cx="79" cy="60" r="5.5" fill="#f4a3aa" opacity="0.55" />
      <g className="mascot-eyes">
        {happy ? (
          <>
            <path d="M43 50 Q49 43 55 50" stroke="#1f2a1f" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M65 50 Q71 43 77 50" stroke="#1f2a1f" strokeWidth="3.2" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <circle cx="49" cy="49" r="4.6" fill="#1f2a1f" />
            <circle cx="71" cy="49" r="4.6" fill="#1f2a1f" />
            <circle cx="50.6" cy="47.4" r="1.6" fill="#fff" />
            <circle cx="72.6" cy="47.4" r="1.6" fill="#fff" />
          </>
        )}
      </g>
    </svg>
  );
}
