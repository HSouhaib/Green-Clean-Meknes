import { useContext } from "react";
import { ErrorModalContext } from "@/contexts/error-modal-context";

export function useErrorModalContext() {
  const ctx = useContext(ErrorModalContext);
  if (!ctx) throw new Error('useErrorModalContext must be used within ErrorModalProvider');
  return ctx;
}
