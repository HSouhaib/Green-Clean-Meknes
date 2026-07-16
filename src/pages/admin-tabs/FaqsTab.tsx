import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import { toast } from 'sonner';
import { DeleteModal } from './shared';
import { useErrorModal } from '@/hooks/useErrorModal';

export function FaqsTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: faqs, isLoading } = trpc.faq.listAll.useQuery();
  const createMutation = trpc.faq.create.useMutation({
    onSuccess: () => {
      utils.faq.listAll.invalidate();
      setShowForm(false);
      resetForm();
      toast.success(t('toast.faq_created'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const updateMutation = trpc.faq.update.useMutation({
    onSuccess: () => {
      utils.faq.listAll.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      toast.success(t('toast.faq_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const deleteMutation = trpc.faq.delete.useMutation({
    onSuccess: () => {
      utils.faq.listAll.invalidate();
      toast.success(t('toast.faq_deleted'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const toggleMutation = trpc.faq.toggleActive.useMutation({
    onSuccess: () => {
      utils.faq.listAll.invalidate();
      toast.success(t('toast.status_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    questionEn: '',
    questionFr: '',
    questionAr: '',
    answerEn: '',
    answerFr: '',
    answerAr: '',
    sortOrder: 0,
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null as number | null, name: '' });

  const resetForm = () => {
    setFormData({
      questionEn: '',
      questionFr: '',
      questionAr: '',
      answerEn: '',
      answerFr: '',
      answerAr: '',
      sortOrder: 0,
    });
  };

  const handleEdit = (faq: any) => {
    setEditingId(faq.id);
    setFormData({
      questionEn: faq.questionEn,
      questionFr: faq.questionFr || '',
      questionAr: faq.questionAr || '',
      answerEn: faq.answerEn,
      answerFr: faq.answerFr || '',
      answerAr: faq.answerAr || '',
      sortOrder: faq.sortOrder,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        questionEn: formData.questionEn,
        questionFr: formData.questionFr || undefined,
        questionAr: formData.questionAr || undefined,
        answerEn: formData.answerEn,
        answerFr: formData.answerFr || undefined,
        answerAr: formData.answerAr || undefined,
        sortOrder: formData.sortOrder,
      });
    } else {
      createMutation.mutate({
        questionEn: formData.questionEn,
        questionFr: formData.questionFr || undefined,
        questionAr: formData.questionAr || undefined,
        answerEn: formData.answerEn,
        answerFr: formData.answerFr || undefined,
        answerAr: formData.answerAr || undefined,
        sortOrder: formData.sortOrder,
      });
    }
  };

  if (isLoading) return <div className="p-8" style={{ color: 'var(--text-secondary)' }}>Loading FAQs...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>FAQs</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
        >
          {showForm ? 'Cancel' : 'Add FAQ'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-6 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
            {editingId ? 'Edit FAQ' : 'New FAQ'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Question (EN) *" value={formData.questionEn} onChange={e => setFormData({ ...formData, questionEn: e.target.value })} required className="admin-input" />
            <input placeholder="Question (FR)" value={formData.questionFr} onChange={e => setFormData({ ...formData, questionFr: e.target.value })} className="admin-input" />
            <input placeholder="Question (AR)" value={formData.questionAr} onChange={e => setFormData({ ...formData, questionAr: e.target.value })} className="admin-input" dir="rtl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <textarea placeholder="Answer (EN) *" value={formData.answerEn} onChange={e => setFormData({ ...formData, answerEn: e.target.value })} required rows={3} className="admin-input" />
            <textarea placeholder="Answer (FR)" value={formData.answerFr} onChange={e => setFormData({ ...formData, answerFr: e.target.value })} rows={3} className="admin-input" />
            <textarea placeholder="Answer (AR)" value={formData.answerAr} onChange={e => setFormData({ ...formData, answerAr: e.target.value })} rows={3} className="admin-input" dir="rtl" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Sort Order</label>
            <input type="number" className="admin-input" placeholder="0" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })} />
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
        {faqs?.map((faq) => (
          <div
            key={faq.id}
            className="flex items-center justify-between p-4 rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
          >
            <div className="min-w-0">
              <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {faq.questionEn}
                <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>#{faq.sortOrder}</span>
              </div>
              <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                {faq.answerEn.substring(0, 80)}...
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={() => toggleMutation.mutate({ id: faq.id })}
                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: faq.isActive ? 'rgba(58,90,42,0.3)' : 'rgba(85,85,85,0.3)',
                  color: faq.isActive ? 'var(--accent-green-light)' : 'var(--text-tertiary)',
                }}
                title="Toggle visibility"
              >
                {faq.isActive ? 'Active' : 'Hidden'}
              </button>
              <button onClick={() => handleEdit(faq)} className="text-xs transition-colors hover:text-[var(--accent-green-light)]" style={{ color: 'var(--text-tertiary)' }}>Edit</button>
              <button
                onClick={() => setDeleteModal({ open: true, id: faq.id, name: faq.questionEn })}
                className="text-xs transition-colors hover:text-red-400"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {(!faqs || faqs.length === 0) && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No FAQs yet. Click "Add FAQ" to create one.
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
        title="Delete FAQ"
        description={`Are you sure you want to delete the FAQ "${deleteModal.name}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
