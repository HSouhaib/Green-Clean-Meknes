import { createContext } from 'react';
import type { ErrorModalState } from '@/hooks/useErrorModal';

export interface ErrorModalContextType {
  state: ErrorModalState;
  showError: (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => void;
  showWarning: (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => void;
  showInfo: (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => void;
  showSuccess: (message: string, options?: Partial<Omit<ErrorModalState, 'open' | 'message'>>) => void;
  closeError: () => void;
}

export const ErrorModalContext = createContext<ErrorModalContextType | null>(null);
