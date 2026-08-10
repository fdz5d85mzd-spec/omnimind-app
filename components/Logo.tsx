export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5B6EF5" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="7" fill="url(#logoGrad)" />
      <circle cx="12" cy="12" r="4.2" fill="#0A0E2E" />
      <circle cx="12" cy="12" r="1.7" fill="url(#logoGrad)" />
    </svg>
  );
}

export function Logo({ size = 20, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      {withWordmark && (
        <span className="font-head font-semibold text-[15px] tracking-tight text-white">OmniMind</span>
      )}
    </div>
  );
}
