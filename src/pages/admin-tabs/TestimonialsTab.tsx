import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import { toast } from 'sonner';
import { DeleteModal, ImageUpload } from './shared';
import { useErrorModal } from '@/hooks/useErrorModal';

export function TestimonialsTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: testimonials, isLoading } = trpc.testimonial.listAll.useQuery();
  const deleteMutation = trpc.testimonial.delete.useMutation({
    onSuccess: () => {
      utils.testimonial.listAll.invalidate();
      toast.success(t('toast.testimonial_deleted'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const toggleMutation = trpc.testimonial.toggleActive.useMutation({
    onSuccess: () => {
      utils.testimonial.listAll.invalidate();
      toast.success(t('toast.status_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameFr: '',
    nameAr: '',
    role: '',
    roleFr: '',
    roleAr: '',
    quoteEn: '',
    quoteFr: '',
    quoteAr: '',
    avatar: '',
    sortOrder: 0,
    isActive: true,
  });

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null; name: string }>({
    open: false,
    id: null,
    name: '',
  });

  const createMutation = trpc.testimonial.create.useMutation({
    onSuccess: () => {
      utils.testimonial.listAll.invalidate();
      setShowForm(false);
      resetForm();
      toast.success(t('toast.testimonial_created'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const updateMutation = trpc.testimonial.update.useMutation({
    onSuccess: () => {
      utils.testimonial.listAll.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      toast.success(t('toast.testimonial_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  function resetForm() {
    setFormData({
      name: '', nameFr: '', nameAr: '',
      role: '', roleFr: '', roleAr: '',
      quoteEn: '', quoteFr: '', quoteAr: '',
      avatar: '', sortOrder: 0, isActive: true,
    });
  }

  function handleEdit(tItem: any) {
    setEditingId(tItem.id);
    setFormData({
      name: tItem.name,
      nameFr: tItem.nameFr ?? '',
      nameAr: tItem.nameAr ?? '',
      role: tItem.role,
      roleFr: tItem.roleFr ?? '',
      roleAr: tItem.roleAr ?? '',
      quoteEn: tItem.quoteEn,
      quoteFr: tItem.quoteFr ?? '',
      quoteAr: tItem.quoteAr ?? '',
      avatar: tItem.avatar ?? '',
      sortOrder: tItem.sortOrder ?? 0,
      isActive: tItem.isActive,
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  if (isLoading) return <div className="p-8" style={{ color: 'var(--text-secondary)' }}>Loading testimonials...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
          Testimonials ({testimonials?.length ?? 0})
        </h2>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
        >
          + Add Testimonial
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
            {editingId ? 'Edit Testimonial' : 'New Testimonial'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Name (EN)</label>
              <input className="admin-input" placeholder="Name (EN) *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Name (FR)</label>
              <input className="admin-input" placeholder="Name (FR)" value={formData.nameFr} onChange={e => setFormData({ ...formData, nameFr: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Name (AR)</label>
              <input className="admin-input" placeholder="Name (AR)" value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Role (EN)</label>
              <input className="admin-input" placeholder="Role (EN) *" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Role (FR)</label>
              <input className="admin-input" placeholder="Role (FR)" value={formData.roleFr} onChange={e => setFormData({ ...formData, roleFr: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Role (AR)</label>
              <input className="admin-input" placeholder="Role (AR)" value={formData.roleAr} onChange={e => setFormData({ ...formData, roleAr: e.target.value })} dir="rtl" />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Quote (EN)</label>
            <textarea className="admin-input" placeholder="Quote (EN) *" rows={3} value={formData.quoteEn} onChange={e => setFormData({ ...formData, quoteEn: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Quote (FR)</label>
            <textarea className="admin-input" placeholder="Quote (FR)" rows={3} value={formData.quoteFr} onChange={e => setFormData({ ...formData, quoteFr: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Quote (AR)</label>
            <textarea className="admin-input" placeholder="Quote (AR)" rows={3} value={formData.quoteAr} onChange={e => setFormData({ ...formData, quoteAr: e.target.value })} dir="rtl" />
          </div>
          <ImageUpload value={formData.avatar} onChange={(url) => setFormData({ ...formData, avatar: url })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>Sort Order</label>
              <input type="number" className="admin-input" placeholder="0" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="t-active"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="cursor-pointer"
              />
              <label htmlFor="t-active" className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Active</label>
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
        {testimonials?.map((tItem) => (
          <div
            key={tItem.id}
            className="flex items-center justify-between p-4 rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {tItem.avatar && (
                <img src={tItem.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" loading="lazy" />
              )}
              <div className="min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {tItem.name}
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>{tItem.role}</span>
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {tItem.quoteEn.substring(0, 60)}...
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={() => toggleMutation.mutate({ id: tItem.id })}
                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: tItem.isActive ? 'rgba(58,90,42,0.3)' : 'rgba(85,85,85,0.3)',
                  color: tItem.isActive ? 'var(--accent-green-light)' : 'var(--text-tertiary)',
                }}
                title="Toggle visibility"
              >
                {tItem.isActive ? 'Active' : 'Hidden'}
              </button>
              <button onClick={() => handleEdit(tItem)} className="text-xs transition-colors hover:text-[var(--accent-green-light)]" style={{ color: 'var(--text-tertiary)' }}>Edit</button>
              <button
                onClick={() => setDeleteModal({ open: true, id: tItem.id, name: tItem.name })}
                className="text-xs transition-colors hover:text-red-400"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {(!testimonials || testimonials.length === 0) && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No testimonials yet. Click "Add Testimonial" to create one.
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
        title="Delete Testimonial"
        description={`Are you sure you want to delete the testimonial from "${deleteModal.name}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
