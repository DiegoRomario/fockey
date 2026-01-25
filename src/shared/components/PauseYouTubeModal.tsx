/**
 * Pause YouTube Module Modal Component
 * Shared modal for pausing the YouTube module with preset durations
 * Used by both Options page and Popup
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface PauseYouTubeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPause: (durationMs: number | null) => Promise<void>;
  onResume?: () => Promise<void>;
  isPaused?: boolean;
}

/**
 * Pause YouTube Module Modal
 * Provides preset and custom time options for pausing the YouTube module
 */
export const PauseYouTubeModal: React.FC<PauseYouTubeModalProps> = ({
  open,
  onOpenChange,
  onPause,
  onResume,
  isPaused = false,
}) => {
  const [customHours, setCustomHours] = useState<string>('1');
  const [customMinutes, setCustomMinutes] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetPause = async (durationMs: number | null) => {
    setIsProcessing(true);
    try {
      await onPause(durationMs);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to pause YouTube module:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomPause = async () => {
    const hours = parseInt(customHours || '0', 10);
    const minutes = parseInt(customMinutes || '0', 10);

    if (hours === 0 && minutes === 0) {
      return;
    }

    const durationMs = (hours * 60 + minutes) * 60 * 1000;

    setIsProcessing(true);
    try {
      await onPause(durationMs);
      onOpenChange(false);
      setShowCustom(false);
      setCustomHours('1');
      setCustomMinutes('0');
    } catch (error) {
      console.error('Failed to pause YouTube module:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResume = async () => {
    if (!onResume) return;

    setIsProcessing(true);
    try {
      await onResume();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to resume YouTube module:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate time until end of today (midnight)
  const getTimeUntilMidnight = (): number => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isPaused ? 'Resume YouTube Module?' : 'For how long do you want to pause?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isPaused
              ? 'Click below to restore the minimalist experience'
              : 'YouTube will return to its original experience during the pause'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {isPaused ? (
            // Resume option
            <Button
              onClick={handleResume}
              disabled={isProcessing}
              variant="default"
              className="w-full h-12 text-base"
            >
              {isProcessing ? 'Resuming...' : 'Resume Now'}
            </Button>
          ) : (
            <>
              {/* Preset Options */}
              <button
                onClick={() => handlePresetPause(15 * 60 * 1000)}
                disabled={isProcessing}
                className={cn(
                  'w-full p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-sm font-medium">For 15 min</span>
              </button>

              <button
                onClick={() => handlePresetPause(60 * 60 * 1000)}
                disabled={isProcessing}
                className={cn(
                  'w-full p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-sm font-medium">For 1 hr</span>
              </button>

              <button
                onClick={() => handlePresetPause(getTimeUntilMidnight())}
                disabled={isProcessing}
                className={cn(
                  'w-full p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-sm font-medium">For today</span>
              </button>

              {/* Custom Time */}
              {showCustom ? (
                <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                  <Label className="text-sm font-medium">Custom time</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={customHours}
                        onChange={(e) => setCustomHours(e.target.value)}
                        placeholder="0"
                        className="text-center"
                      />
                      <span className="text-xs text-muted-foreground block text-center mt-1">
                        h
                      </span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        placeholder="0"
                        className="text-center"
                      />
                      <span className="text-xs text-muted-foreground block text-center mt-1">
                        m
                      </span>
                    </div>
                    <Button
                      onClick={handleCustomPause}
                      disabled={
                        isProcessing ||
                        (parseInt(customHours || '0', 10) === 0 &&
                          parseInt(customMinutes || '0', 10) === 0)
                      }
                      variant="default"
                      className="px-6"
                    >
                      {isProcessing ? 'Starting...' : 'Start'}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustom(true)}
                  disabled={isProcessing}
                  className={cn(
                    'w-full p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="text-sm font-medium">Custom time</span>
                </button>
              )}

              {/* Disable (Indefinite Pause) */}
              <button
                onClick={() => handlePresetPause(null)}
                disabled={isProcessing}
                className={cn(
                  'w-full p-4 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors text-left',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-sm font-medium text-destructive">
                  Disable (resume manually)
                </span>
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PauseYouTubeModal;
