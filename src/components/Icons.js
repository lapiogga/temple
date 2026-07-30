// 사찰 홈페이지 SVG 자산 컴포넌트
// stroke 계열 아이콘은 stroke="currentColor" 로, 상위 요소의 color 로 색을 제어합니다.

export function DharmaWheel({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="19" stroke="#9E3B2F" strokeWidth="1.7" />
      <circle cx="24" cy="24" r="15.5" stroke="#9E3B2F" strokeWidth="1.1" />
      <circle cx="24" cy="24" r="4.4" stroke="#9E3B2F" strokeWidth="1.7" />
      <circle cx="24" cy="24" r="1.7" fill="#9E3B2F" />
      <g stroke="#9E3B2F" strokeWidth="1.5" strokeLinecap="round">
        <line x1="28.4" y1="24" x2="39.5" y2="24" /><line x1="19.6" y1="24" x2="8.5" y2="24" />
        <line x1="24" y1="28.4" x2="24" y2="39.5" /><line x1="24" y1="19.6" x2="24" y2="8.5" />
        <line x1="27.1" y1="27.1" x2="35" y2="35" /><line x1="20.9" y1="20.9" x2="13" y2="13" />
        <line x1="27.1" y1="20.9" x2="35" y2="13" /><line x1="20.9" y1="27.1" x2="13" y2="35" />
      </g>
    </svg>
  );
}

export function LotusMark({ size = 440, className = "", opacity }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" fill="#9E3B2F"
      style={opacity != null ? { opacity } : undefined} aria-hidden="true">
      <g transform="translate(60,60)">
        <g id="hp"><path d="M0 -6 C-8 -26 -8 -44 0 -60 C8 -44 8 -26 0 -6Z" /></g>
        <use href="#hp" transform="rotate(40)" /><use href="#hp" transform="rotate(80)" />
        <use href="#hp" transform="rotate(120)" /><use href="#hp" transform="rotate(160)" />
        <use href="#hp" transform="rotate(200)" /><use href="#hp" transform="rotate(240)" />
        <use href="#hp" transform="rotate(280)" /><use href="#hp" transform="rotate(320)" />
      </g>
    </svg>
  );
}

export function MountainRidge({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 1200 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g stroke="#2E7D74" strokeWidth="2" fill="none" opacity=".55">
        <path d="M0 120 C200 92 330 100 480 120 C630 140 760 128 1200 100" />
        <path d="M0 140 C230 118 400 122 620 136 C820 148 1000 138 1200 126" opacity=".7" />
      </g>
      <g fill="#9E3B2F" opacity=".28"><path d="M748 104 l-8 -12 h16Z" /><rect x="742" y="104" width="12" height="10" /></g>
      <path d="M700 106 q48 -36 96 0" stroke="#9E3B2F" strokeWidth="1.6" fill="none" opacity=".3" />
    </svg>
  );
}

// 단청 패턴 정의 (문서에 1회 렌더) + 색동 구분선
export function DancheongDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <pattern id="dc" width="40" height="26" patternUnits="userSpaceOnUse">
          <path d="M2 24 A18 18 0 0 1 38 24Z" fill="#9E3B2F" />
          <path d="M8 24 A12 12 0 0 1 32 24Z" fill="#C8A24B" />
          <path d="M14 24 A6 6 0 0 1 26 24Z" fill="#2E7D74" />
        </pattern>
      </defs>
    </svg>
  );
}
export function DancheongRule({ height = 14 }) {
  return (
    <svg className="dancheong-rule" viewBox="0 0 1200 26" preserveAspectRatio="none"
      aria-hidden="true" style={{ height }}>
      <rect width="1200" height="26" fill="url(#dc)" />
    </svg>
  );
}

export function LanternIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.4v1.6" /><path d="M12 4.4C6.6 6 6.6 17 12 19c5.4-2 5.4-13 0-14.6Z" />
      <path d="M7.2 9.2h9.6M7.2 14h9.6" /><path d="M12 19v2.4M10.4 21.6h3.2" />
    </svg>
  );
}

export function BellIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17c0-7 2.2-9.8 5-9.8S17 10 17 17" /><path d="M4.8 17h14.4" />
      <path d="M10.2 20a1.9 1.9 0 0 0 3.6 0" /><path d="M12 4.6v2.6" />
    </svg>
  );
}

export function PinIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21c-4.4-5-6.5-7.6-6.5-10.6a6.5 6.5 0 0 1 13 0C18.5 13.4 16.4 16 12 21Z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </svg>
  );
}

export function PhotoIcon({ size = 60, stroke = "var(--n-stroke-2)" }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 24 24" fill="none" stroke={stroke}
      strokeWidth="1.4" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 16l4-4 3 3 4-5 5 6" />
      <circle cx="8" cy="9.5" r="1.2" />
    </svg>
  );
}

export function LotusPlaceholder({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="#9E3B2F" fillOpacity=".16" aria-hidden="true">
      <g transform="translate(24,24)">
        <g id="np"><path d="M0 -3 C-3 -10 -3 -17 0 -23 C3 -17 3 -10 0 -3Z" /></g>
        <use href="#np" transform="rotate(45)" /><use href="#np" transform="rotate(90)" />
        <use href="#np" transform="rotate(135)" /><use href="#np" transform="rotate(180)" />
        <use href="#np" transform="rotate(225)" /><use href="#np" transform="rotate(270)" />
        <use href="#np" transform="rotate(315)" />
      </g>
    </svg>
  );
}

export function MoktakPlaceholder({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#2E7D74"
      strokeWidth="1.4" aria-hidden="true">
      <circle cx="24" cy="25" r="12" fill="#2E7D74" fillOpacity=".1" />
      <path d="M17 30 q7 5 14 0M20 20 h8" strokeLinecap="round" />
      <path d="M31 16 l6 -5" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
