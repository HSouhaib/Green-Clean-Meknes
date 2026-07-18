import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';

interface MutationLike {
  useMutation: (opts: {
    onSuccess: () => void;
    onError: (err?: { message?: string }) => void;
  }) => { mutate: (payload: unknown) => void };
}

interface RouterProxy {
  create: MutationLike;
  update: MutationLike;
  delete: MutationLike;
  toggleActive?: MutationLike;
}

interface UseAdminCrudOptions<T extends Record<string, unknown>> {
  router: string;
  queryKey: string;
  formDefaults: T;
  toastKeys: {
    created: string;
    updated: string;
    deleted: string;
    statusUpdated?: string;
  };
  extraInvalidate?: string[];
}

export function useAdminCrud<T extends Record<string, unknown>>(options: UseAdminCrudOptions<T>) {
  const { t } = useLanguage();
  const { showError } = useErrorModal();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<T>(options.formDefaults);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null; name: string }>({
    open: false,
    id: null,
    name: '',
  });

  // Dynamically access tRPC router
  const router = trpc[options.router as keyof typeof trpc] as unknown as RouterProxy;

  const invalidateQueries = () => {
    const base = options.queryKey as keyof typeof utils;
    const listAll = `${base}.listAll` as keyof typeof utils;
    const list = `${base}.list` as keyof typeof utils;
    
    // Use type assertion to call invalidate on dynamic keys
    (utils as unknown as Record<string, { invalidate?: () => void }>)[listAll]?.invalidate?.();
    (utils as unknown as Record<string, { invalidate?: () => void }>)[list]?.invalidate?.();

    // Extra invalidations (e.g., nextCampaign, upcoming, calendar)
    options.extraInvalidate?.forEach((key) => {
      const parts = key.split('.');
      let target: unknown = utils;
      for (const part of parts) {
        target = (target as Record<string, unknown>)?.[part];
      }
      (target as { invalidate?: () => void })?.invalidate?.();
    });
  };

  const createMutation = router.create.useMutation({
    onSuccess: () => {
      invalidateQueries();
      setShowForm(false);
      resetForm();
      toast.success(t(options.toastKeys.created));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const updateMutation = router.update.useMutation({
    onSuccess: () => {
      invalidateQueries();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      toast.success(t(options.toastKeys.updated));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const deleteMutation = router.delete.useMutation({
    onSuccess: () => {
      invalidateQueries();
      setDeleteModal({ open: false, id: null, name: '' });
      toast.success(t(options.toastKeys.deleted));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const toggleMutation = router.toggleActive?.useMutation({
    onSuccess: () => {
      invalidateQueries();
      toast.success(t(options.toastKeys.statusUpdated || 'toast.status_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  function resetForm() {
    setFormData(options.formDefaults);
  }

  function handleEdit(item: Record<string, unknown>) {
    setEditingId(item.id as number);
    // Default: copy all fields from item, falling back to defaults for missing fields
    const merged = { ...options.formDefaults };
    for (const key of Object.keys(options.formDefaults)) {
      if (item[key] !== undefined && item[key] !== null) {
        (merged as Record<string, unknown>)[key] = item[key];
      }
    }
    setFormData(merged as T);
    setShowForm(true);
  }

  function handleSubmit(getPayload: () => Record<string, unknown>) {
    const payload = getPayload();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return {
    showForm,
    setShowForm,
    editingId,
    setEditingId,
    formData,
    setFormData,
    deleteModal,
    setDeleteModal,
    createMutation,
    updateMutation,
    deleteMutation,
    toggleMutation,
    resetForm,
    handleEdit,
    handleSubmit,
  };
}
