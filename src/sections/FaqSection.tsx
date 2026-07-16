import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

function getFaqQuestion(faq: { questionEn: string; questionFr: string | null; questionAr: string | null }, lang: string): string {
  if (lang === 'fr' && faq.questionFr) return faq.questionFr;
  if (lang === 'ar' && faq.questionAr) return faq.questionAr;
  return faq.questionEn;
}

function getFaqAnswer(faq: { answerEn: string; answerFr: string | null; answerAr: string | null }, lang: string): string {
  if (lang === 'fr' && faq.answerFr) return faq.answerFr;
  if (lang === 'ar' && faq.answerAr) return faq.answerAr;
  return faq.answerEn;
}

export default function FaqSection() {
  const { t, lang, dir } = useLanguage();
  const { data: faqs, isLoading } = trpc.faq.list.useQuery();
  const [openId, setOpenId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <section id="faq" style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-primary)' }}>
        <div className="mx-auto text-center" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
          <div className="animate-pulse h-32 rounded-lg" style={{ background: 'var(--bg-surface)' }} />
        </div>
      </section>
    );
  }

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section id="faq" style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-primary)' }}>
      <div className="mx-auto" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
        {/* Section header */}
        <div className="mb-10 text-center">
          <span
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: 'var(--accent-green)' }}
          >
            {t('faq.label')}
          </span>
          <h2
            className="font-display leading-[1.1] mt-3"
            style={{ color: 'var(--text-primary)', fontSize: 'clamp(24px, 3vw, 32px)', letterSpacing: '-0.02em' }}
          >
            {t('faq.heading')}
          </h2>
          <p className="text-sm font-light mt-3 mx-auto max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            {t('faq.subheading')}
          </p>
        </div>

        {/* Accordion */}
        <div className="max-w-3xl mx-auto space-y-3" dir={dir}>
          {faqs.map((faq, index) => {
            const isOpen = openId === faq.id;
            const question = getFaqQuestion(faq, lang);
            const answer = getFaqAnswer(faq, lang);

            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-200 hover:opacity-90"
                  style={{ background: isOpen ? 'rgba(107, 142, 90, 0.08)' : 'transparent' }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(107, 142, 90, 0.15)' }}
                  >
                    <HelpCircle size={16} style={{ color: 'var(--accent-green)' }} />
                  </div>
                  <span
                    className="flex-1 font-medium text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {question}
                  </span>
                  <ChevronDown
                    size={18}
                    style={{
                      color: 'var(--text-tertiary)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 pb-4 pl-[52px]"
                        style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}
                      >
                        {answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
