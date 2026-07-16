import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

interface ErrorModalProps {
  open: boolean;
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
}

const severityConfig: Record<ErrorSeverity, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  error: {
    icon: <AlertTriangle size={24} />,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    icon: <AlertCircle size={24} />,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    icon: <Info size={24} />,
    color: '#4A8ABE',
    bg: 'rgba(74, 138, 190, 0.1)',
    border: 'rgba(74, 138, 190, 0.3)',
  },
  success: {
    icon: <CheckCircle2 size={24} />,
    color: 'var(--accent-green)',
    bg: 'rgba(107, 142, 90, 0.15)',
    border: 'rgba(107, 142, 90, 0.3)',
  },
};

export default function ErrorModal({
  open,
  title,
  message,
  severity = 'error',
  onClose,
  onConfirm,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  showCancel = false,
}: ErrorModalProps) {
  const config = severityConfig[severity];
  const displayTitle = title || (severity === 'error' ? 'Something Went Wrong' : severity === 'warning' ? 'Heads Up' : severity === 'success' ? 'All Good' : 'Notice');

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bg-surface-light)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
              >
                {config.icon}
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {displayTitle}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors cursor-pointer border-none"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-5">
            {showCancel && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer border-none"
                style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              className="px-5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer border-none"
              style={{ background: config.color, color: '#fff' }}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
