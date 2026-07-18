interface BlockProps {
  height: string;
  className?: string;
}

function Block({ height, className = '' }: BlockProps) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
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

function SkeletonSection({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ paddingBottom: 'var(--section-gap)' }}>
      <div style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
        {children}
      </div>
    </section>
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
            <Block height="18rem" />
          </div>
        </section>

        {/* Impact stats */}
        <SkeletonSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Block height="5rem" />
            <Block height="5rem" />
            <Block height="5rem" />
            <Block height="5rem" />
          </div>
        </SkeletonSection>

        {/* About */}
        <SkeletonSection>
          <div className="mx-auto max-w-2xl space-y-3">
            <Line width="35%" height="1.25rem" />
            <Line width="100%" />
            <Line width="92%" />
            <Line width="70%" />
          </div>
        </SkeletonSection>

        {/* Leaderboard */}
        <SkeletonSection>
          <div
            className="mx-auto"
            style={{ maxWidth: '1000px' }}
          >
            <div className="flex items-end justify-center gap-3 mb-5">
              <Block height="8rem" className="w-full md:w-36" />
              <Block height="11rem" className="w-full md:w-40" />
              <Block height="8rem" className="w-full md:w-36" />
            </div>
            <Block height="8rem" />
          </div>
        </SkeletonSection>

        {/* Neighborhoods */}
        <SkeletonSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Block height="12rem" />
            <Block height="12rem" />
            <Block height="12rem" />
          </div>
        </SkeletonSection>

        {/* Community (gallery / partners / testimonials / poll / faq tabs) */}
        <SkeletonSection>
          <div className="flex gap-2 mb-4">
            <Block height="2rem" className="w-20" />
            <Block height="2rem" className="w-20" />
            <Block height="2rem" className="w-20" />
            <Block height="2rem" className="w-20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Block height="8rem" />
            <Block height="8rem" />
          </div>
        </SkeletonSection>

        {/* Air quality */}
        <SkeletonSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Block height="6rem" />
            <Block height="6rem" />
            <Block height="6rem" />
          </div>
        </SkeletonSection>

        {/* How to join */}
        <SkeletonSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Block height="10rem" />
            <Block height="10rem" />
            <Block height="10rem" />
          </div>
        </SkeletonSection>

        {/* Campaigns */}
        <SkeletonSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Block height="14rem" />
            <Block height="14rem" />
            <Block height="14rem" />
          </div>
        </SkeletonSection>

        {/* Contact */}
        <SkeletonSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Block height="14rem" />
            <Block height="14rem" />
          </div>
        </SkeletonSection>

        {/* Donation */}
        <SkeletonSection>
          <Block height="12rem" />
        </SkeletonSection>
      </main>

      {/* Footer placeholder */}
      <footer
        className="h-24 animate-pulse"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--bg-surface-light)',
        }}
      />
    </div>
  );
}
