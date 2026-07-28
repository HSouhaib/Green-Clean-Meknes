import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';
import { useLanguage } from '@/hooks/useLanguage';
import { PermissionMatrix } from './shared/PermissionMatrix';
import { DeleteModal } from './shared';
import { roleColors } from './shared/roleColors';
import { localizedRoleLabel } from '@/lib/roleLabels';
import {
  Shield,
  Users,
  Trash2,
  Edit3,
  Plus,
  X,
  Check,
  Lock,
} from 'lucide-react';

export function RolesTab() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLabelEn, setNewRoleLabelEn] = useState('');
  const [newRoleLabelFr, setNewRoleLabelFr] = useState('');
  const [newRoleLabelAr, setNewRoleLabelAr] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { t, lang } = useLanguage();
  const { data: roles } = trpc.role.list.useQuery();
  const { data: allPermissions } = trpc.role.permissions.useQuery();

  const createMutation = trpc.role.create.useMutation({
    onSuccess: () => {
      utils.role.list.invalidate();
      setIsCreating(false);
      resetForm();
      toast.success(t('toast.role_created'));
    },
    onError: (err) => showError(err.message),
  });

  const updateMutation = trpc.role.update.useMutation({
    onSuccess: () => {
      utils.role.list.invalidate();
      setEditingRole(null);
      toast.success(t('toast.role_updated'));
    },
    onError: (err) => showError(err.message),
  });

  const deleteMutation = trpc.role.delete.useMutation({
    onSuccess: () => {
      utils.role.list.invalidate();
      toast.success(t('toast.role_deleted'));
    },
    onError: (err) => showError(err.message),
  });

  const [deleteRoleModal, setDeleteRoleModal] = useState<{ open: boolean; id: number | null; name: string }>({ open: false, id: null, name: '' });

  const resetForm = () => {
    setNewRoleName('');
    setNewRoleLabelEn('');
    setNewRoleLabelFr('');
    setNewRoleLabelAr('');
    setNewRolePermissions([]);
  };

  const handleCreate = () => {
    if (!newRoleName || !newRoleLabelEn) {
      showError(t('toast.role_name_required'));
      return;
    }
    createMutation.mutate({
      name: newRoleName,
      labelEn: newRoleLabelEn,
      labelFr: newRoleLabelFr || undefined,
      labelAr: newRoleLabelAr || undefined,
      permissions: newRolePermissions,
    });
  };

  const handleUpdate = (roleId: number) => {
    updateMutation.mutate({
      id: roleId,
      permissions: editPermissions,
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
          {t('admin.roles.title')}
        </h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
        >
          <Plus size={16} />
          {t('admin.roles.create_role')}
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles?.map((role) => {
          const isEditing = editingRole === role.name;
          const color = roleColors[role.name] || 'var(--text-tertiary)';

          return (
            <div
              key={role.name}
              className="p-5 rounded-xl transition-all"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
                  >
                    <Shield size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {localizedRoleLabel(role, lang, t)}
                    </p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {role.name}
                    </p>
                  </div>
                </div>
                {role.isSystem && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-surface-light)', color: 'var(--text-tertiary)' }}
                  >
                    <Lock size={10} className="inline mr-1" />
                    {t('admin.roles.system')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {role.userCount} {t(role.userCount === 1 ? 'admin.roles.user_one' : 'admin.roles.user_other')}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {(() => {
                    try {
                      const perms = JSON.parse(role.permissions) as string[];
                      return `${perms.length} ${t(perms.length === 1 ? 'admin.roles.permission_one' : 'admin.roles.permission_other')}`;
                    } catch {
                      return `0 ${t('admin.roles.permission_other')}`;
                    }
                  })()}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleUpdate(role.id);
                    } else {
                      setEditingRole(role.name);
                      try {
                        const perms = JSON.parse(role.permissions) as string[];
                        setEditPermissions(perms);
                      } catch {
                        setEditPermissions([]);
                      }
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors"
                  style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}
                >
                  {isEditing ? <Check size={12} /> : <Edit3 size={12} />}
                  {isEditing ? t('admin.shared.save') : t('admin.shared.edit')}
                </button>
                {isEditing && (
                  <button
                    onClick={() => setEditingRole(null)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors"
                    style={{ background: 'var(--bg-surface-light)', color: 'var(--text-tertiary)' }}
                  >
                    <X size={12} />
                    {t('admin.shared.cancel')}
                  </button>
                )}
                {!isEditing && !role.isSystem && (
                  <button
                    onClick={() => setDeleteRoleModal({ open: true, id: role.id, name: role.labelEn })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors"
                    style={{ background: 'color-mix(in srgb, var(--accent-terracotta) 12%, transparent)', color: 'var(--accent-terracotta)' }}
                  >
                    <Trash2 size={12} />
                    {t('admin.shared.delete')}
                  </button>
                )}
              </div>

              {/* Inline Permission Editor */}
              {isEditing && allPermissions && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--bg-surface-light)' }}>
                  <PermissionMatrix
                    
                    selected={editPermissions}
                    onChange={setEditPermissions}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Role Modal */}
      {isCreating && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsCreating(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--bg-surface-light)' }}>
              <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                {t('admin.roles.create_title')}
              </h3>
              <button onClick={() => setIsCreating(false)} style={{ color: 'var(--text-tertiary)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    {t('admin.roles.key_label')}
                  </label>
                  <input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder={t('admin.roles.key_placeholder')}
                    className="admin-input"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {t('admin.roles.key_helper')}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    {t('admin.roles.label_en_label')}
                  </label>
                  <input
                    value={newRoleLabelEn}
                    onChange={(e) => setNewRoleLabelEn(e.target.value)}
                    placeholder={t('admin.roles.label_en_placeholder')}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    {t('admin.roles.label_fr_label')}
                  </label>
                  <input
                    value={newRoleLabelFr}
                    onChange={(e) => setNewRoleLabelFr(e.target.value)}
                    placeholder={t('admin.roles.label_fr_placeholder')}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    {t('admin.roles.label_ar_label')}
                  </label>
                  <input
                    value={newRoleLabelAr}
                    onChange={(e) => setNewRoleLabelAr(e.target.value)}
                    placeholder={t('admin.roles.label_ar_placeholder')}
                    className="admin-input"
                    dir="rtl"
                  />
                </div>
              </div>

              {allPermissions && (
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {t('admin.roles.permissions')}
                  </label>
                  <PermissionMatrix
                    
                    selected={newRolePermissions}
                    onChange={setNewRolePermissions}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setIsCreating(false); resetForm(); }}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                >
                  {t('admin.shared.cancel')}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
                >
                  {createMutation.isPending ? t('admin.shared.creating') : t('admin.roles.create_role')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteModal
        open={deleteRoleModal.open}
        onClose={() => setDeleteRoleModal({ open: false, id: null, name: '' })}
        onConfirm={() => {
          if (deleteRoleModal.id) {
            deleteMutation.mutate({ id: deleteRoleModal.id });
            setDeleteRoleModal({ open: false, id: null, name: '' });
          }
        }}
        title={t('admin.shared.delete')}
        description={t('admin.roles.delete_confirm').replace('{name}', deleteRoleModal.name)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
