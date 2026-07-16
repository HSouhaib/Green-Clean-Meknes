import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Trash2, Search, UserCheck, UserX, Clock } from 'lucide-react';
import { useErrorModal } from '@/hooks/useErrorModal';

export function VolunteersTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = trpc.volunteer.list.useQuery({
    page,
    limit,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const updateStatusMutation = trpc.volunteer.updateStatus.useMutation({
    onSuccess: () => {
      utils.volunteer.list.invalidate();
      toast.success(t('toast.volunteer_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const deleteMutation = trpc.volunteer.delete.useMutation({
    onSuccess: () => {
      utils.volunteer.list.invalidate();
      toast.success(t('toast.volunteer_deleted'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      pending: { background: 'rgba(201, 168, 76, 0.15)', color: 'var(--accent-gold)' },
      approved: { background: 'rgba(58, 90, 42, 0.3)', color: 'var(--accent-green-light)' },
      rejected: { background: 'rgba(184, 112, 74, 0.15)', color: 'var(--accent-terracotta)' },
    };
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock size={12} />,
      approved: <UserCheck size={12} />,
      rejected: <UserX size={12} />,
    };
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={styles[status] ?? styles.pending}>
        {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-medium mb-6" style={{ color: 'var(--text-primary)' }}>
        Volunteer Registrations
      </h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="admin-input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="admin-input w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="animate-pulse h-32 rounded-lg" style={{ background: 'var(--bg-primary)' }} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--bg-surface-light)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-primary)' }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Name</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Email</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Phone</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Date</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.volunteers.map((volunteer) => (
                  <tr key={volunteer.id} className="border-t" style={{ borderColor: 'var(--bg-surface-light)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{volunteer.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{volunteer.email}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{volunteer.phone || '—'}</td>
                    <td className="px-4 py-3">{statusBadge(volunteer.status)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {volunteer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: volunteer.id, status: 'approved' })}
                              disabled={updateStatusMutation.isPending}
                              className="p-1.5 rounded transition-colors cursor-pointer border-none"
                              style={{ background: 'rgba(58, 90, 42, 0.2)', color: 'var(--accent-green-light)' }}
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: volunteer.id, status: 'rejected' })}
                              disabled={updateStatusMutation.isPending}
                              className="p-1.5 rounded transition-colors cursor-pointer border-none"
                              style={{ background: 'rgba(184, 112, 74, 0.2)', color: 'var(--accent-terracotta)' }}
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete registration for ${volunteer.name}?`)) {
                              deleteMutation.mutate({ id: volunteer.id });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded transition-colors cursor-pointer border-none"
                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.volunteers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      No volunteer registrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Page {data.page} of {data.totalPages} ({data.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer border-none"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer border-none"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
