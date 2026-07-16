import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';

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
  const router = trpc[options.router as keyof typeof trpc] as any;

  const invalidateQueries = () => {
    const base = options.queryKey as keyof typeof utils;
    const listAll = `${base}.listAll` as keyof typeof utils;
    const list = `${base}.list` as keyof typeof utils;
    
    // Use type assertion to call invalidate on dynamic keys
    (utils as any)[listAll]?.invalidate?.();
    (utils as any)[list]?.invalidate?.();
    
    // Extra invalidations (e.g., nextCampaign, upcoming, calendar)
    options.extraInvalidate?.forEach((key) => {
      const parts = key.split('.');
      let target: any = utils;
      for (const part of parts) {
        target = target?.[part];
      }
      target?.invalidate?.();
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

  function handleEdit(item: any) {
    setEditingId(item.id);
    // Default: copy all fields from item, falling back to defaults for missing fields
    const merged = { ...options.formDefaults };
    for (const key of Object.keys(options.formDefaults)) {
      if (item[key] !== undefined && item[key] !== null) {
        (merged as any)[key] = item[key];
      }
    }
    setFormData(merged);
    setShowForm(true);
  }

  function handleSubmit(getPayload: () => any) {
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
