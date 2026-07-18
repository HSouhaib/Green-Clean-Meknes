import { useState } from "react";
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

export function UsersTab() {
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
      toast.success("Role updated");
    },
    onError: err => showError(err.message),
  });

  const toggleStatusMutation = trpc.user.toggleStatus.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      toast.success("User status updated");
    },
    onError: () => showError("Failed to update status"),
  });

  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      setSelectedUserId(null);
      toast.success("User deleted");
    },
    onError: () => showError("Failed to delete user"),
  });

  const resetTwoFactorMutation = trpc.user.resetTwoFactor.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      utils.user.getById.invalidate();
      toast.success("Two-factor authentication reset");
    },
    onError: () => showError("Failed to reset two-factor authentication"),
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const roleColors: Record<string, string> = {
    super_admin: "var(--accent-terracotta)",
    admin: "var(--accent-amber)",
    content_manager: "var(--accent-green)",
    volunteer_coordinator: "var(--accent-blue)",
    viewer: "var(--text-tertiary)",
    user: "var(--text-tertiary)",
  };

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    content_manager: "Content Manager",
    volunteer_coordinator: "Volunteer Coordinator",
    viewer: "Viewer",
    user: "User",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Users
        </h2>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {userList?.total ?? 0} total users
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
            placeholder="Search by name or email..."
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
          <option value="">All Roles</option>
          {roles?.map(role => (
            <option key={role.name} value={role.name}>
              {role.labelEn}
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
            header: "User",
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
                    {u.name || "Unnamed"}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {u.email || "No email"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "twoFactorEnabled",
            header: "2FA",
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
                {u.twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: u => (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: `${roleColors[u.role] || "var(--text-tertiary)"}20`,
                  color: roleColors[u.role] || "var(--text-tertiary)",
                }}
              >
                <Shield size={10} />
                {roleLabels[u.role] || u.role}
              </span>
            ),
          },
          {
            key: "isActive",
            header: "Status",
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
                {u.isActive ? "Active" : "Inactive"}
              </span>
            ),
          },
          {
            key: "lastSignInAt",
            header: "Last Sign In",
            render: u => (
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {u.lastSignInAt
                  ? new Date(u.lastSignInAt).toLocaleDateString()
                  : "Never"}
              </span>
            ),
          },
          {
            key: "createdAt",
            header: "Joined",
            render: u => (
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString()
                  : "Unknown"}
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
            Previous
          </button>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Page {page} of {userList.totalPages}
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
            Next
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
                User Details
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
                    {selectedUser.name || "Unnamed User"}
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
                        Local
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
                      Registrations
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
                      Attended
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
                  Role
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
                        {role.labelEn}
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
                  Account Status
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
                    Two-Factor Authentication
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
                    {selectedUser.twoFactorEnabled ? "Enabled" : "Disabled"}
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
                      Reset
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
                  Delete Account
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
                  Delete
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
                      Campaign History
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
          title="Delete User"
          description={`Are you sure you want to permanently delete ${selectedUser.name || "this user"}? This action cannot be undone.`}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
