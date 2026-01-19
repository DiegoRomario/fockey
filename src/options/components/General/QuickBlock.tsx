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

interface QuickBlockProps {
  lockState: LockModeState | null;
}

export const QuickBlock: React.FC<QuickBlockProps> = ({ lockState }) => {
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
          title: 'Quick Block Ended',
          description: 'Your focus session has expired',
          variant: 'success',
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, endTime, toast]);

  // ==================== CONFIGURATION HANDLERS ====================

  const handleAddDomain = async () => {
    const domain = normalizeDomain(domainInput.trim());

    if (!domain) {
      setDomainInputError('Please enter a domain');
      return;
    }

    if (!isValidDomainPattern(domain)) {
      setDomainInputError(
        'Please enter a valid domain (e.g., example.com or *.example.com for wildcards)'
      );
      return;
    }

    if (selectedDomains.includes(domain)) {
      setDomainInputError('This domain is already in the list');
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
        title: 'Cannot Remove',
        description: 'Items cannot be removed while Quick Block is active',
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
        title: 'Invalid Input',
        description: 'Please enter a URL keyword',
        variant: 'warning',
      });
      return;
    }

    if (selectedUrlKeywords.includes(keyword)) {
      toast({
        title: 'Already Exists',
        description: 'This keyword is already in the list',
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
        title: 'Cannot Remove',
        description: 'Items cannot be removed while Quick Block is active',
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
        title: 'Invalid Input',
        description: 'Please enter a content keyword',
        variant: 'warning',
      });
      return;
    }

    if (selectedContentKeywords.includes(keyword)) {
      toast({
        title: 'Already Exists',
        description: 'This keyword is already in the list',
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
        title: 'Cannot Remove',
        description: 'Items cannot be removed while Quick Block is active',
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
        title: 'No Items Configured',
        description: 'Please add at least one domain, URL keyword, or content keyword',
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
          title: 'Quick Block Started',
          description: 'Focus session started with no time limit',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Quick Block Started',
          description: `Focus session started for ${formatDuration(durationMs)}`,
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Failed to start Quick Block:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start Quick Block',
        variant: 'destructive',
      });
    }
  };

  const handleStopSession = () => {
    if (lockState?.isLocked) {
      toast({
        title: 'Settings Locked',
        description: 'Cannot stop Quick Block while Lock Mode is active',
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
        title: 'Quick Block Stopped',
        description: 'Focus session has been stopped',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to stop Quick Block:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to stop session',
        variant: 'destructive',
      });
    }
  };

  const handleExtendClick = () => {
    if (endTime === null) {
      toast({
        title: 'Cannot Extend',
        description: 'This session has no time limit',
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
        title: 'Session Extended',
        description: `Added ${formatDuration(additionalMs)} to your focus session`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to extend Quick Block:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to extend session',
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
              Quick Block
            </CardTitle>
            <CardDescription>
              Fast, temporary blocking for immediate focus sessions. Designed to work with Lock
              Mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timer Display */}
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-amber-500 bg-amber-50 p-8 text-center dark:bg-amber-950">
              <Clock className="mb-3 h-12 w-12 text-amber-600 dark:text-amber-400" />
              <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                Quick Block Active
              </p>
              {remainingTime === -1 ? (
                <>
                  <div className="mb-2 text-4xl font-bold text-amber-900 dark:text-amber-100">
                    No Time Limit
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Session will continue until manually stopped
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-2 text-4xl font-bold text-amber-900 dark:text-amber-100">
                    {formatDuration(remainingTime)}
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Ends at {formatEndTime()}
                  </p>
                </>
              )}
            </div>

            {/* Configuration Section - Can add items during active session */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Currently Blocking</Label>
                <span className="text-xs text-muted-foreground">
                  You can add new items during an active session
                </span>
              </div>
              <Tabs defaultValue="domains" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="domains" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Domains
                  </TabsTrigger>
                  <TabsTrigger value="url-keywords" className="gap-2">
                    <Link className="h-4 w-4" />
                    URL Keywords
                  </TabsTrigger>
                  <TabsTrigger value="content-keywords" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Content Keywords
                  </TabsTrigger>
                </TabsList>

                {/* Domains Tab */}
                <TabsContent value="domains" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="example.com or *.example.com"
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
                        Add more domains to block during this session
                      </p>
                    )}
                  </div>

                  {selectedDomains.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">No domains configured</p>
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
                        placeholder="watch?v= or /shorts/ or playlist"
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
                      Add more URL keywords to block during this session
                    </p>
                  </div>

                  {selectedUrlKeywords.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">No URL keywords configured</p>
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
                        placeholder="trending or celebrity or gossip"
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
                      Add more content keywords to block during this session
                    </p>
                  </div>

                  {selectedContentKeywords.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        No content keywords configured
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
                  Extend Time
                </Button>
              )}
              <Button
                onClick={handleStopSession}
                variant="destructive"
                className="flex-1"
                disabled={lockState?.isLocked}
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                Stop Session
              </Button>
            </div>

            {endTime !== null ? (
              <p className="text-xs text-muted-foreground">
                Session will end automatically when the timer reaches zero
                {lockState?.isLocked && ' (Lock Mode active)'}.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {lockState?.isLocked
                  ? 'Session cannot be stopped while Lock Mode is active'
                  : 'Session will continue until you stop it manually'}
                .
              </p>
            )}
          </CardContent>
        </Card>

        {/* Extend Dialog */}
        <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Extend Quick Block</DialogTitle>
              <DialogDescription>Add more time to your focus session</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add Time</Label>
                <div className="flex gap-2">
                  <Button
                    variant={extendDuration === '25min' ? 'default' : 'outline'}
                    onClick={() => setExtendDuration('25min')}
                    className="flex-1"
                  >
                    25 min
                  </Button>
                  <Button
                    variant={extendDuration === '1hr' ? 'default' : 'outline'}
                    onClick={() => setExtendDuration('1hr')}
                    className="flex-1"
                  >
                    1 hr
                  </Button>
                  <Button
                    variant={extendDuration === '24hrs' ? 'default' : 'outline'}
                    onClick={() => setExtendDuration('24hrs')}
                    className="flex-1"
                  >
                    24 hrs
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExtendSession}>
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
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to stop this focus session? Your configured items will be
                saved for future sessions.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStopConfirmDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={performStopSession}>
                Stop Session
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
            Quick Block
          </CardTitle>
          <CardDescription>
            Fast, temporary blocking for immediate focus sessions. Designed to work with Lock Mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Section */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Configure Blocking Rules</Label>
            <Tabs defaultValue="domains" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="domains" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Domains
                </TabsTrigger>
                <TabsTrigger value="url-keywords" className="gap-2">
                  <Link className="h-4 w-4" />
                  URL Keywords
                </TabsTrigger>
                <TabsTrigger value="content-keywords" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Content Keywords
                </TabsTrigger>
              </TabsList>

              {/* Domains Tab */}
              <TabsContent value="domains" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="example.com or *.example.com"
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
                      Examples: reddit.com, twitter.com, *.facebook.com
                    </p>
                  )}
                </div>

                {selectedDomains.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">No domains configured yet</p>
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
                      placeholder="watch?v= or /shorts/ or playlist"
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
                    Block any URL containing this keyword (case-insensitive)
                  </p>
                </div>

                {selectedUrlKeywords.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">No URL keywords configured yet</p>
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
                      placeholder="trending or celebrity or gossip"
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
                    Block elements containing this keyword.
                  </p>
                </div>

                {selectedContentKeywords.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      No content keywords configured yet
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
              <Label className="text-sm font-semibold">Start Quick Block</Label>
              <p className="text-xs text-muted-foreground">
                {hasConfiguredItems
                  ? 'Choose a duration or start with no time limit'
                  : 'Configure at least one blocking rule to start'}
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
                25 min
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStart(parseDurationPreset('1hr'))}
                disabled={!hasConfiguredItems}
                className="w-full"
              >
                1 hr
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStart(parseDurationPreset('8hrs'))}
                disabled={!hasConfiguredItems}
                className="w-full"
              >
                8 hrs
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStart(parseDurationPreset('24hrs'))}
                disabled={!hasConfiguredItems}
                className="w-full"
              >
                24 hrs
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
                Start Quick Block
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Time Dialog */}
      <Dialog open={showCustomTimeDialog} onOpenChange={setShowCustomTimeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Custom Duration</DialogTitle>
            <DialogDescription>Set a custom duration for Quick Block</DialogDescription>
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
                <p className="mt-1 text-center text-xs text-muted-foreground">hours</p>
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
                <p className="mt-1 text-center text-xs text-muted-foreground">minutes</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomTimeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const hours = parseInt(customHours, 10) || 0;
                const minutes = parseInt(customMinutes, 10) || 0;
                const totalMinutes = hours * 60 + minutes;

                if (totalMinutes <= 0) {
                  toast({
                    title: 'Invalid Duration',
                    description: 'Please enter a valid time greater than 0',
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
              Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Mode Warning Dialog */}
      <Dialog open={showLockModeWarning} onOpenChange={setShowLockModeWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Quick Block with Lock Mode Active</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Lock Mode is currently active. If you start Quick Block now,
              {pendingStartDuration === null
                ? ' you will not be able to stop it until Lock Mode expires.'
                : ' it will run until the timer expires, and you will not be able to stop it manually while Lock Mode is active.'}
            </p>
            <p className="mt-2 text-sm font-semibold">Do you want to proceed?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockModeWarning(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await performStartSession(pendingStartDuration);
                setPendingStartDuration(null);
              }}
            >
              Start Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
