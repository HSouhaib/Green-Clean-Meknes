import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import { toast } from 'sonner';
import { DeleteModal, ImageUpload } from './shared';
import { Handshake, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useErrorModal } from '@/hooks/useErrorModal';

const SPONSOR_TYPES = ['municipality', 'ngo', 'business', 'media', 'other'] as const;

export function SponsorsTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();

  const { data: sponsors, isLoading } = trpc.sponsor.listAll.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    nameFr: '',
    nameAr: '',
    logoUrl: '',
    websiteUrl: '',
    sponsorType: 'business' as typeof SPONSOR_TYPES[number],
    descriptionEn: '',
    descriptionFr: '',
    descriptionAr: '',
    sortOrder: '0',
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  const createMutation = trpc.sponsor.create.useMutation({
    onSuccess: () => {
      utils.sponsor.listAll.invalidate();
      utils.sponsor.list.invalidate();
      setShowForm(false);
      resetForm();
      toast.success(t('toast.sponsor_created'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const updateMutation = trpc.sponsor.update.useMutation({
    onSuccess: () => {
      utils.sponsor.listAll.invalidate();
      utils.sponsor.list.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      toast.success(t('toast.sponsor_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const deleteMutation = trpc.sponsor.delete.useMutation({
    onSuccess: () => {
      utils.sponsor.listAll.invalidate();
      utils.sponsor.list.invalidate();
      setDeleteModal({ open: false, id: null });
      toast.success(t('toast.sponsor_deleted'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const toggleMutation = trpc.sponsor.toggleActive.useMutation({
    onSuccess: () => {
      utils.sponsor.listAll.invalidate();
      utils.sponsor.list.invalidate();
      toast.success(t('toast.status_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const resetForm = () => {
    setFormData({
      name: '', nameEn: '', nameFr: '', nameAr: '',
      logoUrl: '', websiteUrl: '', sponsorType: 'business',
      descriptionEn: '', descriptionFr: '', descriptionAr: '',
      sortOrder: '0',
    });
    setEditingId(null);
  };

  const handleEdit = (sponsor: NonNullable<typeof sponsors>[0]) => {
    setFormData({
      name: sponsor.name,
      nameEn: sponsor.nameEn || '',
      nameFr: sponsor.nameFr || '',
      nameAr: sponsor.nameAr || '',
      logoUrl: sponsor.logoUrl,
      websiteUrl: sponsor.websiteUrl || '',
      sponsorType: sponsor.sponsorType as typeof SPONSOR_TYPES[number],
      descriptionEn: sponsor.descriptionEn || '',
      descriptionFr: sponsor.descriptionFr || '',
      descriptionAr: sponsor.descriptionAr || '',
      sortOrder: String(sponsor.sortOrder),
    });
    setEditingId(sponsor.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.logoUrl.trim()) return;
    const payload = {
      ...formData,
      sortOrder: Number(formData.sortOrder) || 0,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, logoUrl: imageUrl }));
  };

  if (isLoading) {
    return <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading sponsors...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>Sponsors & Partners</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors"
          style={{ background: 'var(--accent-green)', color: '#fff' }}
        >
          {showForm ? 'Cancel' : 'Add Sponsor'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 rounded-xl space-y-4" style={{ background: 'var(--bg-surface)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name (default) *</label>
              <input className="admin-input" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <select className="admin-input" value={formData.sponsorType} onChange={e => setFormData(p => ({ ...p, sponsorType: e.target.value as typeof SPONSOR_TYPES[number] }))}>
                {SPONSOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name (English)</label>
              <input className="admin-input" value={formData.nameEn} onChange={e => setFormData(p => ({ ...p, nameEn: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name (Français)</label>
              <input className="admin-input" value={formData.nameFr} onChange={e => setFormData(p => ({ ...p, nameFr: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name (العربية)</label>
              <input className="admin-input" dir="rtl" value={formData.nameAr} onChange={e => setFormData(p => ({ ...p, nameAr: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Website URL</label>
              <input className="admin-input" type="url" value={formData.websiteUrl} onChange={e => setFormData(p => ({ ...p, websiteUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sort Order</label>
              <input className="admin-input" type="number" value={formData.sortOrder} onChange={e => setFormData(p => ({ ...p, sortOrder: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Logo *</label>
            <ImageUpload
              value={formData.logoUrl}
              onChange={handleImageUpload}
              label="Logo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description (EN)</label>
              <textarea className="admin-input" rows={2} value={formData.descriptionEn} onChange={e => setFormData(p => ({ ...p, descriptionEn: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description (FR)</label>
              <textarea className="admin-input" rows={2} value={formData.descriptionFr} onChange={e => setFormData(p => ({ ...p, descriptionFr: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description (AR)</label>
              <textarea className="admin-input" rows={2} dir="rtl" value={formData.descriptionAr} onChange={e => setFormData(p => ({ ...p, descriptionAr: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer" style={{ background: 'var(--accent-green)', color: '#fff' }}>
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 rounded-lg text-sm border-none cursor-pointer" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sponsors?.map((sponsor) => (
          <div key={sponsor.id} className="p-4 rounded-xl flex flex-col gap-3" style={{ background: 'var(--bg-surface)', opacity: sponsor.isActive ? 1 : 0.5 }}>
            <div className="flex items-start gap-3">
              <div className="w-16 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                {sponsor.logoUrl ? (
                  <img src={sponsor.logoUrl} alt={sponsor.name} className="w-full h-full object-contain p-1" loading="lazy" />
                ) : (
                  <Handshake size={20} style={{ color: 'var(--text-tertiary)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{sponsor.name}</h3>
                  {sponsor.websiteUrl && (
                    <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <ExternalLink size={12} style={{ color: 'var(--accent-green)' }} />
                    </a>
                  )}
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded-full inline-block mt-1" style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
                  {sponsor.sponsorType}
                </span>
                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-tertiary)' }}>
                  Order: {sponsor.sortOrder} {sponsor.descriptionEn && `· ${sponsor.descriptionEn}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--bg-surface-light)' }}>
              <button onClick={() => handleEdit(sponsor)} className="px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-colors" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}>
                Edit
              </button>
              <button onClick={() => setDeleteModal({ open: true, id: sponsor.id })} className="px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-colors" style={{ background: 'var(--bg-surface-light)', color: '#ef4444' }}>
                Delete
              </button>
              <button onClick={() => toggleMutation.mutate({ id: sponsor.id })} className="px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-colors flex items-center gap-1 ml-auto" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}>
                {sponsor.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                {sponsor.isActive ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {sponsors?.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No sponsors yet. Add your first sponsor above.
        </div>
      )}

      <DeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => deleteModal.id && deleteMutation.mutate({ id: deleteModal.id })}
        title="Delete Sponsor"
        description="Are you sure you want to delete this sponsor? This action cannot be undone."
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
