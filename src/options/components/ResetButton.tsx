import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RotateCcw } from 'lucide-react';
import { useT } from '@/shared/i18n/hooks';

interface ResetButtonProps {
  /** Callback when reset is confirmed */
  onReset: () => void;
  /** Disable reset button when locked */
  disabled?: boolean;
}

/**
 * Reset to defaults button with confirmation dialog
 * Provides safe reset functionality with user confirmation
 */
export const ResetButton: React.FC<ResetButtonProps> = ({ onReset, disabled = false }) => {
  const t = useT();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfirmReset = () => {
    onReset();
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="destructive"
        size="sm"
        disabled={disabled}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        {t('options.manageSettings.resetDialog.reset')}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('options.manageSettings.resetDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('options.manageSettings.resetDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('options.manageSettings.resetDialog.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmReset}>
              {t('options.manageSettings.resetDialog.reset')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
