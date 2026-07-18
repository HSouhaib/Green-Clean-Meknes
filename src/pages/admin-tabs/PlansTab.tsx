import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';
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
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  backlog: 'var(--text-tertiary)',
  planned: 'var(--accent-blue)',
  in_progress: 'var(--accent-amber)',
  completed: 'var(--accent-green)',
  cancelled: 'var(--accent-terracotta)',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'var(--text-tertiary)',
  medium: 'var(--accent-blue)',
  high: 'var(--accent-amber)',
  urgent: 'var(--accent-terracotta)',
};

const COLUMNS = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'planned', label: 'Planned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export function PlansTab() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [filterPriority, setFilterPriority] = useState('');
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
      toast.success('Plan created');
    },
    onError: (err) => showError(err.message),
  });

  const updateMutation = trpc.plan.update.useMutation({
    onSuccess: () => {
      utils.plan.list.invalidate();
      utils.plan.getById.invalidate();
      toast.success('Plan updated');
    },
    onError: (err) => showError(err.message),
  });

  const deleteMutation = trpc.plan.delete.useMutation({
    onSuccess: () => {
      utils.plan.list.invalidate();
      setSelectedPlanId(null);
      toast.success('Plan deleted');
    },
    onError: (err) => showError(err.message),
  });

  const addCommentMutation = trpc.plan.addComment.useMutation({
    onSuccess: () => {
      utils.plan.getById.invalidate();
      setNewComment('');
    },
    onError: () => showError('Failed to add comment'),
  });

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
    items: plans?.filter((p) => p.status === col.key) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
          Planning & Ideas
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--bg-surface-light)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className="px-3 py-2 text-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{
                background: viewMode === 'kanban' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              <LayoutGrid size={16} className="sm:mr-1" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-2 text-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{
                background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              <List size={16} className="sm:mr-1" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="admin-input w-auto min-w-[120px]"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px]"
            style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Plan</span>
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plansByStatus.map((column) => (
            <div key={column.key}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {column.label}
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}
                >
                  {column.items.length}
                </span>
              </div>
              <div className="space-y-3">
                {column.items.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="p-4 rounded-lg cursor-pointer transition-all hover:opacity-90"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background: `${PRIORITY_COLORS[plan.priority]}20`,
                          color: PRIORITY_COLORS[plan.priority],
                        }}
                      >
                        {plan.priority}
                      </span>
                      {plan.category && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-tertiary)' }}>
                          {plan.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      {plan.title}
                    </p>
                    {plan.assignedToName && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <User size={10} />
                        {plan.assignedToName}
                      </div>
                    )}
                    {plan.targetDate && (
                      <div className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        <Calendar size={10} />
                        {new Date(plan.targetDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--bg-surface-light)' }}>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>Title</th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>Priority</th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>Assigned</th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>Target</th>
              </tr>
            </thead>
            <tbody>
              {plans?.map((plan) => (
                <tr
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="cursor-pointer transition-colors hover:bg-[var(--bg-surface-light)]"
                  style={{ borderTop: '1px solid var(--bg-surface-light)' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{plan.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${STATUS_COLORS[plan.status]}20`, color: STATUS_COLORS[plan.status] }}
                    >
                      {plan.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${PRIORITY_COLORS[plan.priority]}20`, color: PRIORITY_COLORS[plan.priority] }}
                    >
                      {plan.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{plan.assignedToName || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>
                    {plan.targetDate ? new Date(plan.targetDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {(!plans || plans.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    No plans yet. Create your first plan!
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
            <div className="flex flex-wrap items-center justify-between gap-2 p-4" style={{ borderBottom: '1px solid var(--bg-surface-light)' }}>
              <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>New Plan</h3>
              <button onClick={() => setIsCreating(false)} style={{ color: 'var(--text-tertiary)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Title *</label>
                <input name="title" required className="admin-input" placeholder="e.g. Add volunteer leaderboard" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Description</label>
                <textarea name="description" rows={3} className="admin-input" placeholder="Describe the plan..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Status</label>
                  <select name="status" className="admin-input">
                    <option value="backlog">Backlog</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Priority</label>
                  <select name="priority" className="admin-input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Category</label>
                  <select name="category" className="admin-input">
                    <option value="">—</option>
                    <option value="feature">Feature</option>
                    <option value="bugfix">Bugfix</option>
                    <option value="improvement">Improvement</option>
                    <option value="design">Design</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Assigned To</label>
                  <select name="assignedTo" className="admin-input">
                    <option value="">Unassigned</option>
                    {allUsers?.users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email || `User #${u.id}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Target Date</label>
                <input name="targetDate" type="date" className="admin-input" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}>
                  {createMutation.isPending ? 'Creating...' : 'Create Plan'}
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
            className="w-full max-w-lg mx-4 rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--bg-surface-light)' }}>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: `${PRIORITY_COLORS[selectedPlan.priority]}20`, color: PRIORITY_COLORS[selectedPlan.priority] }}
                >
                  {selectedPlan.priority}
                </span>
                <span
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: `${STATUS_COLORS[selectedPlan.status]}20`, color: STATUS_COLORS[selectedPlan.status] }}
                >
                  {selectedPlan.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Status change buttons */}
                {selectedPlan.status !== 'completed' && (
                  <button
                    onClick={() => handleMove(selectedPlan.id, 'completed')}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: 'var(--accent-green)', color: 'white' }}
                  >
                    Complete
                  </button>
                )}
                {selectedPlan.status !== 'in_progress' && (
                  <button
                    onClick={() => handleMove(selectedPlan.id, 'in_progress')}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: 'var(--accent-amber)', color: 'var(--bg-primary)' }}
                  >
                    Start
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Delete this plan?')) deleteMutation.mutate({ id: selectedPlan.id });
                  }}
                  className="p-1 rounded hover:bg-[var(--bg-surface-light)]"
                  style={{ color: 'var(--accent-terracotta)' }}
                >
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setSelectedPlanId(null)} style={{ color: 'var(--text-tertiary)' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                  {selectedPlan.title}
                </h3>
                {selectedPlan.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {selectedPlan.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Created by {selectedPlan.createdByName}</span>
                </div>
                {selectedPlan.assignedToName && (
                  <div className="flex items-center gap-2">
                    <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Assigned to {selectedPlan.assignedToName}</span>
                  </div>
                )}
                {selectedPlan.targetDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Target: {new Date(selectedPlan.targetDate).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedPlan.category && (
                  <div className="flex items-center gap-2">
                    <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedPlan.category}</span>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div>
                <h4 className="text-sm font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Comments
                </h4>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {selectedPlan.comments && selectedPlan.comments.length > 0 ? (
                    selectedPlan.comments.map((comment) => (
                      <div key={comment.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {comment.userName}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {comment.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                      No comments yet
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
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
                    className="px-3 py-2 rounded-lg text-sm"
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
