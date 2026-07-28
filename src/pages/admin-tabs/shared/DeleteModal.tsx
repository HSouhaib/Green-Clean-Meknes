import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

export function DeleteModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isPending: boolean;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="z-[300]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>{title}</DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)' }}>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)', border: 'none' }}>
            {t('admin.shared.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={isPending} style={{ background: '#dc2626', color: 'white' }}>
            {isPending ? t('admin.shared.deleting') : t('admin.shared.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
