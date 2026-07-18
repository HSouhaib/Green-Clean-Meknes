interface BlockProps {
  height: string;
  className?: string;
}

function Block({ height, className = '' }: BlockProps) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{
        height,
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-surface-light)',
      }}
    />
  );
}

interface LineProps {
  width: string;
  height?: string;
}

function Line({ width, height = '0.75rem' }: LineProps) {
  return (
    <div
      className="rounded animate-pulse"
      style={{
        width,
        height,
        background: 'var(--bg-surface-light)',
      }}
    />
  );
}

export default function HomeSkeleton() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
      aria-busy="true"
      aria-label="Loading page"
    >
      {/* Navigation placeholder */}
      <div
        className="sticky top-0 z-50 h-16 w-full animate-pulse"
        style={{
          background: 'rgba(var(--bg-surface-rgb, 10,10,10), 0.85)',
          borderBottom: '1px solid var(--bg-surface-light)',
        }}
      />

      <main>
        {/* Hero */}
        <section style={{ padding: 'var(--section-gap) 0' }}>
          <div style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
            <Block height="24rem" />
          </div>
        </section>

        {/* Impact stats */}
        <section style={{ paddingBottom: 'var(--section-gap)' }}>
          <div style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Block height="6rem" />
              <Block height="6rem" />
              <Block height="6rem" />
              <Block height="6rem" />
            </div>
          </div>
        </section>

        {/* About / text section */}
        <section style={{ paddingBottom: 'var(--section-gap)' }}>
          <div style={{ padding: '0 var(--page-margin)', maxWidth: '1200px' }}>
            <div className="mx-auto max-w-2xl space-y-4">
              <Line width="40%" height="1.5rem" />
              <Line width="100%" />
              <Line width="90%" />
              <Line width="75%" />
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section style={{ paddingBottom: 'var(--section-gap)' }}>
          <div style={{ padding: '0 var(--page-margin)', maxWidth: '1200px' }}>
            <div className="flex items-end justify-center gap-3 mb-6">
              <Block height="10rem" className="w-full md:w-44" />
              <Block height="14rem" className="w-full md:w-48" />
              <Block height="10rem" className="w-full md:w-44" />
            </div>
            <Block height="12rem" />
          </div>
        </section>

        {/* Neighborhoods / cards */}
        <section style={{ paddingBottom: 'var(--section-gap)' }}>
          <div style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Block height="16rem" />
              <Block height="16rem" />
              <Block height="16rem" />
            </div>
          </div>
        </section>

        {/* Community / testimonials */}
        <section style={{ paddingBottom: 'var(--section-gap)' }}>
          <div style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Block height="10rem" />
              <Block height="10rem" />
            </div>
          </div>
        </section>

        {/* Campaigns */}
        <section style={{ paddingBottom: 'var(--section-gap)' }}>
          <div style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Block height="18rem" />
              <Block height="18rem" />
              <Block height="18rem" />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section style={{ paddingBottom: 'var(--section-gap)' }}>
          <div style={{ padding: '0 var(--page-margin)', maxWidth: '1200px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Block height="20rem" />
              <Block height="20rem" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer placeholder */}
      <footer
        className="h-32 animate-pulse"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--bg-surface-light)',
        }}
      />
    </div>
  );
}
