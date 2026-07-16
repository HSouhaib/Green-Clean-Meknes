import { useErrorModalContext } from '@/providers/ErrorModalProvider';

export type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

export interface ErrorModalState {
  open: boolean;
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  onConfirm?: () => void;
  confirmLabel?: string;
  showCancel?: boolean;
  cancelLabel?: string;
}

export function useErrorModal() {
  const ctx = useErrorModalContext();
  return {
    state: ctx.state,
    showError: ctx.showError,
    showWarning: ctx.showWarning,
    showInfo: ctx.showInfo,
    showSuccess: ctx.showSuccess,
    closeError: ctx.closeError,
  };
}
