import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';
import { useLanguage } from '@/hooks/useLanguage';
import type { Plan } from '@db/schema';
import {
  Plus,
  X,
  Calendar,
  User,
  MessageSquare,
  Trash2,
  Filter,
  LayoutGrid,
  List,
  Search,
  Clock,
  CheckCircle2,
  PlayCircle,
  ClipboardList,
  AlertCircle,
  MoreHorizontal,
  ArrowRight,
  Tag,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  backlog: 'var(--text-tertiary)',
  planned: 'var(--accent-blue)',
  in_progress: 'var(--accent-amber)',
  completed: 'var(--accent-green)',
  cancelled: 'var(--accent-terracotta)',
};

const STATUS_BG: Record<string, string> = {
  backlog: 'rgba(255,255,255,0.06)',
  planned: 'rgba(59,130,246,0.12)',
  in_progress: 'rgba(245,158,11,0.12)',
  completed: 'rgba(107,142,90,0.15)',
  cancelled: 'rgba(239,68,68,0.1)',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'var(--text-tertiary)',
  medium: 'var(--accent-blue)',
  high: 'var(--accent-amber)',
  urgent: 'var(--accent-terracotta)',
};

const PRIORITY_BG: Record<string, string> = {
  low: 'rgba(255,255,255,0.06)',
  medium: 'rgba(59,130,246,0.12)',
  high: 'rgba(245,158,11,0.12)',
  urgent: 'rgba(239,68,68,0.12)',
};

const COLUMNS = [
  { key: 'backlog', labelKey: 'planning.backlog', emptyKey: 'planning.no_backlog_plans', icon: ClipboardList },
  { key: 'planned', labelKey: 'planning.planned', emptyKey: 'planning.no_planned_plans', icon: Clock },
  { key: 'in_progress', labelKey: 'planning.in_progress', emptyKey: 'planning.no_in_progress_plans', icon: PlayCircle },
  { key: 'completed', labelKey: 'planning.completed', emptyKey: 'planning.no_completed_plans', icon: CheckCircle2 },
] as const;

const STATUSES = ['backlog', 'planned', 'in_progress', 'completed', 'cancelled'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const CATEGORIES = ['feature', 'bugfix', 'improvement', 'design'] as const;

type PlanSummary = {
  id: number;
  title: string;
  description: string | null;
  status: Plan['status'];
  priority: Plan['priority'];
  category: string | null;
  assignedToName: string | null;
  targetDate: Date | null;
};

function PlanCard({ plan, onSelect }: { plan: PlanSummary; onSelect: (id: number) => void }) {
  const { t } = useLanguage();
  const isOverdue =
    plan.targetDate &&
    new Date(plan.targetDate) < new Date(new Date().setHours(0, 0, 0, 0)) &&
    plan.status !== 'completed' &&
    plan.status !== 'cancelled';

  return (
    <div
      onClick={() => onSelect(plan.id)}
      className="group relative rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-surface-light)',
        borderLeft: `3px solid ${PRIORITY_COLORS[plan.priority]}`,
      }}
    >
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>
            {plan.title}
          </p>
          <MoreHorizontal
            size={14}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>

        {plan.description && (
          <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {plan.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: PRIORITY_BG[plan.priority],
              color: PRIORITY_COLORS[plan.priority],
            }}
          >
            {t(`planning.priority_${plan.priority}` as const)}
          </span>
          {plan.category && (
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1"
              style={{ background: 'var(--bg-surface-light)', color: 'var(--text-tertiary)' }}
            >
              <Tag size={9} />
              {t(`planning.category_${plan.category}` as const)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            {plan.assignedToName ? (
              <div className="flex items-center gap-1 text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium"
                  style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}
                >
                  {plan.assignedToName.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[80px]">{plan.assignedToName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                <User size={10} />
                {t('planning.unassigned')}
              </div>
            )}
          </div>
          {plan.targetDate && (
            <div
              className="flex items-center gap-1 text-[10px] shrink-0"
              style={{ color: isOverdue ? '#ef4444' : 'var(--text-tertiary)' }}
            >
              <Calendar size={10} />
              {new Date(plan.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {isOverdue && <AlertCircle size={10} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlansTab() {
  const { t } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [newComment, setNewComment] = useState('');

  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: plans } = trpc.plan.list.useQuery({
    priority: filterPriority || undefined,
  });
  const { data: selectedPlan } = trpc.plan.getById.useQuery(
    { id: selectedPlanId! },
    { enabled: selectedPlanId !== null }
  );
  const { data: allUsers } = trpc.user.list.useQuery({ page: 1, limit: 100 });

  const createMutation = trpc.plan.create.useMutation({
    onSuccess: () => {
      utils.plan.list.invalidate();
      setIsCreating(false);
      toast.success(t('toast.plan_created'));
    },
    onError: (err) => showError(err.message),
  });

  const updateMutation = trpc.plan.update.useMutation({
    onSuccess: () => {
      utils.plan.list.invalidate();
      utils.plan.getById.invalidate();
      toast.success(t('toast.plan_updated'));
    },
    onError: (err) => showError(err.message),
  });

  const deleteMutation = trpc.plan.delete.useMutation({
    onSuccess: () => {
      utils.plan.list.invalidate();
      setSelectedPlanId(null);
      toast.success(t('toast.plan_deleted'));
    },
    onError: (err) => showError(err.message),
  });

  const addCommentMutation = trpc.plan.addComment.useMutation({
    onSuccess: () => {
      utils.plan.getById.invalidate();
      setNewComment('');
    },
    onError: () => showError(t('toast.comment_failed')),
  });

  const filteredPlans = useMemo(() => {
    if (!plans) return [];
    if (!searchQuery.trim()) return plans;
    const term = searchQuery.toLowerCase();
    return plans.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term) ||
        (p.category ?? '').toLowerCase().includes(term) ||
        (p.assignedToName ?? '').toLowerCase().includes(term)
    );
  }, [plans, searchQuery]);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createMutation.mutate({
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      status: formData.get('status') as Plan['status'],
      priority: formData.get('priority') as Plan['priority'],
      category: (formData.get('category') as string) || undefined,
      assignedTo: formData.get('assignedTo') ? Number(formData.get('assignedTo')) : undefined,
      targetDate: (formData.get('targetDate') as string) || undefined,
    });
  };

  const handleMove = (planId: number, newStatus: string) => {
    updateMutation.mutate({ id: planId, status: newStatus as Plan['status'] });
  };

  const plansByStatus = COLUMNS.map((col) => ({
    ...col,
    items: filteredPlans.filter((p) => p.status === col.key),
  }));

  const totalPlans = filteredPlans.length;
  const inProgressCount = filteredPlans.filter((p) => p.status === 'in_progress').length;
  const completedCount = filteredPlans.filter((p) => p.status === 'completed').length;
  const backlogCount = filteredPlans.filter((p) => p.status === 'backlog').length;

  const summaryItems = [
    { labelKey: 'planning.total', value: totalPlans, color: 'var(--text-primary)' },
    { labelKey: 'planning.backlog', value: backlogCount, color: STATUS_COLORS.backlog },
    { labelKey: 'planning.in_progress', value: inProgressCount, color: STATUS_COLORS.in_progress },
    { labelKey: 'planning.completed', value: completedCount, color: STATUS_COLORS.completed },
  ];

  const hasAnyPlans = filteredPlans.length > 0;

  const statusLabel = (status: (typeof STATUSES)[number]) => t(`planning.status_${status}` as const);
  const priorityLabel = (priority: (typeof PRIORITIES)[number]) => t(`planning.priority_${priority}` as const);
  const categoryLabel = (category: string) => t(`planning.category_${category}` as const);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('planning.title')}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {t('planning.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-h-[40px] transition-opacity hover:opacity-90 shrink-0"
          style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
        >
          <Plus size={16} />
          {t('planning.new_plan')}
        </button>
      </div>

      {/* Toolbar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {summaryItems.map((item) => (
            <div
              key={item.labelKey}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
            >
              <span className="font-medium" style={{ color: item.color }}>
                {item.value}
              </span>
              <span style={{ color: 'var(--text-tertiary)' }}>{t(item.labelKey)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--bg-surface-light)' }}
          >
            <button
              onClick={() => setViewMode('kanban')}
              className="px-3 py-2 text-xs transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center gap-1.5"
              style={{
                background: viewMode === 'kanban' ? 'var(--bg-surface-light)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">{t('planning.board')}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-2 text-xs transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center gap-1.5"
              style={{
                background: viewMode === 'list' ? 'var(--bg-surface-light)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              <List size={14} />
              <span className="hidden sm:inline">{t('planning.list')}</span>
            </button>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('planning.search_placeholder')}
              className="admin-input pl-9 text-xs w-full sm:w-48"
            />
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="admin-input w-auto min-w-[120px] text-xs"
          >
            <option value="">{t('planning.all_priorities')}</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {priorityLabel(p)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <>
          {!hasAnyPlans && (
            <div
              className="flex flex-col items-center justify-center text-center rounded-xl p-8"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: 'rgba(107,142,90,0.12)' }}
              >
                <ClipboardList size={22} style={{ color: 'var(--accent-green)' }} />
              </div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {t('planning.no_plans_title')}
              </h3>
              <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('planning.no_plans_body')}
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
              >
                <Plus size={14} />
                {t('planning.create_plan')}
              </button>
            </div>
          )}

          {hasAnyPlans && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
              {plansByStatus.map((column) => {
                const ColumnIcon = column.icon;
                return (
                  <div
                    key={column.key}
                    className="rounded-xl flex flex-col"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--bg-surface-light)',
                      borderTop: `3px solid ${STATUS_COLORS[column.key]}`,
                    }}
                  >
                    <div
                      className="flex items-center justify-between p-3"
                      style={{ borderBottom: '1px solid var(--bg-surface-light)' }}
                    >
                      <div className="flex items-center gap-2">
                        <ColumnIcon size={14} style={{ color: STATUS_COLORS[column.key] }} />
                        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {t(column.labelKey)}
                        </h3>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: STATUS_BG[column.key], color: STATUS_COLORS[column.key] }}
                      >
                        {column.items.length}
                      </span>
                    </div>
                    <div className="p-2.5 space-y-2.5 min-h-[80px]">
                      {column.items.length === 0 ? (
                        <div className="flex items-center justify-center py-5 text-center">
                          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                            {t(column.emptyKey)}
                          </p>
                        </div>
                      ) : (
                        column.items.map((plan) => (
                          <PlanCard key={plan.id} plan={plan} onSelect={setSelectedPlanId} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
        >
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-surface-light)' }}>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {t('planning.plan')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {t('planning.status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {t('planning.priority')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {t('planning.category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {t('planning.assigned')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {t('planning.target')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => (
                <tr
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="cursor-pointer transition-colors hover:bg-[var(--bg-surface-light)]"
                  style={{ borderBottom: '1px solid var(--bg-surface-light)' }}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {plan.title}
                      </p>
                      {plan.description && (
                        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: STATUS_BG[plan.status], color: STATUS_COLORS[plan.status] }}
                    >
                      {statusLabel(plan.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: PRIORITY_BG[plan.priority], color: PRIORITY_COLORS[plan.priority] }}
                    >
                      {priorityLabel(plan.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {plan.category ? (
                      <span className="flex items-center gap-1">
                        <Tag size={10} />
                        {categoryLabel(plan.category)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {plan.assignedToName || t('planning.unassigned')}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>
                    {plan.targetDate ? new Date(plan.targetDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {filteredPlans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={28} style={{ color: 'var(--text-tertiary)' }} className="mb-2 opacity-50" />
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {t('planning.no_match')}
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterPriority('');
                        }}
                        className="text-xs mt-2 underline"
                        style={{ color: 'var(--accent-green)' }}
                      >
                        {t('planning.clear_filters')}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Plan Modal */}
      {isCreating && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsCreating(false)}
        >
          <div
            className="w-full max-w-lg mx-4 rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-2 p-4"
              style={{ borderBottom: '1px solid var(--bg-surface-light)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(107,142,90,0.15)' }}
                >
                  <Plus size={16} style={{ color: 'var(--accent-green)' }} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {t('planning.new_plan')}
                </h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-surface-light)]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label
                  className="text-xs font-mono uppercase tracking-wider block mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('planning.title_label')}
                </label>
                <input
                  name="title"
                  required
                  className="admin-input"
                  placeholder={t('planning.title_placeholder')}
                />
              </div>
              <div>
                <label
                  className="text-xs font-mono uppercase tracking-wider block mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('planning.description')}
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="admin-input"
                  placeholder={t('planning.description_placeholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="text-xs font-mono uppercase tracking-wider block mb-2"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('planning.status_label')}
                  </label>
                  <select name="status" className="admin-input">
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="text-xs font-mono uppercase tracking-wider block mb-2"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('planning.priority_label')}
                  </label>
                  <select name="priority" className="admin-input">
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {priorityLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="text-xs font-mono uppercase tracking-wider block mb-2"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('planning.category_label')}
                  </label>
                  <select name="category" className="admin-input">
                    <option value="">—</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {categoryLabel(c)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="text-xs font-mono uppercase tracking-wider block mb-2"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('planning.assigned_to')}
                  </label>
                  <select name="assignedTo" className="admin-input">
                    <option value="">{t('planning.unassigned')}</option>
                    {allUsers?.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email || `User #${u.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  className="text-xs font-mono uppercase tracking-wider block mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('planning.target_date')}
                </label>
                <input name="targetDate" type="date" className="admin-input" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-surface-light)]"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                >
                  {t('planning.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
                >
                  {createMutation.isPending ? t('planning.creating') : t('planning.create_plan_button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedPlanId(null)}
        >
          <div
            className="w-full max-w-2xl mx-4 rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: '1px solid var(--bg-surface-light)' }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: PRIORITY_BG[selectedPlan.priority],
                    color: PRIORITY_COLORS[selectedPlan.priority],
                  }}
                >
                  {priorityLabel(selectedPlan.priority)}
                </span>
                <span
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: STATUS_BG[selectedPlan.status],
                    color: STATUS_COLORS[selectedPlan.status],
                  }}
                >
                  {statusLabel(selectedPlan.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedPlan.status !== 'completed' && (
                  <button
                    onClick={() => handleMove(selectedPlan.id, 'completed')}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-90"
                    style={{ background: 'var(--accent-green)', color: 'white' }}
                  >
                    {t('planning.complete')}
                  </button>
                )}
                {selectedPlan.status !== 'in_progress' && (
                  <button
                    onClick={() => handleMove(selectedPlan.id, 'in_progress')}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-90"
                    style={{ background: 'var(--accent-amber)', color: 'var(--bg-primary)' }}
                  >
                    {t('planning.start')}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(t('planning.delete_confirm'))) deleteMutation.mutate({ id: selectedPlan.id });
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface-light)]"
                  style={{ color: 'var(--accent-terracotta)' }}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedPlanId(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-surface-light)]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selectedPlan.title}
                </h3>
                {selectedPlan.description && (
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {selectedPlan.description}
                  </p>
                )}
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl text-sm"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="flex items-center gap-2">
                  <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {t('planning.created_by')}{' '}
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedPlan.createdByName}
                    </span>
                  </span>
                </div>
                {selectedPlan.assignedToName && (
                  <div className="flex items-center gap-2">
                    <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {t('planning.assigned_to_label')}{' '}
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {selectedPlan.assignedToName}
                      </span>
                    </span>
                  </div>
                )}
                {selectedPlan.targetDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {t('planning.target_label')}{' '}
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {new Date(selectedPlan.targetDate).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                )}
                {selectedPlan.category && (
                  <div className="flex items-center gap-2">
                    <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {t('planning.category_label_colon')}{' '}
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {categoryLabel(selectedPlan.category)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Status flow */}
              <div>
                <h4
                  className="text-xs font-mono uppercase tracking-wider mb-3"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('planning.status')}
                </h4>
                <div className="flex items-center gap-1 flex-wrap">
                  {STATUSES.map((status, idx) => {
                    const isActive = selectedPlan.status === status;
                    const isPast = STATUSES.indexOf(selectedPlan.status) > idx;
                    return (
                      <div key={status} className="flex items-center">
                        <button
                          onClick={() => handleMove(selectedPlan.id, status)}
                          className="text-[10px] px-2.5 py-1 rounded-full font-medium transition-all border"
                          style={{
                            background: isActive
                              ? STATUS_BG[status]
                              : isPast
                                ? 'rgba(107,142,90,0.1)'
                                : 'var(--bg-surface)',
                            color: isActive
                              ? STATUS_COLORS[status]
                              : isPast
                                ? 'var(--accent-green)'
                                : 'var(--text-tertiary)',
                            borderColor: isActive ? STATUS_COLORS[status] : 'var(--bg-surface-light)',
                          }}
                        >
                          {statusLabel(status)}
                        </button>
                        {idx < STATUSES.length - 1 && (
                          <ArrowRight size={12} className="mx-1" style={{ color: 'var(--text-tertiary)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comments */}
              <div>
                <h4
                  className="text-xs font-mono uppercase tracking-wider mb-3"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('planning.comments')}
                </h4>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {selectedPlan.comments && selectedPlan.comments.length > 0 ? (
                    selectedPlan.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-xl"
                        style={{ background: 'var(--bg-surface)' }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium"
                              style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}
                            >
                              {(comment.userName ?? 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                              {comment.userName}
                            </span>
                          </div>
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-sm pl-7" style={{ color: 'var(--text-secondary)' }}>
                          {comment.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                      {t('planning.no_comments')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('planning.comment_placeholder')}
                    className="admin-input flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newComment.trim()) {
                        addCommentMutation.mutate({ planId: selectedPlan.id, content: newComment.trim() });
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newComment.trim()) {
                        addCommentMutation.mutate({ planId: selectedPlan.id, content: newComment.trim() });
                      }
                    }}
                    disabled={addCommentMutation.isPending || !newComment.trim()}
                    className="px-3 py-2 rounded-lg text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
