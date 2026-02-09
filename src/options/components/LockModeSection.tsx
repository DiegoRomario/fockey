import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lock, LockOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/shared/i18n/hooks';
import { LockModeState } from '@/shared/types/settings';
import {
  TimeUnit,
  durationToMs,
  formatCountdown,
  formatExpirationTime,
  formatDuration,
  validateDuration,
  calculateRemainingTime,
  shouldShowWarning,
} from '@/shared/utils/lock-mode-utils';

export interface LockModeSectionProps {
  /** Current lock mode state */
  lockState: LockModeState;
  /** Callback when lock mode is activated */
  onActivate: (durationMs: number) => Promise<void>;
  /** Callback when lock mode is extended */
  onExtend: (additionalMs: number) => Promise<void>;
}

/**
 * Lock Mode Section Component
 * Displays lock mode controls and status in the Options page
 *
 * Features:
 * - Unlocked state: Duration input + unit selector + activate button
 * - Locked state: Live countdown + expiration time + extension controls
 * - Real-time countdown updates (every second)
 * - Validation and user feedback
 */
export const LockModeSection: React.FC<LockModeSectionProps> = ({
  lockState,
  onActivate,
  onExtend,
}) => {
  const t = useT();
  const { toast } = useToast();

  // Form state
  const [durationValue, setDurationValue] = useState<string>('10');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(TimeUnit.Minutes);
  const [isActivating, setIsActivating] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  // Countdown state (updates every second)
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Update remaining time every second when locked
  useEffect(() => {
    if (!lockState.isLocked || !lockState.lockEndTime) {
      setRemainingTime(0);
      return;
    }

    // Initial calculation
    const updateRemainingTime = () => {
      const remaining = calculateRemainingTime(lockState.lockEndTime!);
      setRemainingTime(remaining);
    };

    updateRemainingTime();

    // Update every second
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [lockState.isLocked, lockState.lockEndTime]);

  const handleActivate = async () => {
    const value = parseInt(durationValue, 10);
    const error = validateDuration(value, timeUnit);

    if (error) {
      toast({
        title: t('toasts.invalidDuration'),
        description: error,
        variant: 'warning',
      });
      return;
    }

    setIsActivating(true);

    try {
      const durationMs = durationToMs(value, timeUnit);
      await onActivate(durationMs);

      toast({
        title: t('toasts.lockModeActivated', { duration: formatDuration(durationMs) }),
        variant: 'success',
      });

      // Reset form
      setDurationValue('10');
      setTimeUnit(TimeUnit.Minutes);
    } catch (error) {
      toast({
        title: t('toasts.activationFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleExtend = async () => {
    const value = parseInt(durationValue, 10);
    const error = validateDuration(value, timeUnit);

    if (error) {
      toast({
        title: t('toasts.invalidDuration'),
        description: error,
        variant: 'warning',
      });
      return;
    }

    setIsExtending(true);

    try {
      const additionalMs = durationToMs(value, timeUnit);
      await onExtend(additionalMs);

      toast({
        title: t('toasts.lockExtended', { duration: formatDuration(additionalMs) }),
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: t('toasts.extensionFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          {lockState.isLocked ? (
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          ) : (
            <div className="p-2 rounded-full bg-muted">
              <LockOpen className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <CardTitle>
              {lockState.isLocked
                ? t('options.lockMode.locked.title')
                : t('options.lockMode.unlocked.title')}
            </CardTitle>
            {!lockState.isLocked && (
              <CardDescription className="mt-1">
                {t('options.lockMode.unlocked.description')}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {lockState.isLocked && lockState.lockEndTime ? (
          // LOCKED STATE
          <>
            {/* Countdown Timer */}
            <div className="text-center py-6 px-4 bg-muted rounded-lg">
              <div
                className={`text-4xl font-bold mb-2 ${
                  shouldShowWarning(remainingTime)
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-foreground'
                }`}
              >
                {formatCountdown(remainingTime)}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('options.lockMode.locked.unlocksAt', {
                  time: formatExpirationTime(lockState.lockEndTime),
                })}
              </p>
            </div>

            {/* Motivational Message */}
            <div className="text-center py-4 px-6 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                {t('options.lockMode.locked.message')}
              </p>
            </div>

            {/* Extension Controls */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium">
                {t('options.lockMode.locked.extendLabel')}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  placeholder="Duration"
                  className="flex-1"
                />
                <Select
                  value={timeUnit}
                  onValueChange={(value: string) => setTimeUnit(value as TimeUnit)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TimeUnit.Minutes}>
                      {t('options.lockMode.units.minutes')}
                    </SelectItem>
                    <SelectItem value={TimeUnit.Hours}>
                      {t('options.lockMode.units.hours')}
                    </SelectItem>
                    <SelectItem value={TimeUnit.Days}>
                      {t('options.lockMode.units.days')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleExtend}
                disabled={isExtending || !durationValue}
                className="w-full"
                variant="outline"
              >
                {isExtending
                  ? t('options.lockMode.locked.extending')
                  : t('options.lockMode.locked.extendButton')}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t('options.lockMode.locked.extendHint')}
              </p>
            </div>
          </>
        ) : (
          // UNLOCKED STATE
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="lock-duration">{t('options.lockMode.unlocked.durationLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  id="lock-duration"
                  type="number"
                  min="1"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  placeholder="Duration"
                  className="flex-1"
                />
                <Select
                  value={timeUnit}
                  onValueChange={(value: string) => setTimeUnit(value as TimeUnit)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TimeUnit.Minutes}>
                      {t('options.lockMode.units.minutes')}
                    </SelectItem>
                    <SelectItem value={TimeUnit.Hours}>
                      {t('options.lockMode.units.hours')}
                    </SelectItem>
                    <SelectItem value={TimeUnit.Days}>
                      {t('options.lockMode.units.days')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('options.lockMode.unlocked.durationHint')}
              </p>
            </div>

            <Button
              onClick={handleActivate}
              disabled={isActivating || !durationValue}
              className="w-full"
            >
              {isActivating
                ? t('options.lockMode.unlocked.activating')
                : t('options.lockMode.unlocked.activateButton')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
