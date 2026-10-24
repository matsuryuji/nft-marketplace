export function ThankYouIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 52" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path d="M4 22 24 6l20 16v24a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V22Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="10" y="2" width="28" height="26" rx="1.5" fill="var(--surface)" stroke="currentColor" strokeWidth="2" />
      <text x="24" y="13" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" fontFamily="inherit">
        THANK
      </text>
      <text x="24" y="21" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" fontFamily="inherit">
        YOU
      </text>
      <path d="M4 22l20 14 20-14M4 46l15-12M44 46 29 34" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}
