'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Something went wrong</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#181818',
              padding: 16,
              borderRadius: 12,
              fontSize: 12,
              color: '#ff8a9b',
            }}
          >
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ''}
          </pre>
          <button
            onClick={reset}
            style={{ marginTop: 12, padding: '8px 20px', borderRadius: 999, border: 0, fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}