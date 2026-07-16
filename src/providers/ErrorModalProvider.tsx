import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ErrorModalState } from '@/hooks/useErrorModal';
import ErrorModal from '@/components/ErrorModal';

interface ErrorModalContextType {
  state: ErrorModalState;
  showError: (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => void;
  showWarning: (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => void;
  showInfo: (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => void;
  showSuccess: (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => void;
  closeError: () => void;
}

const ErrorModalContext = createContext<ErrorModalContextType | null>(null);

export function useErrorModalContext() {
  const ctx = useContext(ErrorModalContext);
  if (!ctx) throw new Error('useErrorModalContext must be used within ErrorModalProvider');
  return ctx;
}

export function ErrorModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ErrorModalState>({
    open: false,
    message: '',
  });

  const showError = useCallback(
    (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => {
      setState({ open: true, message, severity: 'error', ...options });
    },
    []
  );

  const showWarning = useCallback(
    (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => {
      setState({ open: true, message, severity: 'warning', ...options });
    },
    []
  );

  const showInfo = useCallback(
    (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => {
      setState({ open: true, message, severity: 'info', ...options });
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => {
      setState({ open: true, message, severity: 'success', ...options });
    },
    []
  );

  const closeError = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <ErrorModalContext.Provider value={{ state, showError, showWarning, showInfo, showSuccess, closeError }}>
      {children}
      <ErrorModal
        open={state.open}
        title={state.title}
        message={state.message}
        severity={state.severity}
        onClose={closeError}
        onConfirm={state.onConfirm}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        showCancel={state.showCancel}
      />
    </ErrorModalContext.Provider>
  );
}
