/** One 18px line mark per 청년정책 분야. Inherits currentColor. */
// youth 분야 → the icon drawn for the original 창업 type slot
const ICON_OF: Record<string, string> = {
  "취업·일경험": "인력",
  "창업·농어업": "사업화",
  "주거": "시설·공간·보육",
  "교육·역량": "멘토링·컨설팅·교육",
  "금융·생활안정": "융자·보증",
  "문화·건강": "행사·네트워크",
  "참여·권리": "글로벌",
  "정책기반": "기술개발(R&D)",
};

export default function TypeIcon({ type }: { type: string }) {
  const p = {
    width: 18,
    height: 18,
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (ICON_OF[type] ?? type) {
    case "사업화": // rocket
      return (
        <svg {...p}>
          <path d="M9 1.8c2.6 1.7 4 4.4 4 7.2l-1.7 3.4H6.7L5 9C5 6.2 6.4 3.5 9 1.8Z" />
          <circle cx="9" cy="7.4" r="1.5" />
          <path d="M6.7 12.4 5 15l2.6-.9M11.3 12.4 13 15l-2.6-.9" />
        </svg>
      );
    case "시설·공간·보육": // building
      return (
        <svg {...p}>
          <path d="M2.6 15.4h12.8M4.3 15.4V4.1l5-2.2 4.4 2.2v11.3" />
          <path d="M6.8 6.9h1.4M6.8 9.7h1.4M11 6.9h1.2M11 9.7h1.2M7.9 15.4v-3h2.4v3" />
        </svg>
      );
    case "멘토링·컨설팅·교육": // mentor
      return (
        <svg {...p}>
          <circle cx="6.6" cy="5.6" r="2.4" />
          <path d="M2.4 15.1c0-2.4 1.9-4.2 4.2-4.2s4.2 1.8 4.2 4.2" />
          <path d="M12.2 4.3h3.4M12.2 7.2h3.4M12.2 10.1h2.2" />
        </svg>
      );
    case "행사·네트워크": // network
      return (
        <svg {...p}>
          <circle cx="9" cy="3.6" r="1.9" />
          <circle cx="3.8" cy="13.2" r="1.9" />
          <circle cx="14.2" cy="13.2" r="1.9" />
          <path d="M7.6 5.3 5 11.5M10.4 5.3 13 11.5M5.7 13.2h6.6" />
        </svg>
      );
    case "글로벌": // globe
      return (
        <svg {...p}>
          <circle cx="9" cy="9" r="7.1" />
          <path d="M1.9 9h14.2M9 1.9c1.9 2 2.9 4.5 2.9 7.1S10.9 15 9 16.1C7.1 14.1 6.1 11.6 6.1 9S7.1 3 9 1.9Z" />
        </svg>
      );
    case "융자·보증": // coins
      return (
        <svg {...p}>
          <ellipse cx="9" cy="4.6" rx="5.6" ry="2.4" />
          <path d="M3.4 4.6v3.9c0 1.3 2.5 2.4 5.6 2.4s5.6-1.1 5.6-2.4V4.6" />
          <path d="M3.4 8.5v3.9c0 1.3 2.5 2.4 5.6 2.4s5.6-1.1 5.6-2.4V8.5" />
        </svg>
      );
    case "기술개발(R&D)": // flask
      return (
        <svg {...p}>
          <path d="M7.2 1.9v4.6L3.1 13.2c-.6 1 .1 2.3 1.3 2.3h9.2c1.2 0 1.9-1.3 1.3-2.3l-4.1-6.7V1.9" />
          <path d="M6.2 1.9h5.6M5.2 10.6h7.6" />
        </svg>
      );
    case "인력": // people
      return (
        <svg {...p}>
          <circle cx="6.4" cy="5.4" r="2.3" />
          <path d="M2.3 14.8c0-2.3 1.8-4.1 4.1-4.1s4.1 1.8 4.1 4.1" />
          <path d="M12 3.5a2.3 2.3 0 0 1 0 4.4M12.6 10.9c1.7.4 3.1 1.9 3.1 3.9" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="9" cy="9" r="6.6" />
        </svg>
      );
  }
}
