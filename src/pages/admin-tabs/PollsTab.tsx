import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import { toast } from 'sonner';
import { DeleteModal } from './shared';
import { useErrorModal } from '@/hooks/useErrorModal';

export function PollsTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: polls, isLoading } = trpc.poll.listAll.useQuery();
  const createMutation = trpc.poll.create.useMutation({
    onSuccess: () => {
      utils.poll.listAll.invalidate();
      setShowForm(false);
      resetForm();
      toast.success(t('toast.poll_created'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const updateMutation = trpc.poll.update.useMutation({
    onSuccess: () => {
      utils.poll.listAll.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      toast.success(t('toast.poll_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const deleteMutation = trpc.poll.delete.useMutation({
    onSuccess: () => {
      utils.poll.listAll.invalidate();
      toast.success(t('toast.poll_deleted'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const toggleMutation = trpc.poll.toggleActive.useMutation({
    onSuccess: () => {
      utils.poll.listAll.invalidate();
      toast.success(t('toast.status_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    questionFr: '',
    questionAr: '',
    options: ['', '', '', '', ''],
    optionsFr: ['', '', '', '', ''],
    optionsAr: ['', '', '', '', ''],
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null as number | null, name: '' });

  const resetForm = () => {
    setFormData({
      question: '',
      questionFr: '',
      questionAr: '',
      options: ['', '', '', '', ''],
      optionsFr: ['', '', '', '', ''],
      optionsAr: ['', '', '', '', ''],
    });
  };

  const handleEdit = (poll: any) => {
    setEditingId(poll.id);
    setFormData({
      question: poll.question,
      questionFr: poll.questionFr || '',
      questionAr: poll.questionAr || '',
      options: poll.options.concat(['', '', '', '', '']).slice(0, 5),
      optionsFr: (poll.optionsFr || []).concat(['', '', '', '', '']).slice(0, 5),
      optionsAr: (poll.optionsAr || []).concat(['', '', '', '', '']).slice(0, 5),
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = formData.options.filter((o) => o.trim() !== '');
    const validOptionsFr = formData.optionsFr.filter((_, i) => formData.options[i].trim() !== '');
    const validOptionsAr = formData.optionsAr.filter((_, i) => formData.options[i].trim() !== '');
    if (validOptions.length < 2) return;

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        question: formData.question,
        questionFr: formData.questionFr || undefined,
        questionAr: formData.questionAr || undefined,
        options: validOptions,
        optionsFr: validOptionsFr.length > 0 ? validOptionsFr : undefined,
        optionsAr: validOptionsAr.length > 0 ? validOptionsAr : undefined,
      });
    } else {
      createMutation.mutate({
        question: formData.question,
        questionFr: formData.questionFr || undefined,
        questionAr: formData.questionAr || undefined,
        options: validOptions,
        optionsFr: validOptionsFr.length > 0 ? validOptionsFr : undefined,
        optionsAr: validOptionsAr.length > 0 ? validOptionsAr : undefined,
      });
    }
  };

  if (isLoading) return <div className="p-8" style={{ color: 'var(--text-secondary)' }}>Loading polls...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Polls</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
        >
          {showForm ? 'Cancel' : 'Add Poll'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-6 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Question (EN)</label>
            <input className="admin-input" placeholder="Question (EN) *" value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Question (FR)</label>
              <input className="admin-input" placeholder="Question (FR)" value={formData.questionFr} onChange={e => setFormData({ ...formData, questionFr: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Question (AR)</label>
              <input className="admin-input" placeholder="Question (AR)" value={formData.questionAr} onChange={e => setFormData({ ...formData, questionAr: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Options (EN)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.options.map((opt, i) => (
                <input key={i} className="admin-input" placeholder={`Option ${i + 1}${i < 2 ? ' *' : ''}`} value={opt} onChange={e => {
                  const newOpts = [...formData.options];
                  newOpts[i] = e.target.value;
                  setFormData({ ...formData, options: newOpts });
                }} required={i < 2} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Options (FR)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.optionsFr.map((opt, i) => (
                <input key={i} className="admin-input" placeholder={`Option FR ${i + 1}`} value={opt} onChange={e => {
                  const newOpts = [...formData.optionsFr];
                  newOpts[i] = e.target.value;
                  setFormData({ ...formData, optionsFr: newOpts });
                }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Options (AR)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.optionsAr.map((opt, i) => (
                <input key={i} className="admin-input" placeholder={`Option AR ${i + 1}`} value={opt} onChange={e => {
                  const newOpts = [...formData.optionsAr];
                  newOpts[i] = e.target.value;
                  setFormData({ ...formData, optionsAr: newOpts });
                }} dir="rtl" />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2 rounded-md text-sm font-medium" style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }} className="px-6 py-2 rounded-md text-sm font-medium" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {polls?.map((poll: NonNullable<typeof polls>[number]) => (
          <div
            key={poll.id}
            className="flex items-center justify-between p-4 rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
          >
            <div className="min-w-0">
              <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {poll.question}
                {poll.isActive && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(58,90,42,0.3)', color: 'var(--accent-green-light)' }}>Active</span>
                )}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {poll.options.join(', ')} · {poll.voteCount} votes
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={() => toggleMutation.mutate({ id: poll.id })}
                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: poll.isActive ? 'rgba(58,90,42,0.3)' : 'rgba(85,85,85,0.3)',
                  color: poll.isActive ? 'var(--accent-green-light)' : 'var(--text-tertiary)',
                }}
                title="Toggle active"
              >
                {poll.isActive ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => handleEdit(poll)} className="text-xs transition-colors hover:text-[var(--accent-green-light)]" style={{ color: 'var(--text-tertiary)' }}>Edit</button>
              <button
                onClick={() => setDeleteModal({ open: true, id: poll.id, name: poll.question })}
                className="text-xs transition-colors hover:text-red-400"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {(!polls || polls.length === 0) && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No polls yet. Click "Add Poll" to create one.
          </div>
        )}
      </div>

      <DeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
        onConfirm={() => {
          if (deleteModal.id) deleteMutation.mutate({ id: deleteModal.id });
          setDeleteModal({ open: false, id: null, name: '' });
        }}
        title="Delete Poll"
        description={`Are you sure you want to delete the poll "${deleteModal.name}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
