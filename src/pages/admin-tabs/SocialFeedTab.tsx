import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { DeleteModal, ImageUpload } from './shared';
import { Rss, Eye, EyeOff } from 'lucide-react';
import { useErrorModal } from '@/hooks/useErrorModal';

const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'twitter'] as const;

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>,
  tiktok: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>,
  facebook: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  twitter: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
};

export function SocialFeedTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();

  const { data: posts, isLoading } = trpc.socialFeed.listAll.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    platform: 'instagram' as typeof PLATFORMS[number],
    postUrl: '',
    embedCode: '',
    imageUrl: '',
    captionEn: '',
    captionFr: '',
    captionAr: '',
    authorName: '',
    sortOrder: '0',
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  const createMutation = trpc.socialFeed.create.useMutation({
    onSuccess: () => {
      utils.socialFeed.listAll.invalidate();
      utils.socialFeed.list.invalidate();
      setShowForm(false);
      resetForm();
      toast.success(t('toast.socialFeed_created'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const updateMutation = trpc.socialFeed.update.useMutation({
    onSuccess: () => {
      utils.socialFeed.listAll.invalidate();
      utils.socialFeed.list.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      toast.success(t('toast.socialFeed_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const deleteMutation = trpc.socialFeed.delete.useMutation({
    onSuccess: () => {
      utils.socialFeed.listAll.invalidate();
      utils.socialFeed.list.invalidate();
      setDeleteModal({ open: false, id: null });
      toast.success(t('toast.socialFeed_deleted'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const toggleMutation = trpc.socialFeed.toggleActive.useMutation({
    onSuccess: () => {
      utils.socialFeed.listAll.invalidate();
      utils.socialFeed.list.invalidate();
      toast.success(t('toast.status_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const resetForm = () => {
    setFormData({
      platform: 'instagram', postUrl: '', embedCode: '', imageUrl: '',
      captionEn: '', captionFr: '', captionAr: '', authorName: '', sortOrder: '0',
    });
    setEditingId(null);
  };

  const handleEdit = (post: NonNullable<typeof posts>[0]) => {
    setFormData({
      platform: post.platform as typeof PLATFORMS[number],
      postUrl: post.postUrl,
      embedCode: post.embedCode || '',
      imageUrl: post.imageUrl || '',
      captionEn: post.captionEn || '',
      captionFr: post.captionFr || '',
      captionAr: post.captionAr || '',
      authorName: post.authorName || '',
      sortOrder: String(post.sortOrder),
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.postUrl.trim()) return;
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

  if (isLoading) {
    return <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading social feed...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>Social Media Feed</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors"
          style={{ background: 'var(--accent-green)', color: '#fff' }}
        >
          {showForm ? 'Cancel' : 'Add Post'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 rounded-xl space-y-4" style={{ background: 'var(--bg-surface)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Platform *</label>
              <select className="admin-input" value={formData.platform} onChange={e => setFormData(p => ({ ...p, platform: e.target.value as typeof PLATFORMS[number] }))}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Post URL *</label>
              <input className="admin-input" type="url" value={formData.postUrl} onChange={e => setFormData(p => ({ ...p, postUrl: e.target.value }))} placeholder="https://instagram.com/p/..." required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Author Name</label>
              <input className="admin-input" value={formData.authorName} onChange={e => setFormData(p => ({ ...p, authorName: e.target.value }))} placeholder="@greenmeknes" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sort Order</label>
              <input className="admin-input" type="number" value={formData.sortOrder} onChange={e => setFormData(p => ({ ...p, sortOrder: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Thumbnail Image</label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url: string) => setFormData(p => ({ ...p, imageUrl: url }))}
              label="Thumbnail Image"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Caption (EN)</label>
              <textarea className="admin-input" rows={2} value={formData.captionEn} onChange={e => setFormData(p => ({ ...p, captionEn: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Caption (FR)</label>
              <textarea className="admin-input" rows={2} value={formData.captionFr} onChange={e => setFormData(p => ({ ...p, captionFr: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Caption (AR)</label>
              <textarea className="admin-input" rows={2} dir="rtl" value={formData.captionAr} onChange={e => setFormData(p => ({ ...p, captionAr: e.target.value }))} />
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
        {posts?.map((post) => (
          <div key={post.id} className="p-4 rounded-xl flex flex-col gap-3" style={{ background: 'var(--bg-surface)', opacity: post.isActive ? 1 : 0.5 }}>
            <div className="flex items-start gap-3">
              <div className="w-16 h-20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                    {PLATFORM_ICONS[post.platform] || <Rss size={20} />}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
                    {PLATFORM_ICONS[post.platform] || <Rss size={12} />}
                    {post.platform}
                  </span>
                </div>
                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-primary)' }}>{post.postUrl}</p>
                {post.authorName && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{post.authorName}</p>
                )}
                {post.captionEn && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{post.captionEn}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--bg-surface-light)' }}>
              <button onClick={() => handleEdit(post)} className="px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-colors" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}>
                Edit
              </button>
              <button onClick={() => setDeleteModal({ open: true, id: post.id })} className="px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-colors" style={{ background: 'var(--bg-surface-light)', color: '#ef4444' }}>
                Delete
              </button>
              <button onClick={() => toggleMutation.mutate({ id: post.id })} className="px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-colors flex items-center gap-1 ml-auto" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}>
                {post.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                {post.isActive ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {posts?.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No social posts yet. Add your first post above.
        </div>
      )}

      <DeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => deleteModal.id && deleteMutation.mutate({ id: deleteModal.id })}
        title="Delete Social Post"
        description="Are you sure you want to delete this social media post? This action cannot be undone."
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
