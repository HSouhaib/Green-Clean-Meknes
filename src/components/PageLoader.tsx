/**
 * Creative loading screen using the site favicon (leaf logo).
 * Used as Suspense fallback for route-level code splitting.
 */
export function PageLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        background: 'var(--bg-primary, #0a0a0a)',
        zIndex: 9999,
      }}
    >
      {/* Leaf logo with breathing + rotating ring animation */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        {/* Rotating ring */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--accent-green, #6B8E5A)',
            borderRightColor: 'var(--accent-green, #6B8E5A)',
            animation: 'loaderRing 1.2s linear infinite',
          }}
        />
        {/* Pulsing leaf */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'loaderPulse 2s ease-in-out infinite',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M16 2C8 8 4 14 4 20c0 6 5.4 10 12 10s12-4 12-10c0-6-4-12-12-18z"
              fill="var(--accent-green, #6B8E5A)"
            />
            <path
              d="M16 6v20"
              stroke="#4A6B3A"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M16 12l-4-2M16 16l-5-1M16 20l-4 1"
              stroke="#4A6B3A"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Loading text with dot animation */}
      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary, #888)',
        }}
      >
        Loading
        <span style={{ display: 'inline-block', width: '1.5em', textAlign: 'left' }}>
          <span style={{ animation: 'loaderDots 1.5s steps(4, end) infinite' }}>
            ...
          </span>
        </span>
      </div>
    </div>
  );
}
