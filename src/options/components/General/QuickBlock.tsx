/**
 * Quick Block Component
 * Fast, time-based blocking for immediate focus sessions
 *
 * NEW UX: Inline configuration without modals, instant start
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Globe, Link, FileText, X, Play, PauseCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  getQuickBlockSession,
  startQuickBlockSession,
  extendQuickBlockSession,
  getQuickBlockRemainingTime,
  parseDurationPreset,
  formatDuration,
  endQuickBlockSession,
  updateQuickBlockItems,
} from '@/shared/utils/quick-block-utils';
import { isValidDomainPattern, normalizeDomain } from '@/shared/utils/domain-utils';
import { useToast } from '@/hooks/use-toast';
import { LockModeState } from '@/shared/types/settings';
import { useT } from '@/shared/i18n/hooks';

interface QuickBlockProps {
  lockState: LockModeState | null;
}

export const QuickBlock: React.FC<QuickBlockProps> = ({ lockState }) => {
  const t = useT();

  // Session state
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Configuration state (persisted across sessions)
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedUrlKeywords, setSelectedUrlKeywords] = useState<string[]>([]);
  const [selectedContentKeywords, setSelectedContentKeywords] = useState<string[]>([]);

  // Input state
  const [domainInput, setDomainInput] = useState('');
  const [urlKeywordInput, setUrlKeywordInput] = useState('');
  const [contentKeywordInput, setContentKeywordInput] = useState('');
  const [domainInputError, setDomainInputError] = useState<string | null>(null);

  // Custom time state
  const [customHours, setCustomHours] = useState<string>('0');
  const [customMinutes, setCustomMinutes] = useState<string>('5');

  // Dialog state
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showCustomTimeDialog, setShowCustomTimeDialog] = useState(false);
  const [showLockModeWarning, setShowLockModeWarning] = useState(false);
  const [showStopConfirmDialog, setShowStopConfirmDialog] = useState(false);
  const [pendingStartDuration, setPendingStartDuration] = useState<number | null>(null);

  // Extend dialog state
  const [extendDuration, setExtendDuration] = useState<string>('25min');

  const { toast } = useToast();

  // Computed state
  const hasConfiguredItems =
    selectedDomains.length > 0 ||
    selectedUrlKeywords.length > 0 ||
    selectedContentKeywords.length > 0;

  const loadQuickBlockSession = async () => {
    try {
      const session = await getQuickBlockSession();
      setIsActive(session.isActive);
      setEndTime(session.endTime);

      // Load blocked items (preserved across sessions as a library)
      setSelectedDomains(session.blockedDomains);
      setSelectedUrlKeywords(session.urlKeywords);
      setSelectedContentKeywords(session.contentKeywords);

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

  // Load Quick Block session on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuickBlockSession().catch((error) => {
      console.error('Failed to load Quick Block session:', error);
    });
  }, []);

  // Update timer every second when active
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(async () => {
      if (endTime === null) {
        // Indefinite session - no countdown
        setRemainingTime(-1);
        return;
      }

      const remaining = await getQuickBlockRemainingTime();
      setRemainingTime(remaining);

      if (remaining === 0) {
        // Session expired
        setIsActive(false);
        setEndTime(null);
        toast({
          title: t('toasts.quickBlockStopped'),
          description: t('popup.quickBlock.description'),
          variant: 'success',
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, endTime, toast, t]);

  // ==================== CONFIGURATION HANDLERS ====================

  const handleAddDomain = async () => {
    const domain = normalizeDomain(domainInput.trim());

    if (!domain) {
      setDomainInputError(t('toasts.invalidInput'));
      return;
    }

    if (!isValidDomainPattern(domain)) {
      setDomainInputError(t('options.general.quickBlock.domains.error'));
      return;
    }

    if (selectedDomains.includes(domain)) {
      setDomainInputError(t('toasts.alreadyExists'));
      return;
    }

    setDomainInputError(null);
    const newDomains = [...selectedDomains, domain];
    setSelectedDomains(newDomains);
    setDomainInput('');

    // Persist immediately to storage
    try {
      await updateQuickBlockItems(newDomains, selectedUrlKeywords, selectedContentKeywords);
    } catch (error) {
      console.error('Failed to persist domain:', error);
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    // Don't allow removal when Quick Block is active
    if (isActive) {
      toast({
        title: t('common.warning'),
        description: t('toasts.cannotRemoveActive'),
        variant: 'warning',
      });
      return;
    }

    const newDomains = selectedDomains.filter((d) => d !== domain);
    setSelectedDomains(newDomains);

    // Persist immediately to storage
    try {
      await updateQuickBlockItems(newDomains, selectedUrlKeywords, selectedContentKeywords);
    } catch (error) {
      console.error('Failed to persist domain removal:', error);
    }
  };

  const handleAddUrlKeyword = async () => {
    const keyword = urlKeywordInput.trim();

    if (!keyword) {
      toast({
        title: t('common.warning'),
        description: t('toasts.invalidInput'),
        variant: 'warning',
      });
      return;
    }

    if (selectedUrlKeywords.includes(keyword)) {
      toast({
        title: t('common.warning'),
        description: t('toasts.alreadyExists'),
        variant: 'warning',
      });
      return;
    }

    const newUrlKeywords = [...selectedUrlKeywords, keyword];
    setSelectedUrlKeywords(newUrlKeywords);
    setUrlKeywordInput('');

    // Persist immediately to storage
    try {
      await updateQuickBlockItems(selectedDomains, newUrlKeywords, selectedContentKeywords);
    } catch (error) {
      console.error('Failed to persist URL keyword:', error);
    }
  };

  const handleRemoveUrlKeyword = async (keyword: string) => {
    // Don't allow removal when Quick Block is active
    if (isActive) {
      toast({
        title: t('common.warning'),
        description: t('toasts.cannotRemoveActive'),
        variant: 'warning',
      });
      return;
    }

    const newUrlKeywords = selectedUrlKeywords.filter((k) => k !== keyword);
    setSelectedUrlKeywords(newUrlKeywords);

    // Persist immediately to storage
    try {
      await updateQuickBlockItems(selectedDomains, newUrlKeywords, selectedContentKeywords);
    } catch (error) {
      console.error('Failed to persist URL keyword removal:', error);
    }
  };

  const handleAddContentKeyword = async () => {
    const keyword = contentKeywordInput.trim();

    if (!keyword) {
      toast({
        title: t('common.warning'),
        description: t('toasts.invalidInput'),
        variant: 'warning',
      });
      return;
    }

    if (selectedContentKeywords.includes(keyword)) {
      toast({
        title: t('common.warning'),
        description: t('toasts.alreadyExists'),
        variant: 'warning',
      });
      return;
    }

    const newContentKeywords = [...selectedContentKeywords, keyword];
    setSelectedContentKeywords(newContentKeywords);
    setContentKeywordInput('');

    // Persist immediately to storage
    try {
      await updateQuickBlockItems(selectedDomains, selectedUrlKeywords, newContentKeywords);
    } catch (error) {
      console.error('Failed to persist content keyword:', error);
    }
  };

  const handleRemoveContentKeyword = async (keyword: string) => {
    // Don't allow removal when Quick Block is active
    if (isActive) {
      toast({
        title: t('common.warning'),
        description: t('toasts.cannotRemoveActive'),
        variant: 'warning',
      });
      return;
    }

    const newContentKeywords = selectedContentKeywords.filter((k) => k !== keyword);
    setSelectedContentKeywords(newContentKeywords);

    // Persist immediately to storage
    try {
      await updateQuickBlockItems(selectedDomains, selectedUrlKeywords, newContentKeywords);
    } catch (error) {
      console.error('Failed to persist content keyword removal:', error);
    }
  };

  // ==================== SESSION HANDLERS ====================

  const handleQuickStart = async (durationMs: number | null) => {
    if (!hasConfiguredItems) {
      toast({
        title: t('common.warning'),
        description: t('toasts.noItemsConfigured'),
        variant: 'warning',
      });
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
      await startQuickBlockSession(
        durationMs,
        selectedDomains,
        selectedUrlKeywords,
        selectedContentKeywords
      );
      await loadQuickBlockSession();
      setShowCustomTimeDialog(false);
      setShowLockModeWarning(false);

      if (durationMs === null) {
        toast({
          title: t('popup.quickBlock.title'),
          description: t('toasts.quickBlockStartedIndefinite'),
          variant: 'success',
        });
      } else {
        toast({
          title: t('popup.quickBlock.title'),
          description: t('toasts.quickBlockStarted', { duration: formatDuration(durationMs) }),
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Failed to start Quick Block:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('errors.generic'),
        variant: 'destructive',
      });
    }
  };

  const handleStopSession = () => {
    if (lockState?.isLocked) {
      toast({
        title: t('common.warning'),
        description: t('toasts.settingsLocked'),
        variant: 'warning',
      });
      return;
    }

    setShowStopConfirmDialog(true);
  };

  const performStopSession = async () => {
    try {
      await endQuickBlockSession();
      await loadQuickBlockSession();
      setShowStopConfirmDialog(false);
      toast({
        title: t('popup.quickBlock.title'),
        description: t('toasts.quickBlockStopped'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to stop Quick Block:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('errors.generic'),
        variant: 'destructive',
      });
    }
  };

  const handleExtendClick = () => {
    if (endTime === null) {
      toast({
        title: t('common.warning'),
        description: t('toasts.cannotExtend'),
        variant: 'warning',
      });
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
      toast({
        title: t('options.general.quickBlock.dialogs.extend'),
        description: t('toasts.sessionExtended', { duration: formatDuration(additionalMs) }),
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to extend Quick Block:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('errors.generic'),
        variant: 'destructive',
      });
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

  if (isActive) {
    // Active state - show timer and session controls
    return (
      <>
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('popup.quickBlock.title')}
            </CardTitle>
            <CardDescription>{t('options.general.quickBlock.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timer Display */}
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-amber-500 bg-amber-50 p-8 text-center dark:bg-amber-950">
              <Clock className="mb-3 h-12 w-12 text-amber-600 dark:text-amber-400" />
              <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                {t('popup.quickBlock.active')}
              </p>
              {remainingTime === -1 ? (
                <>
                  <div className="mb-2 text-4xl font-bold text-amber-900 dark:text-amber-100">
                    {t('popup.quickBlock.noTimeLimit')}
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t('popup.quickBlock.untilManuallyStopped')}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-2 text-4xl font-bold text-amber-900 dark:text-amber-100">
                    {formatDuration(remainingTime)}
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t('options.general.quickBlock.endsAt', { time: formatEndTime() })}
                  </p>
                </>
              )}
            </div>

            {/* Configuration Section - Can add items during active session */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  {t('options.general.quickBlock.currentlyBlocking')}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {t('options.general.quickBlock.canAddDuringSession')}
                </span>
              </div>
              <Tabs defaultValue="domains" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="domains" className="gap-2">
                    <Globe className="h-4 w-4" />
                    {t('options.general.quickBlock.tabs.domains')}
                  </TabsTrigger>
                  <TabsTrigger value="url-keywords" className="gap-2">
                    <Link className="h-4 w-4" />
                    {t('options.general.quickBlock.tabs.urlKeywords')}
                  </TabsTrigger>
                  <TabsTrigger value="content-keywords" className="gap-2">
                    <FileText className="h-4 w-4" />
                    {t('options.general.quickBlock.tabs.contentKeywords')}
                  </TabsTrigger>
                </TabsList>

                {/* Domains Tab */}
                <TabsContent value="domains" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('options.general.quickBlock.domains.placeholder')}
                        value={domainInput}
                        onChange={(e) => {
                          setDomainInput(e.target.value);
                          setDomainInputError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddDomain();
                        }}
                        className={cn('flex-1', domainInputError && 'border-destructive')}
                      />
                      <Button onClick={handleAddDomain} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {domainInputError && (
                      <p className="text-xs text-destructive">⚠ {domainInputError}</p>
                    )}
                    {!domainInputError && (
                      <p className="text-xs text-muted-foreground">
                        {t('options.general.quickBlock.canAddDuringSession')}
                      </p>
                    )}
                  </div>

                  {selectedDomains.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {t('options.general.quickBlock.domains.empty')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedDomains.map((domain) => (
                        <span
                          key={domain}
                          className="rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* URL Keywords Tab */}
                <TabsContent value="url-keywords" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('options.general.quickBlock.urlKeywords.placeholder')}
                        value={urlKeywordInput}
                        onChange={(e) => setUrlKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddUrlKeyword();
                        }}
                        className="flex-1"
                      />
                      <Button onClick={handleAddUrlKeyword} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('options.general.quickBlock.canAddDuringSession')}
                    </p>
                  </div>

                  {selectedUrlKeywords.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {t('options.general.quickBlock.urlKeywords.empty')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedUrlKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Content Keywords Tab */}
                <TabsContent value="content-keywords" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('options.general.quickBlock.contentKeywords.placeholder')}
                        value={contentKeywordInput}
                        onChange={(e) => setContentKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddContentKeyword();
                        }}
                        className="flex-1"
                      />
                      <Button onClick={handleAddContentKeyword} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('options.general.quickBlock.canAddDuringSession')}
                    </p>
                  </div>

                  {selectedContentKeywords.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {t('options.general.quickBlock.contentKeywords.empty')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedContentKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {endTime !== null && (
                <Button onClick={handleExtendClick} variant="outline" className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('options.general.quickBlock.buttons.extendTime')}
                </Button>
              )}
              <Button
                onClick={handleStopSession}
                variant="destructive"
                className="flex-1"
                disabled={lockState?.isLocked}
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                {t('options.general.quickBlock.buttons.stopSession')}
              </Button>
            </div>

            {endTime !== null ? (
              <p className="text-xs text-muted-foreground">
                {t('options.general.quickBlock.durations.chooseOrNoLimit')}
                {lockState?.isLocked && ' (Lock Mode active)'}.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {lockState?.isLocked
                  ? t('options.general.quickBlock.untilStopped')
                  : t('options.general.quickBlock.untilStopped')}
                .
              </p>
            )}
          </CardContent>
        </Card>

        {/* Extend Dialog */}
        <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('options.general.quickBlock.dialogs.extendTitle')}</DialogTitle>
              <DialogDescription>
                {t('options.general.quickBlock.dialogs.extendDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('options.general.quickBlock.dialogs.addTime')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={extendDuration === '25min' ? 'default' : 'outline'}
                    onClick={() => setExtendDuration('25min')}
                    className="flex-1"
                  >
                    {t('options.general.quickBlock.durations.25min')}
                  </Button>
                  <Button
                    variant={extendDuration === '1hr' ? 'default' : 'outline'}
                    onClick={() => setExtendDuration('1hr')}
                    className="flex-1"
                  >
                    {t('options.general.quickBlock.durations.1hr')}
                  </Button>
                  <Button
                    variant={extendDuration === '24hrs' ? 'default' : 'outline'}
                    onClick={() => setExtendDuration('24hrs')}
                    className="flex-1"
                  >
                    {t('options.general.quickBlock.durations.24hrs')}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleExtendSession}>
                <Plus className="mr-2 h-4 w-4" />
                {t('options.general.quickBlock.dialogs.extend')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stop Confirmation Dialog */}
        <Dialog open={showStopConfirmDialog} onOpenChange={setShowStopConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('options.general.quickBlock.dialogs.stopTitle')}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                {t('options.general.quickBlock.dialogs.stopDescription')}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStopConfirmDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={performStopSession}>
                {t('options.general.quickBlock.dialogs.stopButton')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Inactive state - show configuration and start controls
  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('popup.quickBlock.title')}
          </CardTitle>
          <CardDescription>{t('options.general.quickBlock.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Section */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">
              {t('options.general.quickBlock.configureRules')}
            </Label>
            <Tabs defaultValue="domains" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="domains" className="gap-2">
                  <Globe className="h-4 w-4" />
                  {t('options.general.quickBlock.tabs.domains')}
                </TabsTrigger>
                <TabsTrigger value="url-keywords" className="gap-2">
                  <Link className="h-4 w-4" />
                  {t('options.general.quickBlock.tabs.urlKeywords')}
                </TabsTrigger>
                <TabsTrigger value="content-keywords" className="gap-2">
                  <FileText className="h-4 w-4" />
                  {t('options.general.quickBlock.tabs.contentKeywords')}
                </TabsTrigger>
              </TabsList>

              {/* Domains Tab */}
              <TabsContent value="domains" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('options.general.quickBlock.domains.placeholder')}
                      value={domainInput}
                      onChange={(e) => {
                        setDomainInput(e.target.value);
                        setDomainInputError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddDomain();
                      }}
                      className={cn('flex-1', domainInputError && 'border-destructive')}
                    />
                    <Button onClick={handleAddDomain} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {domainInputError && (
                    <p className="text-xs text-destructive">⚠ {domainInputError}</p>
                  )}
                  {!domainInputError && (
                    <p className="text-xs text-muted-foreground">
                      {t('options.general.quickBlock.domains.hint')}
                    </p>
                  )}
                </div>

                {selectedDomains.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {t('options.general.quickBlock.domains.empty')}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedDomains.map((domain) => (
                      <span
                        key={domain}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() => handleRemoveDomain(domain)}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* URL Keywords Tab */}
              <TabsContent value="url-keywords" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('options.general.quickBlock.urlKeywords.placeholder')}
                      value={urlKeywordInput}
                      onChange={(e) => setUrlKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddUrlKeyword();
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleAddUrlKeyword} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('options.general.quickBlock.urlKeywords.hint')}
                  </p>
                </div>

                {selectedUrlKeywords.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {t('options.general.quickBlock.urlKeywords.empty')}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedUrlKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveUrlKeyword(keyword)}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Content Keywords Tab */}
              <TabsContent value="content-keywords" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('options.general.quickBlock.contentKeywords.placeholder')}
                      value={contentKeywordInput}
                      onChange={(e) => setContentKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddContentKeyword();
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleAddContentKeyword} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('options.general.quickBlock.contentKeywords.hint')}
                  </p>
                </div>

                {selectedContentKeywords.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {t('options.general.quickBlock.contentKeywords.empty')}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedContentKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveContentKeyword(keyword)}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Separator */}
          <Separator />

          {/* Action Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {t('options.general.quickBlock.startQuickBlock')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {hasConfiguredItems
                  ? t('options.general.quickBlock.durations.chooseOrNoLimit')
                  : t('options.general.quickBlock.durations.configureToStart')}
              </p>
            </div>

            {/* Preset Duration Buttons */}
            <div className="grid w-full grid-cols-5 gap-2">
              <Button
                variant="outline"
                onClick={() => handleQuickStart(parseDurationPreset('25min'))}
                disabled={!hasConfiguredItems}
                className="w-full"
              >
                {t('options.general.quickBlock.durations.25min')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStart(parseDurationPreset('1hr'))}
                disabled={!hasConfiguredItems}
                className="w-full"
              >
                {t('options.general.quickBlock.durations.1hr')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStart(parseDurationPreset('8hrs'))}
                disabled={!hasConfiguredItems}
                className="w-full"
              >
                {t('options.general.quickBlock.durations.8hrs')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStart(parseDurationPreset('24hrs'))}
                disabled={!hasConfiguredItems}
                className="w-full"
              >
                {t('options.general.quickBlock.durations.24hrs')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCustomTimeDialog(true)}
                disabled={!hasConfiguredItems}
                className="w-full aspect-square p-0"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>

            {/* Indefinite Start Button - Centered and Smaller */}
            <div className="flex justify-center">
              <Button
                onClick={() => handleQuickStart(null)}
                disabled={!hasConfiguredItems}
                size="lg"
                className="w-1/4"
              >
                <Play className="mr-2 h-4 w-4" />
                {t('options.general.quickBlock.durations.indefinite')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Time Dialog */}
      <Dialog open={showCustomTimeDialog} onOpenChange={setShowCustomTimeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('options.general.quickBlock.dialogs.customTitle')}</DialogTitle>
            <DialogDescription>
              {t('options.general.quickBlock.dialogs.customDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  min="0"
                  className="text-center"
                />
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  {t('options.general.quickBlock.dialogs.hoursLabel')}
                </p>
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="5"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  min="0"
                  max="59"
                  className="text-center"
                />
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  {t('options.general.quickBlock.dialogs.minutesLabel')}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomTimeDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={async () => {
                const hours = parseInt(customHours, 10) || 0;
                const minutes = parseInt(customMinutes, 10) || 0;
                const totalMinutes = hours * 60 + minutes;

                if (totalMinutes <= 0) {
                  toast({
                    title: t('toasts.invalidDuration'),
                    description: t('toasts.invalidDurationMessage'),
                    variant: 'warning',
                  });
                  return;
                }

                const durationMs = totalMinutes * 60 * 1000;
                await handleQuickStart(durationMs);
              }}
              disabled={
                (parseInt(customHours, 10) || 0) === 0 && (parseInt(customMinutes, 10) || 0) === 0
              }
            >
              <Play className="mr-2 h-4 w-4" />
              {t('options.general.quickBlock.dialogs.start')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Mode Warning Dialog */}
      <Dialog open={showLockModeWarning} onOpenChange={setShowLockModeWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('options.general.quickBlock.dialogs.lockWarningTitle')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {pendingStartDuration === null
                ? t('options.general.quickBlock.dialogs.lockWarningDescriptionIndefinite')
                : t('options.general.quickBlock.dialogs.lockWarningDescription')}
            </p>
            <p className="mt-2 text-sm font-semibold">
              {t('options.general.quickBlock.dialogs.lockWarningQuestion')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockModeWarning(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await performStartSession(pendingStartDuration);
                setPendingStartDuration(null);
              }}
            >
              {t('options.general.quickBlock.dialogs.startAnyway')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
