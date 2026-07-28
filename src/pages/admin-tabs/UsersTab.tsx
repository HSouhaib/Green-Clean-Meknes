import { useState } from "react";
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from "sonner";
import { useErrorModal } from "@/hooks/useErrorModal";
import { DataTable } from "./shared/DataTable";
import { DeleteModal } from "./shared";
import UserAvatar from "@/components/UserAvatar";
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  X,
  CalendarDays,
  Award,
} from "lucide-react";

const BUILTIN_ROLE_KEYS: Record<string, string> = {
  super_admin: "admin.roles.super_admin",
  admin: "admin.roles.admin",
  content_manager: "admin.roles.content_manager",
  volunteer_coordinator: "admin.roles.volunteer_coordinator",
  viewer: "admin.roles.viewer",
  user: "admin.roles.user",
};

const roleColors: Record<string, string> = {
  super_admin: "var(--accent-terracotta)",
  admin: "var(--accent-amber)",
  content_manager: "var(--accent-green)",
  volunteer_coordinator: "var(--accent-blue)",
  viewer: "var(--text-tertiary)",
  user: "var(--text-tertiary)",
};

export function UsersTab() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: userList } = trpc.user.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    role: roleFilter || undefined,
  });
  const { data: roles } = trpc.role.list.useQuery();
  const { data: selectedUser } = trpc.user.getById.useQuery(
    { id: selectedUserId! },
    { enabled: selectedUserId !== null }
  );
  const { data: activitySummary } = trpc.user.activitySummary.useQuery(
    { id: selectedUserId! },
    { enabled: selectedUserId !== null }
  );

  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      utils.user.getById.invalidate();
      toast.success(t("toast.role_updated"));
    },
    onError: err => showError(err.message),
  });

  const toggleStatusMutation = trpc.user.toggleStatus.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      toast.success(t("toast.user_status_updated"));
    },
    onError: () => showError(t("toast.failed_update_status")),
  });

  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      setSelectedUserId(null);
      toast.success(t("toast.user_deleted"));
    },
    onError: () => showError(t("toast.failed_delete_user")),
  });

  const resetTwoFactorMutation = trpc.user.resetTwoFactor.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      utils.user.getById.invalidate();
      toast.success(t("toast.two_factor_reset"));
    },
    onError: () => showError(t("toast.failed_reset_2fa")),
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const getRoleLabel = (roleName: string) => {
    if (BUILTIN_ROLE_KEYS[roleName]) return t(BUILTIN_ROLE_KEYS[roleName]);
    return roles?.find((r) => r.name === roleName)?.labelEn ?? roleName;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("admin.users.title")}
        </h2>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {userList?.total ?? 0} {t("admin.users.total_users")}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            placeholder={t("admin.users.search_placeholder")}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="admin-input pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="admin-input w-full sm:w-40"
        >
          <option value="">{t("admin.users.all_roles")}</option>
          {roles?.map(role => (
            <option key={role.name} value={role.name}>
              {getRoleLabel(role.name)}
            </option>
          ))}
        </select>
      </div>

      {/* User Table */}
      <DataTable
        data={userList?.users ?? []}
        keyExtractor={u => u.id}
        onRowClick={u => setSelectedUserId(u.id)}
        columns={[
          {
            key: "name",
            header: t("admin.users.user_column"),
            render: u => (
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={u.avatar}
                  name={u.name}
                  className="w-8 h-8 flex-shrink-0"
                />
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {u.name || t("admin.users.unnamed")}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {u.email || t("admin.users.no_email")}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "twoFactorEnabled",
            header: t("admin.users.two_fa_column"),
            render: u => (
              <span
                className="inline-flex items-center gap-1 text-xs"
                style={{
                  color: u.twoFactorEnabled
                    ? "var(--accent-green)"
                    : "var(--text-tertiary)",
                }}
              >
                <Shield size={12} />
                {u.twoFactorEnabled ? t("admin.users.enabled") : t("admin.users.disabled")}
              </span>
            ),
          },
          {
            key: "role",
            header: t("admin.users.role_column"),
            render: u => (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: `${roleColors[u.role] || "var(--text-tertiary)"}20`,
                  color: roleColors[u.role] || "var(--text-tertiary)",
                }}
              >
                <Shield size={10} />
                {getRoleLabel(u.role)}
              </span>
            ),
          },
          {
            key: "isActive",
            header: t("admin.users.status_column"),
            render: u => (
              <span
                className="inline-flex items-center gap-1 text-xs"
                style={{
                  color: u.isActive
                    ? "var(--accent-green)"
                    : "var(--accent-terracotta)",
                }}
              >
                {u.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                {u.isActive ? t("admin.users.active") : t("admin.users.inactive")}
              </span>
            ),
          },
          {
            key: "lastSignInAt",
            header: t("admin.users.last_sign_in_column"),
            render: u => (
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {u.lastSignInAt
                  ? new Date(u.lastSignInAt).toLocaleDateString()
                  : t("admin.users.never")}
              </span>
            ),
          },
          {
            key: "createdAt",
            header: t("admin.users.joined_column"),
            render: u => (
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString()
                  : t("admin.users.unknown")}
              </span>
            ),
          },
        ]}
      />

      {/* Pagination */}
      {userList && userList.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded text-sm disabled:opacity-40"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          >
            {t("admin.users.previous")}
          </button>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("admin.users.page")} {page} {t("admin.users.of")} {userList.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(userList.totalPages, p + 1))}
            disabled={page >= userList.totalPages}
            className="px-3 py-1.5 rounded text-sm disabled:opacity-40"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          >
            {t("admin.users.next")}
          </button>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedUserId(null)}
        >
          <div
            className="w-full max-w-lg mx-0 sm:mx-4 rounded-xl overflow-hidden my-0 sm:my-8"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--bg-surface-light)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: "1px solid var(--bg-surface-light)" }}
            >
              <h3
                className="text-lg font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {t("admin.users.user_details")}
              </h3>
              <button
                onClick={() => setSelectedUserId(null)}
                className="p-1 rounded hover:bg-[var(--bg-surface-light)]"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <UserAvatar
                  src={selectedUser.avatar}
                  name={selectedUser.name}
                  className="w-14 h-14"
                />
                <div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedUser.name || t("admin.users.unnamed_user")}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {selectedUser.email}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    ID: {selectedUser.unionId}
                    {selectedUser.unionId?.startsWith("local:") && (
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                        style={{
                          background: "var(--accent-green-muted)",
                          color: "var(--accent-green)",
                        }}
                      >
                        {t("admin.users.local")}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-lg"
                  style={{ background: "var(--bg-surface)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays
                      size={14}
                      style={{ color: "var(--accent-green)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t("admin.users.registrations")}
                    </span>
                  </div>
                  <p
                    className="text-lg font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {activitySummary?.registrations ?? 0}
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ background: "var(--bg-surface)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Award
                      size={14}
                      style={{ color: "var(--accent-terracotta)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t("admin.users.attended")}
                    </span>
                  </div>
                  <p
                    className="text-lg font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {activitySummary?.attended ?? 0}
                  </p>
                </div>
              </div>

              {/* Role Change */}
              <div>
                <label
                  className="text-xs font-mono uppercase tracking-wider block mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {t("admin.users.role_label")}
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedUser.role}
                    onChange={e =>
                      updateRoleMutation.mutate({
                        id: selectedUser.id,
                        role: e.target.value,
                      })
                    }
                    className="admin-input flex-1"
                    disabled={updateRoleMutation.isPending}
                  >
                    {roles?.map(role => (
                      <option key={role.name} value={role.name}>
                        {getRoleLabel(role.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--bg-surface)" }}
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("admin.users.account_status")}
                </span>
                <button
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      id: selectedUser.id,
                      isActive: !selectedUser.isActive,
                    })
                  }
                  disabled={toggleStatusMutation.isPending}
                  className="relative w-12 h-6 rounded-full transition-colors"
                  style={{
                    background: selectedUser.isActive
                      ? "var(--accent-green)"
                      : "var(--bg-surface-light)",
                  }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
                    style={{
                      background: "var(--bg-primary)",
                      transform: selectedUser.isActive
                        ? "translateX(1.5rem)"
                        : "translateX(0)",
                    }}
                  />
                </button>
              </div>

              {/* 2FA Status */}
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--bg-surface)" }}
              >
                <div className="flex items-center gap-2">
                  <Shield
                    size={14}
                    style={{
                      color: selectedUser.twoFactorEnabled
                        ? "var(--accent-green)"
                        : "var(--text-tertiary)",
                    }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {t("admin.users.two_factor_auth")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs"
                    style={{
                      color: selectedUser.twoFactorEnabled
                        ? "var(--accent-green)"
                        : "var(--text-tertiary)",
                    }}
                  >
                    {selectedUser.twoFactorEnabled ? t("admin.users.enabled") : t("admin.users.disabled")}
                  </span>
                  {selectedUser.twoFactorEnabled && (
                    <button
                      onClick={() =>
                        resetTwoFactorMutation.mutate({ id: selectedUser.id })
                      }
                      disabled={resetTwoFactorMutation.isPending}
                      className="px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer border-none"
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                      }}
                    >
                      {t("admin.users.reset")}
                    </button>
                  )}
                </div>
              </div>

              {/* Delete User */}
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.1)",
                }}
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("admin.users.delete_account")}
                </span>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer border-none"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                  }}
                >
                  <Trash2 size={14} />
                  {t("admin.shared.delete")}
                </button>
              </div>

              {/* Registration History */}
              {selectedUser.registrations &&
                selectedUser.registrations.length > 0 && (
                  <div>
                    <label
                      className="text-xs font-mono uppercase tracking-wider block mb-2"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t("admin.users.campaign_history")}
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedUser.registrations.map(reg => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-2 rounded"
                          style={{ background: "var(--bg-surface)" }}
                        >
                          <div>
                            <p
                              className="text-sm"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {reg.campaignTitle}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {reg.campaignDate}
                            </p>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background:
                                reg.status === "attended"
                                  ? "var(--accent-green)"
                                  : "var(--bg-surface-light)",
                              color:
                                reg.status === "attended"
                                  ? "white"
                                  : "var(--text-secondary)",
                            }}
                          >
                            {reg.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal — outside user details modal to avoid z-index conflict */}
      {selectedUser && (
        <DeleteModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => {
            deleteMutation.mutate({ id: selectedUser.id });
            setDeleteModalOpen(false);
          }}
          title={t("admin.users.delete_user_title")}
          description={t("admin.users.delete_user_description")}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
