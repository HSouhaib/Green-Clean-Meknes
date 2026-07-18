import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { DeleteModal, ImageUpload } from './shared';
import { Camera, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useErrorModal } from '@/hooks/useErrorModal';

export function CampaignPhotosTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();

  const { showError } = useErrorModal();
  const { data: campaigns } = trpc.campaign.listAll.useQuery();
  const { data: photos, isLoading } = trpc.campaignPhoto.listAll.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    campaignId: '',
    imageUrl: '',
    photoType: 'before' as 'before' | 'after',
    captionEn: '',
    captionFr: '',
    captionAr: '',
    sortOrder: '0',
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  const createMutation = trpc.campaignPhoto.create.useMutation({
    onSuccess: () => {
      utils.campaignPhoto.listAll.invalidate();
      utils.campaignPhoto.list.invalidate();
      utils.campaignPhoto.listByCampaign.invalidate();
      setShowForm(false);
      resetForm();
      toast.success(t('toast.photo_created'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const updateMutation = trpc.campaignPhoto.update.useMutation({
    onSuccess: () => {
      utils.campaignPhoto.listAll.invalidate();
      utils.campaignPhoto.list.invalidate();
      utils.campaignPhoto.listByCampaign.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      toast.success(t('toast.photo_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const deleteMutation = trpc.campaignPhoto.delete.useMutation({
    onSuccess: () => {
      utils.campaignPhoto.listAll.invalidate();
      utils.campaignPhoto.list.invalidate();
      utils.campaignPhoto.listByCampaign.invalidate();
      toast.success(t('toast.photo_deleted'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const toggleMutation = trpc.campaignPhoto.toggleActive.useMutation({
    onSuccess: () => {
      utils.campaignPhoto.listAll.invalidate();
      utils.campaignPhoto.list.invalidate();
      toast.success(t('toast.status_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  function resetForm() {
    setFormData({
      campaignId: '', imageUrl: '', photoType: 'before',
      captionEn: '', captionFr: '', captionAr: '', sortOrder: '0',
    });
  }

  function handleEdit(photo: NonNullable<typeof photos>[number]) {
    setEditingId(photo.id);
    setFormData({
      campaignId: photo.campaignId.toString(),
      imageUrl: photo.imageUrl,
      photoType: photo.photoType,
      captionEn: photo.captionEn ?? '',
      captionFr: photo.captionFr ?? '',
      captionAr: photo.captionAr ?? '',
      sortOrder: photo.sortOrder.toString(),
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      campaignId: parseInt(formData.campaignId),
      imageUrl: formData.imageUrl,
      photoType: formData.photoType,
      captionEn: formData.captionEn || undefined,
      captionFr: formData.captionFr || undefined,
      captionAr: formData.captionAr || undefined,
      sortOrder: parseInt(formData.sortOrder) || 0,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  // Group photos by campaign
  const groupedPhotos = new Map<number, { campaignTitle: string; photos: typeof photos }>();
  photos?.forEach((photo) => {
    const existing = groupedPhotos.get(photo.campaignId);
    if (existing) {
      existing.photos?.push(photo);
    } else {
      groupedPhotos.set(photo.campaignId, { campaignTitle: photo.campaignTitle || 'Unknown Campaign', photos: [photo] });
    }
  });

  if (isLoading) return <div className="p-8 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading photos...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>Campaign Photos</h2>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors"
          style={{ background: 'var(--accent-green)', color: '#fff' }}
        >
          + Add Photo
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 rounded-xl space-y-4" style={{ background: 'var(--bg-surface)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editingId ? 'Edit Photo' : 'New Photo'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Campaign *</label>
              <select className="admin-input" value={formData.campaignId} onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })} required>
                <option value="">Select campaign</option>
                {campaigns?.map((c) => <option key={c.id} value={c.id}>{c.titleEn}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Photo Type *</label>
              <select className="admin-input" value={formData.photoType} onChange={(e) => setFormData({ ...formData, photoType: e.target.value as 'before' | 'after' })} required>
                <option value="before">Before</option>
                <option value="after">After</option>
              </select>
            </div>
          </div>
          <ImageUpload value={formData.imageUrl} onChange={(url) => setFormData({ ...formData, imageUrl: url })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input className="admin-input" placeholder="Caption (EN)" value={formData.captionEn} onChange={(e) => setFormData({ ...formData, captionEn: e.target.value })} />
            <input className="admin-input" placeholder="Caption (FR)" value={formData.captionFr} onChange={(e) => setFormData({ ...formData, captionFr: e.target.value })} />
            <input className="admin-input" placeholder="Caption (AR)" value={formData.captionAr} onChange={(e) => setFormData({ ...formData, captionAr: e.target.value })} dir="rtl" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer" style={{ background: 'var(--accent-green)', color: '#fff' }}>
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border-none cursor-pointer" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Grouped by Campaign - Compact List */}
      <div className="space-y-3">
        {Array.from(groupedPhotos.entries()).map(([campaignId, group]) => {
          const isExpanded = expandedCampaign === campaignId;
          const beforeCount = group.photos?.filter(p => p.photoType === 'before').length || 0;
          const afterCount = group.photos?.filter(p => p.photoType === 'after').length || 0;
          return (
            <div key={campaignId} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
              {/* Campaign Header */}
              <button
                onClick={() => setExpandedCampaign(isExpanded ? null : campaignId)}
                className="w-full flex items-center justify-between p-4 text-left border-none cursor-pointer"
                style={{ background: 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{group.campaignTitle}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
                    {group.photos?.length || 0} photos
                  </span>
                  {beforeCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-tertiary)' }}>
                      {beforeCount} before
                    </span>
                  )}
                  {afterCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
                      {afterCount} after
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />}
              </button>

              {/* Expanded Photo Thumbnails */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {group.photos?.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                        style={{ opacity: photo.isActive ? 1 : 0.4 }}
                        onClick={() => handleEdit(photo)}
                      >
                        <img src={photo.imageUrl} alt={photo.captionEn || ''} className="w-full h-full object-cover" loading="lazy" />
                        <div
                          className="absolute top-0.5 left-0.5 px-1 py-0.5 rounded text-[9px] font-mono uppercase"
                          style={{
                            background: photo.photoType === 'before' ? 'rgba(0,0,0,0.7)' : 'var(--accent-green)',
                            color: 'white',
                          }}
                        >
                          {photo.photoType}
                        </div>
                        {/* Hover Actions */}
                        <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.6)' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleMutation.mutate({ id: photo.id }); }}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs border-none cursor-pointer"
                            style={{ background: photo.isActive ? 'rgba(58,90,42,0.8)' : 'rgba(85,85,85,0.8)', color: '#fff' }}
                            title={photo.isActive ? 'Hide' : 'Show'}
                          >
                            {photo.isActive ? '✓' : '○'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, id: photo.id }); }}
                            className="w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer"
                            style={{ background: 'rgba(239,68,68,0.8)', color: '#fff' }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {groupedPhotos.size === 0 && (
          <div className="text-center py-12">
            <Camera size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No photos yet. Add your first before/after photo!</p>
          </div>
        )}
      </div>

      <DeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => {
          if (deleteModal.id) {
            deleteMutation.mutate({ id: deleteModal.id });
            setDeleteModal({ open: false, id: null });
          }
        }}
        title="Delete Photo"
        description="Are you sure you want to delete this photo? This action cannot be undone."
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
