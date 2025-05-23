export function SpotifyLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 11.973c2.5-1.473 5.5-.973 7.5.527M9 15c1.5-.5 3-.5 4.5 0M9 8.5c3-1 5.5-.5 8 1.5" />
    </svg>
  )
}
