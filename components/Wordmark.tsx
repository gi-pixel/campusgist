export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight text-white ${className}`}>
      CampusGist
    </span>
  )
}