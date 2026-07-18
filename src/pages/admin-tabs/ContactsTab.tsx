import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { DeleteModal } from './shared';
import { useErrorModal } from '@/hooks/useErrorModal';

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ContactsTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: contacts, isLoading } = trpc.contact.list.useQuery();
  const { data: unreadCount } = trpc.contact.unreadCount.useQuery();
  const updateStatusMutation = trpc.contact.updateStatus.useMutation({
    onSuccess: () => {
      utils.contact.list.invalidate();
      utils.contact.unreadCount.invalidate();
      toast.success(t('toast.status_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });
  const deleteMutation = trpc.contact.delete.useMutation({
    onSuccess: () => {
      utils.contact.list.invalidate();
      utils.contact.unreadCount.invalidate();
      toast.success(t('toast.contact_deleted'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null; name: string }>({
    open: false,
    id: null,
    name: '',
  });

  if (isLoading) return <div className="p-8" style={{ color: 'var(--text-secondary)' }}>Loading contacts...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
          Contact Submissions
          {unreadCount ? (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-mono" style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}>
              {unreadCount} unread
            </span>
          ) : null}
        </h2>
      </div>

      <div className="space-y-3">
        {contacts?.map((contact) => (
          <div
            key={contact.id}
            className="p-5 rounded-lg transition-colors"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid',
              borderColor: contact.isRead ? 'var(--bg-surface-light)' : 'var(--accent-green)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{contact.name}</span>
                  <a href={`mailto:${contact.email}`} className="text-xs transition-colors hover:text-[var(--accent-green-light)]" style={{ color: 'var(--text-secondary)' }}>{contact.email}</a>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{formatDate(contact.createdAt)}</span>
                  {!contact.isRead && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase" style={{ background: 'rgba(58,90,42,0.3)', color: 'var(--accent-green-light)' }}>New</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{contact.message}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {!contact.isRead && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: contact.id, isRead: true })}
                    className="px-3 py-1.5 rounded text-xs transition-colors"
                    style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}
                  >
                    Mark Read
                  </button>
                )}
                {contact.isRead && !contact.isReplied && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: contact.id, isReplied: true })}
                    className="px-3 py-1.5 rounded text-xs transition-colors"
                    style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}
                  >
                    Mark Replied
                  </button>
                )}
                <button
                  onClick={() => setDeleteModal({ open: true, id: contact.id, name: contact.name })}
                  className="px-3 py-1.5 rounded text-xs transition-colors hover:text-red-400"
                  style={{ background: 'var(--bg-surface-light)', color: 'var(--text-tertiary)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {contacts?.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>No contact submissions yet.</div>
        )}
      </div>

      <DeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
        onConfirm={() => {
          if (deleteModal.id) {
            deleteMutation.mutate({ id: deleteModal.id });
            setDeleteModal({ open: false, id: null, name: '' });
          }
        }}
        title="Delete Message"
        description={`Are you sure you want to delete the message from "${deleteModal.name}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
