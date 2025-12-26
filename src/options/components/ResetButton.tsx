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
        Reset to Defaults
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Settings?</DialogTitle>
            <DialogDescription>
              This will reset all settings to their default values. All YouTube UI elements will be
              hidden by default (minimalist mode). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReset}>
              Reset to Defaults
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
