/**
 * Quick Block Hero Component (Popup Version)
 * Simplified Quick Block interface optimized for the popup
 * Primary action: Start focus sessions instantly with preset durations
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Target, Plus, PauseCircle, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getQuickBlockSession,
  startQuickBlockSession,
  extendQuickBlockSession,
  getQuickBlockRemainingTime,
  parseDurationPreset,
  formatDuration,
  endQuickBlockSession,
} from '@/shared/utils/quick-block-utils';
import { LockModeState } from '@/shared/types/settings';

interface QuickBlockHeroProps {
  lockState: LockModeState | null;
  onOpenSettings: () => void;
}

/**
 * Quick Block Hero component for popup
 * Provides instant focus session actions without full configuration UI
 */
export const QuickBlockHero: React.FC<QuickBlockHeroProps> = ({ lockState, onOpenSettings }) => {
  // Session state
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [hasConfiguredItems, setHasConfiguredItems] = useState(false);

  // Dialog state
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showStopConfirmDialog, setShowStopConfirmDialog] = useState(false);
  const [showLockModeWarning, setShowLockModeWarning] = useState(false);
  const [pendingStartDuration, setPendingStartDuration] = useState<number | null>(null);
  const [extendDuration, setExtendDuration] = useState<string>('25min');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadQuickBlockSession = async () => {
    try {
      const session = await getQuickBlockSession();
      setIsActive(session.isActive);
      setEndTime(session.endTime);

      // Check if user has configured any items
      const hasItems =
        session.blockedDomains.length > 0 ||
        session.urlKeywords.length > 0 ||
        session.contentKeywords.length > 0;
      setHasConfiguredItems(hasItems);

      if (session.isActive) {
        if (session.endTime) {
          const remaining = await getQuickBlockRemainingTime();
          setRemainingTime(remaining);
        } else {
          // Indefinite session
          setRemainingTime(-1);
        }
      }
    } catch (error) {
      console.error('Failed to load Quick Block session:', error);
    }
  };

  // Load session on mount
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const session = await getQuickBlockSession();
        if (!isMounted) return;

        setIsActive(session.isActive);
        setEndTime(session.endTime);

        // Check if user has configured any items
        const hasItems =
          session.blockedDomains.length > 0 ||
          session.urlKeywords.length > 0 ||
          session.contentKeywords.length > 0;
        setHasConfiguredItems(hasItems);

        if (session.isActive) {
          if (session.endTime) {
            const remaining = await getQuickBlockRemainingTime();
            if (!isMounted) return;
            setRemainingTime(remaining);
          } else {
            // Indefinite session
            if (!isMounted) return;
            setRemainingTime(-1);
          }
        }
      } catch (error) {
        console.error('Failed to load Quick Block session:', error);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update timer every second when active
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(async () => {
      if (endTime === null) {
        setRemainingTime(-1);
        return;
      }

      const remaining = await getQuickBlockRemainingTime();
      setRemainingTime(remaining);

      if (remaining === 0) {
        setIsActive(false);
        setEndTime(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, endTime]);

  const handleQuickStart = async (durationMs: number | null) => {
    if (!hasConfiguredItems) {
      setErrorMessage('No blocking rules configured');
      return;
    }

    // Check if Lock Mode is active - show warning
    if (lockState?.isLocked) {
      setPendingStartDuration(durationMs);
      setShowLockModeWarning(true);
      return;
    }

    await performStartSession(durationMs);
  };

  const performStartSession = async (durationMs: number | null) => {
    try {
      const session = await getQuickBlockSession();
      await startQuickBlockSession(
        durationMs,
        session.blockedDomains,
        session.urlKeywords,
        session.contentKeywords
      );
      await loadQuickBlockSession();
      setShowLockModeWarning(false);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to start Quick Block:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start Quick Block');
    }
  };

  const handleStopSession = () => {
    if (lockState?.isLocked) {
      setErrorMessage('Cannot stop Quick Block while Lock Mode is active');
      return;
    }

    setShowStopConfirmDialog(true);
  };

  const performStopSession = async () => {
    try {
      await endQuickBlockSession();
      await loadQuickBlockSession();
      setShowStopConfirmDialog(false);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to stop Quick Block:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to stop session');
    }
  };

  const handleExtendClick = () => {
    if (endTime === null) {
      setErrorMessage('This session has no time limit');
      return;
    }

    setExtendDuration('25min');
    setShowExtendDialog(true);
  };

  const handleExtendSession = async () => {
    try {
      const additionalMs = parseDurationPreset(extendDuration);
      await extendQuickBlockSession(additionalMs);
      const remaining = await getQuickBlockRemainingTime();
      setRemainingTime(remaining);
      setShowExtendDialog(false);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to extend Quick Block:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to extend session');
    }
  };

  const formatEndTime = () => {
    if (!endTime) return '';
    return new Date(endTime).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // ==================== RENDER ====================

  // Active Session State
  if (isActive) {
    return (
      <>
        <div className="space-y-3">
          {/* Timer Display */}
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950 p-6 text-center">
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400 mb-2" />
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
              Quick Block Active
            </p>
            {remainingTime === -1 ? (
              <>
                <div className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-1">
                  No Time Limit
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">Until manually stopped</p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-1">
                  {formatDuration(remainingTime)}
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Ends at {formatEndTime()}
                </p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {endTime !== null && (
              <Button onClick={handleExtendClick} variant="outline" size="sm" className="flex-1">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Extend
              </Button>
            )}
            <Button
              onClick={handleStopSession}
              variant="destructive"
              size="sm"
              className="flex-1"
              disabled={lockState?.isLocked}
            >
              <PauseCircle className="mr-1.5 h-3.5 w-3.5" />
              Stop
            </Button>
          </div>

          {/* Status Text */}
          <button
            onClick={onOpenSettings}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            View details →
          </button>

          {errorMessage && <p className="text-xs text-destructive text-center">⚠ {errorMessage}</p>}
        </div>

        {/* Extend Dialog */}
        <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Extend Quick Block</DialogTitle>
              <DialogDescription>Add more time to your focus session</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={extendDuration === '25min' ? 'default' : 'outline'}
                    onClick={() => setExtendDuration('25min')}
                    size="sm"
                  >
                    25 min
                  </Button>
                  <Button
                    variant={extendDuration === '1hr' ? 'default' : 'outline'}
                    onClick={() => setExtendDuration('1hr')}
                    size="sm"
                  >
                    1 hr
                  </Button>
                  <Button
                    variant={extendDuration === '24hrs' ? 'default' : 'outline'}
                    onClick={() => setExtendDuration('24hrs')}
                    size="sm"
                  >
                    24 hrs
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExtendDialog(false)} size="sm">
                Cancel
              </Button>
              <Button onClick={handleExtendSession} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Extend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stop Confirmation Dialog */}
        <Dialog open={showStopConfirmDialog} onOpenChange={setShowStopConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Stop Quick Block?</DialogTitle>
              <DialogDescription>
                Are you sure you want to stop this focus session? Your configured items will be
                saved for future sessions.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStopConfirmDialog(false)} size="sm">
                Cancel
              </Button>
              <Button variant="destructive" onClick={performStopSession} size="sm">
                Stop Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lock Mode Warning Dialog */}
        <Dialog open={showLockModeWarning} onOpenChange={setShowLockModeWarning}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Start Quick Block with Lock Mode Active</DialogTitle>
              <DialogDescription>
                Lock Mode is currently active. If you start Quick Block now,
                {pendingStartDuration === null
                  ? ' you will not be able to stop it until Lock Mode expires.'
                  : ' it will run until the timer expires, and you will not be able to stop it manually while Lock Mode is active.'}{' '}
                Do you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLockModeWarning(false)} size="sm">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await performStartSession(pendingStartDuration);
                  setPendingStartDuration(null);
                }}
                size="sm"
              >
                Start Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Inactive Configuration State
  return (
    <>
      <div className="space-y-3">
        {/* Hero Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h3 className="font-semibold text-sm">Quick Block</h3>
          <p className="text-xs text-muted-foreground">Start a focus session</p>
        </div>

        {/* Preset Duration Buttons */}
        {hasConfiguredItems ? (
          <>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStart(parseDurationPreset('25min'))}
                className="h-9"
              >
                25 min
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStart(parseDurationPreset('1hr'))}
                className="h-9"
              >
                1 hour
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStart(parseDurationPreset('8hrs'))}
                className="h-9"
              >
                8 hours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStart(parseDurationPreset('24hrs'))}
                className="h-9"
              >
                24 hours
              </Button>
            </div>

            {/* Status Line */}
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center justify-end gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Configure</span>
              <span>→</span>
            </button>
          </>
        ) : (
          <>
            {/* Not Configured State */}
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">⚠ No blocking rules configured</p>
            </div>
            <Button onClick={onOpenSettings} variant="default" size="sm" className="w-full">
              <Settings className="mr-2 h-3.5 w-3.5" />
              Configure Quick Block
            </Button>
          </>
        )}

        {errorMessage && <p className="text-xs text-destructive text-center">⚠ {errorMessage}</p>}
      </div>

      {/* Lock Mode Warning Dialog */}
      <Dialog open={showLockModeWarning} onOpenChange={setShowLockModeWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Quick Block with Lock Mode Active</DialogTitle>
            <DialogDescription>
              Lock Mode is currently active. If you start Quick Block now,
              {pendingStartDuration === null
                ? ' you will not be able to stop it until Lock Mode expires.'
                : ' it will run until the timer expires, and you will not be able to stop it manually while Lock Mode is active.'}{' '}
              Do you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockModeWarning(false)} size="sm">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await performStartSession(pendingStartDuration);
                setPendingStartDuration(null);
              }}
              size="sm"
            >
              Start Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickBlockHero;
