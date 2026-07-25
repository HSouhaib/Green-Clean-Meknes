interface BlockProps {
  height: string;
  className?: string;
  width?: string;
}

function Shimmer({ height, className = '', width }: BlockProps) {
  return (
    <div
      className={`rounded-lg shimmer ${className}`}
      style={{
        height,
        width,
        background: 'var(--bg-surface)',
      }}
    />
  );
}

function Line({ width, height = '0.75rem', className = '' }: { width: string; height?: string; className?: string }) {
  return (
    <div
      className={`rounded shimmer ${className}`}
      style={{
        width,
        height,
        background: 'var(--bg-surface-light)',
      }}
    />
  );
}

function Circle({ size = '3rem' }: { size?: string }) {
  return (
    <div
      className="rounded-full shimmer"
      style={{
        width: size,
        height: size,
        background: 'var(--bg-surface)',
      }}
    />
  );
}

function SectionHeader() {
  return (
    <div className="space-y-3 mb-8 text-center">
      <Line width="5rem" height="0.65rem" className="mx-auto" />
      <Line width="min(24rem, 70%)" height="1.75rem" className="mx-auto" />
      <Line width="min(28rem, 80%)" height="0.85rem" className="mx-auto" />
    </div>
  );
}

function SkeletonSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section style={{ padding: 'var(--section-gap) 0' }} className={className}>
      <div style={{ padding: '0 var(--page-margin)', maxWidth: '1400px', margin: '0 auto' }}>
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
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            var(--bg-surface) 0%,
            var(--bg-surface-light) 50%,
            var(--bg-surface) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite linear;
        }
      `}</style>

      {/* Navigation placeholder */}
      <div
        className="sticky top-0 z-50 h-16 w-full"
        style={{
          background: 'rgba(var(--bg-surface-rgb, 10,10,10), 0.85)',
          borderBottom: '1px solid var(--bg-surface-light)',
        }}
      >
        <div style={{ padding: '0 var(--page-margin)', maxWidth: '1400px', margin: '0 auto' }} className="h-full flex items-center justify-between">
          <Line width="8rem" height="1.5rem" />
          <div className="flex items-center gap-4">
            <Line width="4rem" height="0.75rem" />
            <Line width="4rem" height="0.75rem" />
            <Line width="4rem" height="0.75rem" />
            <Circle size="2rem" />
          </div>
        </div>
      </div>

      <main>
        {/* Hero */}
        <SkeletonSection>
          <div className="relative rounded-2xl overflow-hidden" style={{ height: 'clamp(20rem, 50vh, 36rem)' }}>
            <Shimmer height="100%" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Line width="min(32rem, 80%)" height="2.5rem" />
              <Line width="min(24rem, 60%)" height="1rem" />
              <div className="flex gap-3 mt-4">
                <Shimmer height="2.5rem" width="8rem" />
                <Shimmer height="2.5rem" width="8rem" />
              </div>
            </div>
          </div>
        </SkeletonSection>

        {/* Impact stats */}
        <SkeletonSection>
          <SectionHeader />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-surface)' }}>
                <Circle size="3rem" />
                <Line width="4rem" height="1.75rem" />
                <Line width="6rem" height="0.75rem" />
              </div>
            ))}
          </div>
        </SkeletonSection>

        {/* About */}
        <SkeletonSection>
          <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-center">
            <div className="w-full md:w-[45%] space-y-4">
              <Line width="5rem" height="0.65rem" />
              <Line width="90%" height="1.75rem" />
              <Line width="100%" height="0.85rem" />
              <Line width="92%" height="0.85rem" />
              <Line width="70%" height="0.85rem" />
              <div className="flex items-center gap-6 md:gap-8 pt-8">
                <div className="space-y-2">
                  <Line width="3rem" height="1.5rem" />
                  <Line width="5rem" height="0.7rem" />
                </div>
                <span style={{ color: 'var(--text-tertiary)' }}>|</span>
                <div className="space-y-2">
                  <Line width="3rem" height="1.5rem" />
                  <Line width="5rem" height="0.7rem" />
                </div>
                <span style={{ color: 'var(--text-tertiary)' }}>|</span>
                <div className="space-y-2">
                  <Line width="3rem" height="1.5rem" />
                  <Line width="5rem" height="0.7rem" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-[55%]">
              <Shimmer height="18rem" />
            </div>
          </div>
        </SkeletonSection>

        {/* Leaderboard */}
        <SkeletonSection>
          <SectionHeader />
          <div className="mx-auto" style={{ maxWidth: '1000px' }}>
            <div className="flex items-end justify-center gap-3 mb-6">
              <div className="w-full md:w-36 h-32 md:h-40 flex flex-col items-center justify-end pb-4 rounded-t-xl" style={{ background: 'var(--bg-surface)' }}>
                <Circle size="3rem" />
                <Line width="5rem" height="0.8rem" className="mt-3" />
              </div>
              <div className="w-full md:w-40 h-36 md:h-44 flex flex-col items-center justify-end pb-4 rounded-t-xl" style={{ background: 'var(--bg-surface)' }}>
                <Circle size="3.5rem" />
                <Line width="5rem" height="0.9rem" className="mt-3" />
              </div>
              <div className="w-full md:w-36 h-32 md:h-40 flex flex-col items-center justify-end pb-4 rounded-t-xl" style={{ background: 'var(--bg-surface)' }}>
                <Circle size="3rem" />
                <Line width="5rem" height="0.8rem" className="mt-3" />
              </div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                  <Circle size="2.5rem" />
                  <div className="flex-1 space-y-2">
                    <Line width="8rem" height="0.85rem" />
                    <Line width="5rem" height="0.65rem" />
                  </div>
                  <Line width="3rem" height="0.85rem" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonSection>

        {/* Neighborhoods */}
        <SkeletonSection>
          <SectionHeader />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
                <Shimmer height="12rem" />
                <div className="p-4 space-y-3">
                  <Line width="70%" height="1rem" />
                  <Line width="50%" height="0.75rem" />
                  <Line width="90%" height="0.75rem" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonSection>

        {/* Community (gallery / partners / testimonials / poll / faq) */}
        <SkeletonSection>
          <SectionHeader />
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Shimmer key={i} height="2.25rem" width="5rem" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Shimmer height="10rem" />
                <Line width="60%" height="0.75rem" />
              </div>
            ))}
          </div>
        </SkeletonSection>

        {/* Air quality */}
        <SkeletonSection>
          <SectionHeader />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-surface)' }}>
                <div className="flex items-center gap-3">
                  <Circle size="2.5rem" />
                  <Line width="6rem" height="0.85rem" />
                </div>
                <Line width="40%" height="1.75rem" />
                <Line width="80%" height="0.75rem" />
              </div>
            ))}
          </div>
        </SkeletonSection>

        {/* How to join */}
        <SkeletonSection>
          <SectionHeader />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl space-y-4" style={{ background: 'var(--bg-surface)' }}>
                <Circle size="3rem" />
                <Line width="70%" height="1.1rem" />
                <Line width="100%" height="0.75rem" />
                <Line width="85%" height="0.75rem" />
              </div>
            ))}
          </div>
        </SkeletonSection>

        {/* Campaigns */}
        <SkeletonSection>
          <SectionHeader />
          <Shimmer height="clamp(16rem, 40vh, 24rem)" className="mb-6 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
                <Shimmer height="11rem" />
                <div className="p-4 space-y-3">
                  <Line width="80%" height="1rem" />
                  <Line width="50%" height="0.75rem" />
                  <Line width="100%" height="0.75rem" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonSection>

        {/* Contact */}
        <SkeletonSection>
          <SectionHeader />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl space-y-4" style={{ background: 'var(--bg-surface)' }}>
              <Line width="100%" height="2.5rem" />
              <Line width="100%" height="2.5rem" />
              <Line width="100%" height="8rem" />
              <Shimmer height="2.5rem" width="8rem" />
            </div>
            <div className="p-5 rounded-xl space-y-4" style={{ background: 'var(--bg-surface)' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Circle size="2.5rem" />
                  <div className="flex-1 space-y-2">
                    <Line width="40%" height="0.8rem" />
                    <Line width="70%" height="0.7rem" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SkeletonSection>

        {/* Donation */}
        <SkeletonSection>
          <SectionHeader />
          <div className="max-w-2xl mx-auto p-6 rounded-xl flex flex-col md:flex-row gap-6 items-center" style={{ background: 'var(--bg-surface)' }}>
            <Shimmer height="10rem" width="10rem" />
            <div className="flex-1 w-full space-y-3">
              <Line width="70%" height="1.1rem" />
              <Line width="100%" height="0.8rem" />
              <Line width="90%" height="0.8rem" />
            </div>
          </div>
        </SkeletonSection>
      </main>

      {/* Footer placeholder */}
      <footer
        className="py-10"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--bg-surface-light)',
        }}
      >
        <div style={{ padding: '0 var(--page-margin)', maxWidth: '1400px', margin: '0 auto' }} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <Line width="8rem" height="1.25rem" />
            <Line width="100%" height="0.75rem" />
            <Line width="80%" height="0.75rem" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Line width="5rem" height="0.85rem" />
              <Line width="80%" height="0.75rem" />
              <Line width="70%" height="0.75rem" />
              <Line width="60%" height="0.75rem" />
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
