import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { DeleteModal, ImageUpload } from './shared';
import { useErrorModal } from '@/hooks/useErrorModal';

export function NeighborhoodsTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: neighborhoods, isLoading } = trpc.neighborhood.listAll.useQuery();
  const createMutation = trpc.neighborhood.create.useMutation({
    onSuccess: () => {
      utils.neighborhood.listAll.invalidate();
      setShowForm(false);
      resetForm();
      toast.success(t('toast.created'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const updateMutation = trpc.neighborhood.update.useMutation({
    onSuccess: () => {
      utils.neighborhood.listAll.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      toast.success(t('toast.updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const deleteMutation = trpc.neighborhood.delete.useMutation({
    onSuccess: () => {
      utils.neighborhood.listAll.invalidate();
      toast.success(t('toast.deleted'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const toggleMutation = trpc.neighborhood.toggleActive.useMutation({
    onSuccess: () => {
      utils.neighborhood.listAll.invalidate();
      toast.success(t('toast.status_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nameEn: '', nameFr: '', nameAr: '',
    slug: '',
    descriptionEn: '', descriptionFr: '', descriptionAr: '',
    image: '',
    statsWasteKg: '', statsTrees: '', statsVolunteers: '', statsCampaigns: '',
    mapX: '', mapY: '',
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null as number | null, name: '' });

  const resetForm = () => {
    setFormData({
      nameEn: '', nameFr: '', nameAr: '',
      slug: '',
      descriptionEn: '', descriptionFr: '', descriptionAr: '',
      image: '',
      statsWasteKg: '', statsTrees: '', statsVolunteers: '', statsCampaigns: '',
      mapX: '', mapY: '',
    });
  };

  const handleEdit = (n: NonNullable<typeof neighborhoods>[number]) => {
    setEditingId(n.id);
    setFormData({
      nameEn: n.nameEn,
      nameFr: n.nameFr || '',
      nameAr: n.nameAr || '',
      slug: n.slug,
      descriptionEn: n.descriptionEn,
      descriptionFr: n.descriptionFr || '',
      descriptionAr: n.descriptionAr || '',
      image: n.image || '',
      statsWasteKg: n.statsWasteKg?.toString() ?? '',
      statsTrees: n.statsTrees?.toString() ?? '',
      statsVolunteers: n.statsVolunteers?.toString() ?? '',
      statsCampaigns: n.statsCampaigns?.toString() ?? '',
      mapX: n.mapX?.toString() ?? '',
      mapY: n.mapY?.toString() ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stats: Record<string, number> = {};
    if (formData.statsWasteKg) stats.wasteKg = parseInt(formData.statsWasteKg);
    if (formData.statsTrees) stats.trees = parseInt(formData.statsTrees);
    if (formData.statsVolunteers) stats.volunteers = parseInt(formData.statsVolunteers);
    if (formData.statsCampaigns) stats.campaigns = parseInt(formData.statsCampaigns);

    const payload = {
      nameEn: formData.nameEn,
      nameFr: formData.nameFr || undefined,
      nameAr: formData.nameAr || undefined,
      slug: formData.slug,
      descriptionEn: formData.descriptionEn,
      descriptionFr: formData.descriptionFr || undefined,
      descriptionAr: formData.descriptionAr || undefined,
      image: formData.image || undefined,
      statsJson: Object.keys(stats).length > 0 ? JSON.stringify(stats) : undefined,
      mapX: formData.mapX ? parseFloat(formData.mapX) : undefined,
      mapY: formData.mapY ? parseFloat(formData.mapY) : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) return <div className="p-8" style={{ color: 'var(--text-secondary)' }}>Loading neighborhoods...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Neighborhoods</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
        >
          {showForm ? 'Cancel' : 'Add Neighborhood'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-6 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
            {editingId ? 'Edit Neighborhood' : 'New Neighborhood'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Name (EN) *" value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} required className="admin-input" />
            <input placeholder="Name (FR)" value={formData.nameFr} onChange={e => setFormData({ ...formData, nameFr: e.target.value })} className="admin-input" />
            <input placeholder="Name (AR)" value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} className="admin-input" dir="rtl" />
          </div>
          <input placeholder="Slug (e.g., hamria) *" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required className="admin-input" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <textarea placeholder="Description (EN) *" value={formData.descriptionEn} onChange={e => setFormData({ ...formData, descriptionEn: e.target.value })} required rows={3} className="admin-input" />
            <textarea placeholder="Description (FR)" value={formData.descriptionFr} onChange={e => setFormData({ ...formData, descriptionFr: e.target.value })} rows={3} className="admin-input" />
            <textarea placeholder="Description (AR)" value={formData.descriptionAr} onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })} rows={3} className="admin-input" dir="rtl" />
          </div>
          <ImageUpload value={formData.image} onChange={(url) => setFormData({ ...formData, image: url })} label="Neighborhood Image" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input type="number" placeholder="Waste (kg)" value={formData.statsWasteKg} onChange={e => setFormData({ ...formData, statsWasteKg: e.target.value })} className="admin-input" />
            <input type="number" placeholder="Trees" value={formData.statsTrees} onChange={e => setFormData({ ...formData, statsTrees: e.target.value })} className="admin-input" />
            <input type="number" placeholder="Volunteers" value={formData.statsVolunteers} onChange={e => setFormData({ ...formData, statsVolunteers: e.target.value })} className="admin-input" />
            <input type="number" placeholder="Campaigns" value={formData.statsCampaigns} onChange={e => setFormData({ ...formData, statsCampaigns: e.target.value })} className="admin-input" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Map Latitude" value={formData.mapX} onChange={e => setFormData({ ...formData, mapX: e.target.value })} className="admin-input" />
            <input placeholder="Map Longitude" value={formData.mapY} onChange={e => setFormData({ ...formData, mapY: e.target.value })} className="admin-input" />
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
        {neighborhoods?.map((n) => (
          <div
            key={n.id}
            className="flex items-center justify-between p-4 rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {n.image && (
                <img src={n.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" loading="lazy" />
              )}
              <div className="min-w-0">
                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {n.nameEn}
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>{n.slug}</span>
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {n.descriptionEn.substring(0, 60)}...
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={() => toggleMutation.mutate({ id: n.id })}
                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: n.isActive ? 'rgba(58,90,42,0.3)' : 'rgba(85,85,85,0.3)',
                  color: n.isActive ? 'var(--accent-green-light)' : 'var(--text-tertiary)',
                }}
                title="Toggle visibility"
              >
                {n.isActive ? 'Active' : 'Hidden'}
              </button>
              <button onClick={() => handleEdit(n)} className="text-xs transition-colors hover:text-[var(--accent-green-light)]" style={{ color: 'var(--text-tertiary)' }}>Edit</button>
              <button
                onClick={() => setDeleteModal({ open: true, id: n.id, name: n.nameEn })}
                className="text-xs transition-colors hover:text-red-400"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {(!neighborhoods || neighborhoods.length === 0) && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No neighborhoods yet. Click "Add Neighborhood" to create one.
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
        title="Delete Neighborhood"
        description={`Are you sure you want to delete the neighborhood "${deleteModal.name}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
