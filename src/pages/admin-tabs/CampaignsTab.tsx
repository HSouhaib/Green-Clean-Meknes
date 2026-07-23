import { useState } from "react";
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from "sonner";
import { X, Users, Trash2 } from "lucide-react";
import { CAMPAIGN_STATUSES } from "@contracts/constants";
import { DeleteModal, GalleryUpload } from "./shared";
import UserAvatar from "@/components/UserAvatar";
import { useErrorModal } from "@/hooks/useErrorModal";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CampaignsTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: campaigns, isLoading } = trpc.campaign.listAll.useQuery();
  const deleteMutation = trpc.campaign.delete.useMutation({
    onSuccess: () => {
      utils.campaign.listAll.invalidate();
      utils.campaign.list.invalidate();
      utils.campaign.nextCampaign.invalidate();
      utils.campaign.upcoming.invalidate();
      utils.campaign.calendar.invalidate();
      utils.campaign.stats.invalidate();
      toast.success(t("toast.campaign_deleted"));
    },
    onError: () => showError(t("toast.error_generic")),
  });
  const toggleMutation = trpc.campaign.toggleActive.useMutation({
    onSuccess: () => {
      utils.campaign.listAll.invalidate();
      utils.campaign.list.invalidate();
      utils.campaign.nextCampaign.invalidate();
      utils.campaign.upcoming.invalidate();
      utils.campaign.calendar.invalidate();
      utils.campaign.stats.invalidate();
      toast.success(t("toast.status_updated"));
    },
    onError: () => showError(t("toast.error_generic")),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    titleEn: string;
    titleFr: string;
    titleAr: string;
    locationEn: string;
    locationFr: string;
    locationAr: string;
    descriptionEn: string;
    descriptionFr: string;
    descriptionAr: string;
    date: string;
    eventTime: string;
    slug: string;
    galleryImages: string[];
    filterTags: string;
    mapX: string;
    mapY: string;
    status: (typeof CAMPAIGN_STATUSES)[number];
    statsWasteKg: string;
    statsTrees: string;
    statsVolunteers: string;
    statsNeighborhoods: string;
  }>({
    titleEn: "",
    titleFr: "",
    titleAr: "",
    locationEn: "",
    locationFr: "",
    locationAr: "",
    descriptionEn: "",
    descriptionFr: "",
    descriptionAr: "",
    date: "",
    eventTime: "",
    slug: "",
    galleryImages: [],
    filterTags: "all",
    mapX: "",
    mapY: "",
    status: "upcoming",
    statsWasteKg: "",
    statsTrees: "",
    statsVolunteers: "",
    statsNeighborhoods: "",
  });

  const [regModal, setRegModal] = useState<{
    open: boolean;
    campaignId: number | null;
    campaignName: string;
  }>({
    open: false,
    campaignId: null,
    campaignName: "",
  });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: number | null;
    name: string;
  }>({
    open: false,
    id: null,
    name: "",
  });

  const [deleteRegModal, setDeleteRegModal] = useState<{
    open: boolean;
    id: number | null;
    name: string;
  }>({
    open: false,
    id: null,
    name: "",
  });

  const { data: registrations, isLoading: regsLoading } =
    trpc.campaign.registrationsByCampaign.useQuery(
      { id: regModal.campaignId ?? 0 },
      { enabled: regModal.open && regModal.campaignId !== null }
    );

  const deleteRegMutation = trpc.campaign.deleteRegistration.useMutation({
    onSuccess: () => {
      utils.campaign.registrationsByCampaign.invalidate();
      utils.campaign.listAll.invalidate();
      utils.campaign.list.invalidate();
      utils.campaign.nextCampaign.invalidate();
      utils.campaign.upcoming.invalidate();
      utils.campaign.calendar.invalidate();
      utils.campaign.stats.invalidate();
      setDeleteRegModal({ open: false, id: null, name: "" });
      toast.success("Registration removed");
    },
    onError: () => showError("Failed to remove registration"),
  });

  const createMutation = trpc.campaign.create.useMutation({
    onSuccess: () => {
      utils.campaign.listAll.invalidate();
      utils.campaign.list.invalidate();
      utils.campaign.nextCampaign.invalidate();
      utils.campaign.upcoming.invalidate();
      utils.campaign.calendar.invalidate();
      utils.campaign.stats.invalidate();
      setShowForm(false);
      resetForm();
      toast.success(t("toast.campaign_created"));
    },
    onError: () => showError(t("toast.error_generic")),
  });

  const updateMutation = trpc.campaign.update.useMutation({
    onSuccess: () => {
      utils.campaign.listAll.invalidate();
      utils.campaign.list.invalidate();
      utils.campaign.nextCampaign.invalidate();
      utils.campaign.upcoming.invalidate();
      utils.campaign.calendar.invalidate();
      utils.campaign.stats.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      toast.success(t("toast.campaign_updated"));
    },
    onError: () => showError(t("toast.error_generic")),
  });

  function resetForm() {
    setFormData({
      titleEn: "",
      titleFr: "",
      titleAr: "",
      locationEn: "",
      locationFr: "",
      locationAr: "",
      descriptionEn: "",
      descriptionFr: "",
      descriptionAr: "",
      date: "",
      eventTime: "",
      slug: "",
      galleryImages: [],
      filterTags: "all",
      mapX: "",
      mapY: "",
      status: "upcoming",
      statsWasteKg: "",
      statsTrees: "",
      statsVolunteers: "",
      statsNeighborhoods: "",
    });
  }

  function handleEdit(campaign: NonNullable<typeof campaigns>[number]) {
    setEditingId(campaign.id);
    setFormData({
      titleEn: campaign.titleEn,
      titleFr: campaign.titleFr ?? "",
      titleAr: campaign.titleAr ?? "",
      locationEn: campaign.locationEn,
      locationFr: campaign.locationFr ?? "",
      locationAr: campaign.locationAr ?? "",
      descriptionEn: campaign.descriptionEn,
      descriptionFr: campaign.descriptionFr ?? "",
      descriptionAr: campaign.descriptionAr ?? "",
      date: campaign.date,
      eventTime:
        campaign.eventDate && !isNaN(new Date(campaign.eventDate).getTime())
          ? new Date(campaign.eventDate).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "",
      slug: campaign.slug,
      galleryImages: campaign.galleryImages ?? [],
      filterTags: campaign.filterTags,
      mapX: campaign.mapX?.toString() ?? "",
      mapY: campaign.mapY?.toString() ?? "",
      status: campaign.status ?? "upcoming",
      statsWasteKg: campaign.statsWasteKg?.toString() ?? "",
      statsTrees: campaign.statsTrees?.toString() ?? "",
      statsVolunteers: campaign.statsVolunteers?.toString() ?? "",
      statsNeighborhoods: campaign.statsNeighborhoods?.toString() ?? "",
    });
    setShowForm(true);
  }

  // Parse display date like "12 July 2026" + optional "HH:MM" to Unix timestamp for countdown
  function parseDisplayDateToTimestamp(
    dateStr: string,
    timeStr?: string
  ): number | undefined {
    if (!dateStr) return undefined;
    const combined = timeStr ? `${dateStr} ${timeStr}` : dateStr;
    const parsed = new Date(combined);
    if (isNaN(parsed.getTime())) return undefined;
    return Math.floor(parsed.getTime() / 1000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parseStat = (value: string) => {
      if (value === "") return editingId ? undefined : 0;
      return parseInt(value, 10);
    };
    const { eventTime, ...baseForm } = formData;
    const payload = {
      ...baseForm,
      galleryImages: formData.galleryImages.filter(Boolean),
      mapX: formData.mapX ? parseFloat(formData.mapX) : undefined,
      mapY: formData.mapY ? parseFloat(formData.mapY) : undefined,
      eventDate: parseDisplayDateToTimestamp(formData.date, eventTime),
      statsWasteKg: parseStat(formData.statsWasteKg),
      statsTrees: parseStat(formData.statsTrees),
      statsVolunteers: parseStat(formData.statsVolunteers),
      statsNeighborhoods: parseStat(formData.statsNeighborhoods),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload as Parameters<typeof createMutation.mutate>[0]);
    }
  }

  if (isLoading)
    return (
      <div className="p-8" style={{ color: "var(--text-secondary)" }}>
        Loading campaigns...
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Campaigns
        </h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            resetForm();
          }}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          style={{
            background: "var(--accent-green)",
            color: "var(--bg-primary)",
          }}
        >
          + Add Campaign
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-6 rounded-lg space-y-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-surface-light)",
          }}
        >
          <h3
            className="text-lg font-medium mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            {editingId ? "Edit Campaign" : "New Campaign"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="Title (EN) *"
              value={formData.titleEn}
              onChange={e =>
                setFormData({ ...formData, titleEn: e.target.value })
              }
              required
              className="admin-input"
            />
            <input
              placeholder="Title (FR)"
              value={formData.titleFr}
              onChange={e =>
                setFormData({ ...formData, titleFr: e.target.value })
              }
              className="admin-input"
            />
            <input
              placeholder="Title (AR)"
              value={formData.titleAr}
              onChange={e =>
                setFormData({ ...formData, titleAr: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="Location (EN) *"
              value={formData.locationEn}
              onChange={e =>
                setFormData({ ...formData, locationEn: e.target.value })
              }
              required
              className="admin-input"
            />
            <input
              placeholder="Location (FR)"
              value={formData.locationFr}
              onChange={e =>
                setFormData({ ...formData, locationFr: e.target.value })
              }
              className="admin-input"
            />
            <input
              placeholder="Location (AR)"
              value={formData.locationAr}
              onChange={e =>
                setFormData({ ...formData, locationAr: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <textarea
              placeholder="Description (EN) *"
              value={formData.descriptionEn}
              onChange={e =>
                setFormData({ ...formData, descriptionEn: e.target.value })
              }
              required
              rows={3}
              className="admin-input"
            />
            <textarea
              placeholder="Description (FR)"
              value={formData.descriptionFr}
              onChange={e =>
                setFormData({ ...formData, descriptionFr: e.target.value })
              }
              rows={3}
              className="admin-input"
            />
            <textarea
              placeholder="Description (AR)"
              value={formData.descriptionAr}
              onChange={e =>
                setFormData({ ...formData, descriptionAr: e.target.value })
              }
              rows={3}
              className="admin-input"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              placeholder="Date (e.g., 12 July 2026) *"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
              className="admin-input"
            />
            <input
              type="time"
              placeholder="Start time (HH:MM)"
              value={formData.eventTime}
              onChange={e =>
                setFormData({ ...formData, eventTime: e.target.value })
              }
              className="admin-input"
            />
            <input
              placeholder="Slug (e.g., bab-mansour-cleanup) *"
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              required
              className="admin-input"
            />
            <input
              placeholder="Filter Tags (e.g., all,community,outdoor)"
              value={formData.filterTags}
              onChange={e =>
                setFormData({ ...formData, filterTags: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                placeholder="Map Latitude (e.g., 33.8933)"
                value={formData.mapX}
                onChange={e =>
                  setFormData({ ...formData, mapX: e.target.value })
                }
                className="admin-input"
              />
              {formData.mapX && formData.mapY && (
                <a
                  href={`https://www.google.com/maps?q=${formData.mapX},${formData.mapY}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-1 inline-block"
                  style={{ color: "var(--accent-green-light)" }}
                >
                  Preview on Google Maps →
                </a>
              )}
            </div>
            <input
              placeholder="Map Longitude (e.g., -5.5582)"
              value={formData.mapY}
              onChange={e => setFormData({ ...formData, mapY: e.target.value })}
              className="admin-input"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t("campaigns.status_label")}
              </label>
              <select
                value={formData.status}
                onChange={e =>
                  setFormData({
                    ...formData,
                    status: e.target
                      .value as (typeof CAMPAIGN_STATUSES)[number],
                  })
                }
                className="admin-input w-full"
              >
                {CAMPAIGN_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {t(`campaigns.status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-mono uppercase tracking-wider mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("campaigns.impact_stats")}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label
                  className="block text-[10px] mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("campaigns.stats.waste_label")}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.statsWasteKg}
                  onChange={e =>
                    setFormData({ ...formData, statsWasteKg: e.target.value })
                  }
                  className="admin-input w-full"
                />
              </div>
              <div>
                <label
                  className="block text-[10px] mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("campaigns.stats.trees_label")}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.statsTrees}
                  onChange={e =>
                    setFormData({ ...formData, statsTrees: e.target.value })
                  }
                  className="admin-input w-full"
                />
              </div>
              <div>
                <label
                  className="block text-[10px] mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("campaigns.stats.volunteers_label")}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.statsVolunteers}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      statsVolunteers: e.target.value,
                    })
                  }
                  className="admin-input w-full"
                />
              </div>
              <div>
                <label
                  className="block text-[10px] mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("campaigns.stats.neighborhoods_label")}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.statsNeighborhoods}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      statsNeighborhoods: e.target.value,
                    })
                  }
                  className="admin-input w-full"
                />
              </div>
            </div>
          </div>
          <GalleryUpload
            value={formData.galleryImages}
            onChange={urls => setFormData({ ...formData, galleryImages: urls })}
            label="Campaign Images"
          />
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2 rounded-md text-sm font-medium"
              style={{
                background: "var(--accent-green)",
                color: "var(--bg-primary)",
              }}
            >
              {editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 rounded-md text-sm font-medium"
              style={{
                background: "var(--bg-surface-light)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--bg-surface-light)" }}>
              <th
                className="text-left py-3 px-2 font-mono text-xs uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Title
              </th>
              <th
                className="text-left py-3 px-2 font-mono text-xs uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Date
              </th>
              <th
                className="text-left py-3 px-2 font-mono text-xs uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Location
              </th>
              <th
                className="text-center py-3 px-2 font-mono text-xs uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Status
              </th>
              <th
                className="text-center py-3 px-2 font-mono text-xs uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Visible
              </th>
              <th
                className="text-right py-3 px-2 font-mono text-xs uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns?.map(campaign => (
              <tr
                key={campaign.id}
                className="transition-colors hover:bg-[var(--bg-surface-light)]"
                style={{ borderBottom: "1px solid var(--bg-surface-light)" }}
              >
                <td
                  className="py-3 px-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {campaign.titleEn}
                </td>
                <td className="py-3 px-2">{campaign.date}</td>
                <td className="py-3 px-2">{campaign.locationEn}</td>
                <td className="py-3 px-2 text-center">
                  <span
                    className="px-2 py-1 rounded text-xs font-medium capitalize"
                    style={{
                      background:
                        campaign.status === "ongoing"
                          ? "rgba(58,90,42,0.3)"
                          : campaign.status === "upcoming"
                            ? "rgba(196,90,90,0.2)"
                            : campaign.status === "completed"
                              ? "rgba(74,138,190,0.2)"
                              : "rgba(85,85,85,0.3)",
                      color:
                        campaign.status === "ongoing"
                          ? "var(--accent-green-light)"
                          : campaign.status === "upcoming"
                            ? "var(--accent-terracotta)"
                            : campaign.status === "completed"
                              ? "#7fb3e0"
                              : "var(--text-tertiary)",
                    }}
                  >
                    {t(`campaigns.status.${campaign.status}`)}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <button
                    onClick={() => toggleMutation.mutate({ id: campaign.id })}
                    className="px-2 py-1 rounded text-xs font-medium transition-colors"
                    style={{
                      background: campaign.isActive
                        ? "rgba(58,90,42,0.3)"
                        : "rgba(85,85,85,0.3)",
                      color: campaign.isActive
                        ? "var(--accent-green-light)"
                        : "var(--text-tertiary)",
                    }}
                  >
                    {campaign.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="py-3 px-2 text-right">
                  <button
                    onClick={() =>
                      setRegModal({
                        open: true,
                        campaignId: campaign.id,
                        campaignName: campaign.titleEn,
                      })
                    }
                    className="mr-3 text-xs transition-colors hover:text-[var(--accent-green-light)]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(campaign)}
                    className="mr-3 text-xs transition-colors hover:text-[var(--accent-green-light)]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      setDeleteModal({
                        open: true,
                        id: campaign.id,
                        name: campaign.titleEn,
                      })
                    }
                    className="text-xs transition-colors hover:text-red-400"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        onConfirm={() => {
          if (deleteModal.id) {
            deleteMutation.mutate({ id: deleteModal.id });
            setDeleteModal({ open: false, id: null, name: "" });
          }
        }}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
      />

      {/* Registration Viewer Modal */}
      {regModal.open && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() =>
            setRegModal({ open: false, campaignId: null, campaignName: "" })
          }
        >
          <div
            className="relative w-full max-w-2xl max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-surface-light)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-5 border-b"
              style={{ borderColor: "var(--bg-surface-light)" }}
            >
              <div>
                <h3
                  className="text-lg font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Registrations
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {regModal.campaignName}
                </p>
              </div>
              <button
                onClick={() =>
                  setRegModal({
                    open: false,
                    campaignId: null,
                    campaignName: "",
                  })
                }
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{
                  background: "var(--bg-surface-light)",
                  color: "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {regsLoading ? (
                <div
                  className="py-8 text-center text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Loading registrations...
                </div>
              ) : !registrations || registrations.length === 0 ? (
                <div className="py-8 text-center">
                  <Users
                    size={32}
                    className="mx-auto mb-3"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    No registrations yet.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--bg-surface-light)",
                      }}
                    >
                      <th
                        className="text-left py-2 px-2 font-mono text-xs uppercase tracking-wider"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Volunteer
                      </th>
                      <th
                        className="text-left py-2 px-2 font-mono text-xs uppercase tracking-wider"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Email
                      </th>
                      <th
                        className="text-left py-2 px-2 font-mono text-xs uppercase tracking-wider"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Status
                      </th>
                      <th
                        className="text-left py-2 px-2 font-mono text-xs uppercase tracking-wider"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Registered
                      </th>
                      <th
                        className="text-right py-2 px-2 font-mono text-xs uppercase tracking-wider"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg: NonNullable<typeof registrations>[number]) => (
                      <tr
                        key={reg.id}
                        className="transition-colors hover:bg-[var(--bg-surface-light)]"
                        style={{
                          borderBottom: "1px solid var(--bg-surface-light)",
                        }}
                      >
                        <td
                          className="py-2 px-2"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              src={reg.user?.avatar}
                              name={
                                reg.user?.name || reg.guestName || undefined
                              }
                              className="w-6 h-6 flex-shrink-0"
                              style={{
                                background:
                                  !reg.user && reg.userId
                                    ? "rgba(239,68,68,0.1)"
                                    : "var(--bg-surface-light)",
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {reg.user?.name ?? reg.guestName ?? "Unknown"}
                              </span>
                              {!reg.user && reg.userId && (
                                <span
                                  className="text-[10px] font-medium"
                                  style={{ color: "#ef4444" }}
                                >
                                  Deleted User
                                </span>
                              )}
                              {!reg.user && !reg.userId && reg.guestName && (
                                <span
                                  className="text-[10px] font-medium"
                                  style={{ color: "var(--text-tertiary)" }}
                                >
                                  Guest
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td
                          className="py-2 px-2"
                          style={{
                            color: reg.user
                              ? "var(--text-secondary)"
                              : "var(--text-tertiary)",
                            fontStyle: reg.user ? "normal" : "italic",
                          }}
                        >
                          {reg.user?.email ?? reg.guestEmail ?? "-"}
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              background:
                                reg.status === "registered"
                                  ? "rgba(58,90,42,0.3)"
                                  : "rgba(85,85,85,0.3)",
                              color:
                                reg.status === "registered"
                                  ? "var(--accent-green-light)"
                                  : "var(--text-tertiary)",
                            }}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td
                          className="py-2 px-2"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {reg.createdAt ? formatDate(reg.createdAt) : "-"}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            onClick={() =>
                              setDeleteRegModal({
                                open: true,
                                id: reg.id,
                                name:
                                  reg.user?.name ?? reg.guestName ?? "Unknown",
                              })
                            }
                            disabled={deleteRegMutation.isPending}
                            className="p-1.5 rounded transition-colors cursor-pointer border-none"
                            style={{
                              background: "transparent",
                              color: "var(--text-tertiary)",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = "#ef4444";
                              e.currentTarget.style.background =
                                "rgba(239,68,68,0.1)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color =
                                "var(--text-tertiary)";
                              e.currentTarget.style.background = "transparent";
                            }}
                            title="Remove registration"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div
              className="p-4 border-t flex items-center justify-between"
              style={{ borderColor: "var(--bg-surface-light)" }}
            >
              <span
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                {registrations?.length ?? 0} volunteer
                {registrations && registrations.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() =>
                  setRegModal({
                    open: false,
                    campaignId: null,
                    campaignName: "",
                  })
                }
                className="px-4 py-2 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: "var(--bg-surface-light)",
                  color: "var(--text-secondary)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Registration Modal — outside reg modal to avoid z-index conflict */}
      <DeleteModal
        open={deleteRegModal.open}
        onClose={() => setDeleteRegModal({ open: false, id: null, name: "" })}
        onConfirm={() => {
          if (deleteRegModal.id) {
            deleteRegMutation.mutate({ id: deleteRegModal.id });
          }
        }}
        title="Remove Registration"
        description={`Are you sure you want to remove ${deleteRegModal.name}'s registration? This action cannot be undone.`}
        isPending={deleteRegMutation.isPending}
      />
    </div>
  );
}
