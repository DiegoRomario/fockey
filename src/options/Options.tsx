import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2, Youtube, Settings, Lock, Database, Info, X, Menu } from 'lucide-react';
import { SettingToggle } from './components/SettingToggle';
import { ImportExportButtons } from './components/ImportExportButtons';
import { ResetButton } from './components/ResetButton';
import { LockModeSection } from './components/LockModeSection';
import { Schedules } from './components/Schedules';
import { QuickBlock } from './components/General';
import {
  getSettings,
  updateSettings,
  resetToDefaults,
  addBlockedChannel,
  removeBlockedChannel,
  getLockModeStatus,
} from '@/shared/storage/settings-manager';
import { ExtensionSettings, BlockedChannel, LockModeState } from '@/shared/types/settings';
import { normalizeChannelInput } from '@/shared/utils/channel-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { initializeTheme } from '@/shared/utils/theme-utils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type PrimaryTab = 'youtube' | 'general' | 'lockMode' | 'manageSettings' | 'about';

interface SidebarItem {
  id: PrimaryTab;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'general', label: 'General', icon: Settings },
  { id: 'lockMode', label: 'Lock Mode', icon: Lock },
  { id: 'manageSettings', label: 'Manage Settings', icon: Database },
  { id: 'about', label: 'About', icon: Info },
];

const Options: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [blockChannelInput, setBlockChannelInput] = useState('');
  const [isBlockingChannel, setIsBlockingChannel] = useState(false);
  const [lockState, setLockState] = useState<LockModeState | null>(null);
  const [activeTab, setActiveTab] = useState<PrimaryTab>('youtube');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // Load settings on mount
  useEffect(() => {
    getSettings()
      .then((loadedSettings) => {
        setSettings(loadedSettings);
      })
      .catch((error) => {
        console.error('Failed to load settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings. Please refresh the page.',
          variant: 'destructive',
        });
      });
  }, [toast]);

  // Handle URL parameters for context-aware navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const sectionParam = urlParams.get('section');

    // Set active tab if specified
    if (
      tabParam &&
      ['youtube', 'general', 'lockMode', 'manageSettings', 'about'].includes(tabParam)
    ) {
      setActiveTab(tabParam as PrimaryTab);
    }

    // Handle section scrolling/focusing after a short delay to ensure content is rendered
    if (sectionParam) {
      setTimeout(() => {
        const sectionElement = document.getElementById(sectionParam);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Optionally add a highlight effect
          sectionElement.style.outline = '2px solid hsl(var(--primary))';
          setTimeout(() => {
            sectionElement.style.outline = '';
          }, 2000);
        }
      }, 300);
    }
  }, []);

  // Load lock state on mount and listen for changes
  useEffect(() => {
    // Load initial lock state
    getLockModeStatus()
      .then((loadedLockState) => {
        setLockState(loadedLockState);
      })
      .catch((error) => {
        console.error('Failed to load lock state:', error);
      });

    // Listen for lock status changes from service worker
    const handleMessage = (message: { type: string; lockState?: LockModeState }) => {
      if (message.type === 'LOCK_STATUS_CHANGED' && message.lockState) {
        setLockState(message.lockState);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Handle setting changes with auto-save
  const handleSettingChange = async (path: string[], value: boolean): Promise<void> => {
    if (!settings) return;

    // Update local state immediately for responsive UI
    const updatedSettings = { ...settings };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = updatedSettings;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setSettings(updatedSettings);

    // Show saving indicator
    setSaveStatus('saving');

    try {
      // Build partial update object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const partial: any = {};
      let partialCurrent = partial;
      for (let i = 0; i < path.length - 1; i++) {
        partialCurrent[path[i]] = {};
        partialCurrent = partialCurrent[path[i]];
      }
      partialCurrent[path[path.length - 1]] = value;

      // Save to storage (already debounced in updateSettings)
      await updateSettings(partial);

      // Show saved indicator briefly
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle reset to defaults
  const handleReset = async () => {
    try {
      setSaveStatus('saving');
      const defaultSettings = await resetToDefaults();
      setSettings(defaultSettings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      toast({
        title: 'Success',
        description: 'All settings have been reset to defaults.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setSaveStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to reset settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle import - reload settings from storage after import
  const handleImport = async () => {
    try {
      setSaveStatus('saving');
      // Reload settings from storage (import function already saved them)
      const freshSettings = await getSettings();
      setSettings(freshSettings);
      setSaveStatus('saved');

      // Reload theme to apply imported theme preference
      await initializeTheme();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to import settings:', error);
      setSaveStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to import settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle lock mode activation
  const handleActivateLockMode = async (durationMs: number): Promise<void> => {
    try {
      await chrome.runtime.sendMessage({
        type: 'ACTIVATE_LOCK_MODE',
        durationMs,
      });
      // Lock state will be updated via LOCK_STATUS_CHANGED message
    } catch (error) {
      console.error('Failed to activate lock mode:', error);
      throw error;
    }
  };

  // Handle lock mode extension
  const handleExtendLockMode = async (additionalMs: number): Promise<void> => {
    try {
      await chrome.runtime.sendMessage({
        type: 'EXTEND_LOCK_MODE',
        additionalMs,
      });
      // Lock state will be updated via LOCK_STATUS_CHANGED message
    } catch (error) {
      console.error('Failed to extend lock mode:', error);
      throw error;
    }
  };

  // Handle block channel
  const handleBlockChannelSubmit = async () => {
    if (!blockChannelInput.trim()) return;

    setIsBlockingChannel(true);
    try {
      const normalized = normalizeChannelInput(blockChannelInput);
      const newChannel: BlockedChannel = {
        id: normalized.id || normalized.name,
        handle: normalized.handle || normalized.name,
        name: normalized.name,
        blockedAt: Date.now(),
      };

      await addBlockedChannel(newChannel);

      // Reload settings to reflect changes
      const updatedSettings = await getSettings();
      setSettings(updatedSettings);

      setBlockChannelInput('');
      toast({
        title: 'Channel Blocked',
        description: `${newChannel.name} has been blocked.`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to block channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to block channel. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBlockingChannel(false);
    }
  };

  // Handle unblock channel
  const handleUnblockChannel = async (channelId: string, channelName: string) => {
    try {
      await removeBlockedChannel(channelId);

      // Reload settings to reflect changes
      const updatedSettings = await getSettings();
      setSettings(updatedSettings);

      toast({
        title: 'Channel Unblocked',
        description: `${channelName} has been unblocked.`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to unblock channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to unblock channel. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (!settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border/40 shadow-lg hover:bg-accent/50 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex">
        {/* Vertical Sidebar Navigation */}
        <aside
          className={cn(
            'w-64 min-h-screen bg-card border-r border-border/40 shadow-lg sticky top-0 flex flex-col',
            'lg:translate-x-0 transition-transform duration-300 ease-in-out',
            'fixed lg:relative z-40',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-border/40">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Fockey Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Distraction-free YouTube</p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!item.disabled) {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    'hover:bg-accent/50 active:scale-[0.98]',
                    isActive && 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90',
                    !isActive && 'text-muted-foreground hover:text-foreground',
                    item.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Save Status Indicator */}
          <div className="p-4 border-t border-border/40">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving changes...
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-500">
                <Check className="h-3 w-3" />
                All changes saved
              </div>
            )}
            {saveStatus === 'idle' && <div className="text-xs text-muted-foreground">Ready</div>}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 pt-16 lg:p-8 lg:pt-8 w-full max-w-6xl mx-auto">
          {/* YouTube Tab Content */}
          {activeTab === 'youtube' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6">
                <h2 className="text-2xl font-semibold mb-2">YouTube Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Customize your minimalist YouTube experience
                </p>
              </div>

              {/* YouTube Sub-Tabs (Horizontal) */}
              <Tabs defaultValue="elements" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="elements">Elements Settings</TabsTrigger>
                  <TabsTrigger value="blockedChannels">Blocked Channels</TabsTrigger>
                </TabsList>

                {/* Elements Settings Sub-Tab */}
                <TabsContent value="elements" className="space-y-4 animate-in fade-in duration-200">
                  <Accordion
                    type="multiple"
                    defaultValue={['globalNavigation', 'search', 'watch']}
                    className="w-full space-y-3"
                  >
                    {/* Global Navigation Elements */}
                    <AccordionItem
                      value="globalNavigation"
                      className="bg-card rounded-lg border border-border/40 shadow-sm px-8 overflow-hidden"
                    >
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
                        Global Navigation Elements
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-1 pt-2">
                          <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-md border border-border/20">
                            These settings apply to <strong>all YouTube pages</strong> (Home,
                            Search, Watch). Control persistent header and sidebar navigation
                            elements that appear consistently across all pages.
                          </p>

                          <SettingToggle
                            id="global-logo"
                            label="YouTube Logo"
                            description="Show the YouTube logo in the top-left corner"
                            checked={settings.youtube.globalNavigation.showLogo}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'globalNavigation', 'showLogo'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />

                          <SettingToggle
                            id="global-sidebar"
                            label="Left Sidebar"
                            description="Show the navigation sidebar and hamburger menu (unified component)"
                            checked={settings.youtube.globalNavigation.showSidebar}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'globalNavigation', 'showSidebar'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />

                          <SettingToggle
                            id="global-profile"
                            label="Profile Avatar"
                            description="Show your account profile picture"
                            checked={settings.youtube.globalNavigation.showProfile}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'globalNavigation', 'showProfile'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />

                          <SettingToggle
                            id="global-notifications"
                            label="Notifications Bell"
                            description="Show the notifications bell icon"
                            checked={settings.youtube.globalNavigation.showNotifications}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'globalNavigation', 'showNotifications'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />

                          <SettingToggle
                            id="global-hover-previews"
                            label="Hover Previews"
                            description="Enable video preview autoplay when hovering over thumbnails"
                            checked={settings.youtube.globalNavigation.enableHoverPreviews}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'globalNavigation', 'enableHoverPreviews'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />

                          <SettingToggle
                            id="global-enable-shorts"
                            label="Enable Shorts"
                            description="Enable YouTube Shorts globally across all pages"
                            checked={settings.youtube.globalNavigation.enableShorts}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'globalNavigation', 'enableShorts'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />

                          <SettingToggle
                            id="global-enable-posts"
                            label="Enable Posts"
                            description="Enable YouTube Posts globally across all pages"
                            checked={settings.youtube.globalNavigation.enablePosts}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'globalNavigation', 'enablePosts'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />

                          <SettingToggle
                            id="global-blur-thumbnails"
                            label="Blur Thumbnails"
                            description="Blur all video thumbnails across all YouTube pages"
                            checked={settings.youtube.globalNavigation.blurThumbnails}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'globalNavigation', 'blurThumbnails'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Search Page Settings */}
                    <AccordionItem
                      value="search"
                      className="bg-card rounded-lg border border-border/40 shadow-sm px-8 overflow-hidden"
                    >
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
                        Search Page Settings
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-1 pt-2">
                          <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-md border border-border/20">
                            Control which content appears in YouTube search results. By default,
                            only long-form videos are shown. Use{' '}
                            <strong>Global Navigation Elements</strong> above to control header,
                            sidebar elements, Shorts, and Posts visibility.
                          </p>

                          <SettingToggle
                            id="search-mixes"
                            label="Show Mixes/Playlists"
                            description="Display mixes and playlists in search results"
                            checked={settings.youtube.searchPage.showMixes}
                            onChange={(checked) =>
                              handleSettingChange(['youtube', 'searchPage', 'showMixes'], checked)
                            }
                            disabled={lockState?.isLocked === true}
                          />
                          <SettingToggle
                            id="search-suggestions"
                            label="Enable Search Suggestions"
                            description="Enable search suggestions (autocomplete dropdown)"
                            checked={settings.youtube.searchPage.enableSearchSuggestions}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'searchPage', 'enableSearchSuggestions'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Watch Page Settings */}
                    <AccordionItem
                      value="watch"
                      className="bg-card rounded-lg border border-border/40 shadow-sm px-8 overflow-hidden"
                    >
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
                        Watch Page Settings
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-1 pt-2">
                          <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-md border border-border/20">
                            Control which buttons and elements are visible while watching videos.
                            Video player controls are always preserved.
                          </p>

                          <SettingToggle
                            id="watch-like-dislike"
                            label="Like/Dislike Buttons"
                            description="Thumbs up and thumbs down buttons"
                            checked={settings.youtube.watchPage.showLikeDislike}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'watchPage', 'showLikeDislike'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />
                          <SettingToggle
                            id="watch-subscription-actions"
                            label="Subscription Actions"
                            description="Subscribe, Join, Notifications, See Perks"
                            checked={settings.youtube.watchPage.showSubscriptionActions}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'watchPage', 'showSubscriptionActions'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />
                          <SettingToggle
                            id="watch-share"
                            label="Share Button"
                            description="Share video with others"
                            checked={settings.youtube.watchPage.showShare}
                            onChange={(checked) =>
                              handleSettingChange(['youtube', 'watchPage', 'showShare'], checked)
                            }
                            disabled={lockState?.isLocked === true}
                          />
                          <SettingToggle
                            id="watch-comments"
                            label="Comments Section"
                            description="User comments and discussion area"
                            checked={settings.youtube.watchPage.showComments}
                            onChange={(checked) =>
                              handleSettingChange(['youtube', 'watchPage', 'showComments'], checked)
                            }
                            disabled={lockState?.isLocked === true}
                          />
                          <SettingToggle
                            id="watch-related"
                            label="Related Videos Sidebar"
                            description="Recommended and related videos"
                            checked={settings.youtube.watchPage.showRelated}
                            onChange={(checked) =>
                              handleSettingChange(['youtube', 'watchPage', 'showRelated'], checked)
                            }
                            disabled={lockState?.isLocked === true}
                          />
                          <SettingToggle
                            id="watch-playlists"
                            label="Playlists Sidebar"
                            description="When watching a video from a playlist"
                            checked={settings.youtube.watchPage.showPlaylists}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'watchPage', 'showPlaylists'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />
                          <SettingToggle
                            id="watch-recommended-video"
                            label="Recommended Video Cards"
                            description="Creator-placed video recommendations during playback"
                            checked={settings.youtube.watchPage.showRecommendedVideo}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'watchPage', 'showRecommendedVideo'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />
                          <SettingToggle
                            id="watch-more-actions"
                            label="More Actions"
                            description="Save, Download, Clip, Thanks, Report, Ask AI, Overflow Menu"
                            checked={settings.youtube.watchPage.showMoreActions}
                            onChange={(checked) =>
                              handleSettingChange(
                                ['youtube', 'watchPage', 'showMoreActions'],
                                checked
                              )
                            }
                            disabled={lockState?.isLocked === true}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                {/* Blocked Channels Sub-Tab */}
                <TabsContent
                  value="blockedChannels"
                  className="space-y-4 animate-in fade-in duration-200"
                >
                  <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6 space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Blocked YouTube Channels</h2>
                      <p className="text-sm text-muted-foreground">
                        Block specific YouTube channels to prevent access to their content across
                        all pages. You can block by channel handle (@username), channel URL, or
                        channel name.
                      </p>
                    </div>

                    {/* Block Channel Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter channel handle, URL, or name"
                        value={blockChannelInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBlockChannelInput(e.target.value)
                        }
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            handleBlockChannelSubmit();
                          }
                        }}
                        className="flex-1 shadow-sm"
                      />
                      <Button
                        onClick={handleBlockChannelSubmit}
                        disabled={!blockChannelInput.trim() || isBlockingChannel}
                        variant="destructive"
                        className="shadow-sm"
                      >
                        {isBlockingChannel ? 'Blocking...' : 'Block'}
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Blocked Channels List */}
                    {settings.youtube.blockedChannels.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <Youtube className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          No blocked channels yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Add a channel above to get started
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">
                          Blocked Channels ({settings.youtube.blockedChannels.length})
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {settings.youtube.blockedChannels.map((channel) => (
                            <div
                              key={channel.id}
                              className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{channel.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  @{channel.handle}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Blocked on {new Date(channel.blockedAt).toLocaleDateString()}
                                </div>
                              </div>
                              <Button
                                onClick={() => handleUnblockChannel(channel.id, channel.name)}
                                variant="ghost"
                                size="sm"
                                className="shrink-0 ml-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                disabled={lockState?.isLocked === true}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Unblock
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Lock Mode Tab Content */}
          {activeTab === 'lockMode' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6">
                <h2 className="text-2xl font-semibold mb-2">Lock Mode</h2>
                <p className="text-sm text-muted-foreground">
                  Prevent impulsive changes by locking your settings for a set period
                </p>
              </div>

              {lockState && (
                <LockModeSection
                  lockState={lockState}
                  onActivate={handleActivateLockMode}
                  onExtend={handleExtendLockMode}
                />
              )}
            </div>
          )}

          {/* Manage Settings Tab Content */}
          {activeTab === 'manageSettings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6">
                <h2 className="text-2xl font-semibold mb-2">Manage Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Import, export, or reset your extension settings
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Import & Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Save your settings to a file or load them from a previous export
                    </p>
                  </div>
                  <ImportExportButtons
                    onImport={handleImport}
                    onError={(message) =>
                      toast({ title: 'Error', description: message, variant: 'destructive' })
                    }
                    onSuccess={(message) =>
                      toast({ title: 'Success', description: message, variant: 'success' })
                    }
                    disabled={lockState?.isLocked === true}
                  />
                </div>

                <div className="bg-card rounded-xl shadow-sm border-2 border-destructive/20 p-6 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-destructive">
                      Reset to Defaults
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Restore all settings to their original default values. This action cannot be
                      undone.
                    </p>
                  </div>
                  <ResetButton onReset={handleReset} disabled={lockState?.isLocked === true} />
                </div>

                <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Appearance</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose between light and dark theme
                      </p>
                    </div>
                    <ThemeToggle variant="segmented" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* About Tab Content */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6">
                <h2 className="text-2xl font-semibold mb-2">About Fockey</h2>
                <p className="text-sm text-muted-foreground">
                  Minimalist, distraction-free YouTube experience
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Version</span>
                    <span className="text-sm text-muted-foreground font-mono">0.1.0</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl shadow-sm border border-primary/20 p-6">
                  <h3 className="font-semibold text-lg mb-3">What is Fockey?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Fockey is a productivity-focused Chrome extension designed to transform complex,
                    noisy websites into intent-driven, minimalistic experiences. The extension
                    allows you to remove cognitive distractions and interact with content only when
                    you explicitly choose to.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-xl shadow-sm border border-amber-500/20 p-6">
                  <h3 className="font-semibold text-lg mb-3">Core Philosophy</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">
                      Minimal by default. Everything else is opt-in.
                    </strong>
                    <br />
                    <br />
                    Fockey enforces a clean, distraction-free default experience while preserving
                    full user control through configurable settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General Tab Content - 24/7 Block List, Quick Block, and Schedules */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-2xl font-bold">General Blocking</h2>
                <p className="text-sm text-muted-foreground">
                  Block websites and content across the internet with permanent and temporary
                  blocking rules.
                </p>
              </div>

              {/* Quick Block */}
              <div id="quick-block">
                <QuickBlock lockState={lockState} />
              </div>

              {/* Schedules */}
              <div id="schedules">
                <h3 className="mb-4 text-xl font-semibold">Time-Based Schedules</h3>
                <Schedules lockState={lockState} />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

export default Options;
