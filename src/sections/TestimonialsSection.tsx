import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export default function TestimonialsSection() {
  const { t, lang } = useLanguage();
  const { data: testimonials } = trpc.testimonial.list.useQuery();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeTestimonials = testimonials?.filter((t) => t.isActive) ?? [];
  const total = activeTestimonials.length;

  const getQuote = (testimonial: typeof activeTestimonials[0]) => {
    if (lang === 'ar' && testimonial.quoteAr) return testimonial.quoteAr;
    if (lang === 'fr' && testimonial.quoteFr) return testimonial.quoteFr;
    return testimonial.quoteEn;
  };

  const getName = (testimonial: typeof activeTestimonials[0]) => {
    if (lang === 'ar' && testimonial.nameAr) return testimonial.nameAr;
    if (lang === 'fr' && testimonial.nameFr) return testimonial.nameFr;
    return testimonial.name;
  };

  const getRole = (testimonial: typeof activeTestimonials[0]) => {
    if (lang === 'ar' && testimonial.roleAr) return testimonial.roleAr;
    if (lang === 'fr' && testimonial.roleFr) return testimonial.roleFr;
    return testimonial.role;
  };

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [isPaused, total, next]);

  if (total === 0) return null;

  const visibleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : Math.min(total, 3);
  const getVisibleIndices = () => {
    const indices = [];
    for (let i = 0; i < visibleCount; i++) {
      indices.push((currentIndex + i) % total);
    }
    return indices;
  };

  return (
    <section
      id="testimonials"
      style={{ padding: 'var(--section-gap) 0' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        className="mx-auto"
        style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}
      >
        <div className="text-center mb-12">
          <h2
            className="font-display"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('testimonials.heading')}
          </h2>
          <p
            className="text-sm font-light mt-2 mx-auto max-w-md"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('testimonials.subheading')}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getVisibleIndices().map((idx) => {
              const testimonial = activeTestimonials[idx];
              return (
                <div
                  key={testimonial.id}
                  className="flex flex-col items-center text-center p-6 rounded-lg transition-all duration-500"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-surface-light)',
                  }}
                >
                  <Quote
                    size={24}
                    strokeWidth={1}
                    style={{ color: 'var(--accent-green-light)', opacity: 0.5 }}
                    className="mb-4"
                  />
                  <p
                    className="text-sm font-light leading-relaxed flex-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    "{getQuote(testimonial)}"
                  </p>
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        background: 'var(--accent-green)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      {getName(testimonial).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {getName(testimonial)}
                      </div>
                      <div
                        className="text-xs font-light"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {getRole(testimonial)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation arrows (only if more than visibleCount) */}
          {total > visibleCount && (
            <>
              <button
                onClick={prev}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-11 h-11 items-center justify-center rounded-full border-none cursor-pointer"
                style={{ color: 'var(--text-tertiary)', background: 'var(--bg-surface)' }}
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={next}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-11 h-11 items-center justify-center rounded-full border-none cursor-pointer"
                style={{ color: 'var(--text-tertiary)', background: 'var(--bg-surface)' }}
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Dots */}
          {total > visibleCount && (
            <div className="flex justify-center gap-3 mt-6">
              {activeTestimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className="rounded-full transition-all duration-300 border-none cursor-pointer flex items-center justify-center"
                  style={{
                    width: '24px',
                    height: '24px',
                    background: idx === currentIndex ? 'var(--accent-green-light)' : 'var(--bg-surface-light)',
                    opacity: idx === currentIndex ? 1 : 0.5,
                  }}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
