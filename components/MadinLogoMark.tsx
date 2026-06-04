type Props = {
  className?: string;
};

export function MadinLogoMark({ className }: Props) {
  return (
    <svg className={className ?? "madin-logo-mark"} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect className="madin-logo-bg" x="4" y="4" width="56" height="56" rx="16" />
      <path className="madin-logo-wave" d="M13 38c6.5-8.5 13.1-8.8 19.8-.9 5.9 6.9 12 6.5 18.2-1.1" />
      <path className="madin-logo-leaf" d="M34 16c8.8 1.2 13.7 6.4 14.7 15.6C39.9 30.8 35 25.6 34 16Z" />
      <path className="madin-logo-line" d="M22 18h10M22 25h8M22 32h18" />
      <circle className="madin-logo-gold" cx="48" cy="18" r="4" />
    </svg>
  );
}
