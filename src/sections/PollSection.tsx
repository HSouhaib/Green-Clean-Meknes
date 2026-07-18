import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';
import { BarChart3, CheckCircle2, Vote } from 'lucide-react';

const POLL_VOTE_KEY = 'meknes_poll_voted';

interface PollOption {
  text: string;
  textAr: string;
  textFr: string;
}

function getPollOptions(t: (key: string) => string): PollOption[] {
  return [
    { text: t('poll.option_1'), textAr: 'المدينة القديمة', textFr: 'La Médina' },
    { text: t('poll.option_2'), textAr: 'ساحة الحديم', textFr: 'Place el-Hedim' },
    { text: t('poll.option_3'), textAr: 'ضفاف نهر فرت', textFr: 'Bords de la rivière Fert' },
    { text: t('poll.option_4'), textAr: 'الأحياء السكنية', textFr: 'Quartiers résidentiels' },
    { text: t('poll.option_5'), textAr: 'الحدائق العامة', textFr: 'Parcs publics' },
  ];
}

export default function PollSection() {
  const { t, lang } = useLanguage();
  const { showError } = useErrorModal();
  const [hasVoted, setHasVoted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(POLL_VOTE_KEY) !== null;
  });
  const [votedOption, setVotedOption] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(POLL_VOTE_KEY);
    return saved !== null ? parseInt(saved, 10) : null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: poll } = trpc.poll.getActive.useQuery();
  const { data: results, refetch: refetchResults } = trpc.poll.getResults.useQuery(
    { pollId: poll?.id ?? 0 },
    { enabled: hasVoted && !!poll?.id }
  );
  const voteMutation = trpc.poll.vote.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setHasVoted(true);
        if (votedOption !== null) {
          localStorage.setItem(POLL_VOTE_KEY, String(votedOption));
        }
        toast.success(t('toast.vote_cast'));
      } else if (data.message === 'Already voted') {
        toast.info(t('toast.vote_already'));
      } else {
        showError(data.message || t('toast.error_generic'));
      }
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const handleVote = (optionIndex: number) => {
    if (!poll || hasVoted || isSubmitting) return;
    setVotedOption(optionIndex);
    setIsSubmitting(true);
    voteMutation.mutate(
      { pollId: poll.id, optionIndex },
      {
        onSettled: () => {
          setIsSubmitting(false);
          refetchResults();
        },
      }
    );
  };

  const options = getPollOptions(t);
  const totalVotes = results?.totalVotes ?? 0;

  const getOptionText = (opt: PollOption) => {
    if (lang === 'ar') return opt.textAr;
    if (lang === 'fr') return opt.textFr;
    return opt.text;
  };

  return (
    <section
      id="poll"
      ref={ref}
      style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-surface)' }}
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
            {t('poll.heading')}
          </h2>
          <p
            className="text-sm font-light mt-2 mx-auto max-w-md"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('poll.subheading')}
          </p>
        </div>

        <div
          className="max-w-2xl mx-auto p-6 rounded-2xl"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
        >
          {!poll ? (
            <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              {t('poll.no_active')}
            </div>
          ) : !hasVoted ? (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Vote size={20} style={{ color: 'var(--accent-green)' }} />
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('poll.question')}
                </span>
              </div>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleVote(i)}
                    disabled={isSubmitting}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--bg-surface-light)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: 'var(--accent-green)' }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: 'var(--accent-green)', opacity: 0 }}
                        />
                      </div>
                      <span className="text-sm">{getOptionText(opt)}</span>
                    </div>
                  </button>
                ))}
              </div>
              {isSubmitting && (
                <div className="flex items-center justify-center mt-4">
                  <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-green)', borderTopColor: 'transparent' }} />
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={20} style={{ color: 'var(--accent-green)' }} />
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('poll.results')}
                </span>
                <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                  {totalVotes} {t('poll.votes')}
                </span>
              </div>

              <div className="space-y-4">
                {options.map((opt, i) => {
                  const count = results?.counts?.[i] ?? 0;
                  const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  const isSelected = votedOption === i;

                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                          {isSelected && <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />}
                          {getOptionText(opt)}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {percentage}% ({count})
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: 'var(--bg-surface-light)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${percentage}%`,
                            background: isSelected ? 'var(--accent-green)' : 'var(--accent-terracotta)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('poll.thanks')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
