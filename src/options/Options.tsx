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
import { Check, Loader2 } from 'lucide-react';
import { SettingToggle } from './components/SettingToggle';
import { ImportExportButtons } from './components/ImportExportButtons';
import { ResetButton } from './components/ResetButton';
import { getSettings, updateSettings, resetToDefaults } from '@/shared/storage/settings-manager';
import { ExtensionSettings } from '@/shared/types/settings';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const Options: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const { toast } = useToast();

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

  // Handle import
  const handleImport = async (importedSettings: ExtensionSettings) => {
    try {
      setSaveStatus('saving');
      await updateSettings(importedSettings);
      setSettings(importedSettings);
      setSaveStatus('saved');
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fockey Settings</h1>
              <p className="text-muted-foreground mt-1">
                Configure your distraction-free YouTube experience
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                  <Check className="h-4 w-4" />
                  Saved
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <ImportExportButtons
              settings={settings}
              onImport={handleImport}
              onError={(message) =>
                toast({ title: 'Error', description: message, variant: 'destructive' })
              }
              onSuccess={(message) => toast({ title: 'Success', description: message })}
            />
            <ResetButton onReset={handleReset} />
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Module Tabs */}
        <Tabs defaultValue="youtube" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="twitter" disabled>
              Twitter (Soon)
            </TabsTrigger>
            <TabsTrigger value="reddit" disabled>
              Reddit (Soon)
            </TabsTrigger>
            <TabsTrigger value="other" disabled>
              Other (Soon)
            </TabsTrigger>
          </TabsList>

          {/* YouTube Module Settings */}
          <TabsContent value="youtube" className="space-y-6">
            <Accordion
              type="multiple"
              defaultValue={['globalNavigation', 'home', 'search', 'watch', 'creatorProfile']}
              className="w-full"
            >
              {/* Global Navigation Elements */}
              <AccordionItem value="globalNavigation">
                <AccordionTrigger className="text-lg font-semibold">
                  Global Navigation Elements
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      These settings apply to <strong>all YouTube pages</strong> (Home, Search,
                      Watch). Control persistent header and sidebar navigation elements that appear
                      consistently across all pages.
                    </p>

                    <SettingToggle
                      id="global-logo"
                      label="YouTube Logo"
                      description="Show the YouTube logo in the top-left corner"
                      checked={settings.youtube.globalNavigation.showLogo}
                      onChange={(checked) =>
                        handleSettingChange(['youtube', 'globalNavigation', 'showLogo'], checked)
                      }
                      tooltip="Applies to all YouTube pages"
                    />

                    <SettingToggle
                      id="global-sidebar"
                      label="Left Sidebar"
                      description="Show the navigation sidebar and hamburger menu (unified component)"
                      checked={settings.youtube.globalNavigation.showSidebar}
                      onChange={(checked) =>
                        handleSettingChange(['youtube', 'globalNavigation', 'showSidebar'], checked)
                      }
                      tooltip="Controls both sidebar and hamburger menu across all pages"
                    />

                    <SettingToggle
                      id="global-profile"
                      label="Profile Avatar"
                      description="Show your account profile picture"
                      checked={settings.youtube.globalNavigation.showProfile}
                      onChange={(checked) =>
                        handleSettingChange(['youtube', 'globalNavigation', 'showProfile'], checked)
                      }
                      tooltip="Applies to all YouTube pages"
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
                      tooltip="Applies to all YouTube pages"
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
                      tooltip="When disabled (default), hovering over thumbnails won't trigger autoplay previews"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Home Page Settings */}
              <AccordionItem value="home">
                <AccordionTrigger className="text-lg font-semibold">
                  Home Page Settings
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    <p className="text-sm text-muted-foreground">
                      No page-specific settings available yet. Use{' '}
                      <strong>Global Navigation Elements</strong> above to control navigation
                      elements on the Home page.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Search Page Settings */}
              <AccordionItem value="search">
                <AccordionTrigger className="text-lg font-semibold">
                  Search Page Settings
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Control which content appears in YouTube search results. By default, only
                      long-form videos are shown. Use <strong>Global Navigation Elements</strong>{' '}
                      above to control header and sidebar elements.
                    </p>

                    {/* Content Options */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Content Options</h4>
                      <SettingToggle
                        id="search-shorts"
                        label="Show Shorts"
                        description="Display YouTube Shorts in search results"
                        checked={settings.youtube.searchPage.showShorts}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'searchPage', 'showShorts'], checked)
                        }
                        tooltip="Short-form vertical videos (YouTube Shorts)"
                      />
                      <SettingToggle
                        id="search-community"
                        label="Show Community Posts"
                        description="Display community posts in search results"
                        checked={settings.youtube.searchPage.showCommunityPosts}
                        onChange={(checked) =>
                          handleSettingChange(
                            ['youtube', 'searchPage', 'showCommunityPosts'],
                            checked
                          )
                        }
                        tooltip="Text, image, and poll posts from creators"
                      />
                      <SettingToggle
                        id="search-mixes"
                        label="Show Mixes/Playlists"
                        description="Display mixes and playlists in search results"
                        checked={settings.youtube.searchPage.showMixes}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'searchPage', 'showMixes'], checked)
                        }
                        tooltip="Auto-generated mixes and user-created playlists"
                      />
                      <SettingToggle
                        id="search-sponsored"
                        label="Show Sponsored Content"
                        description="Display sponsored/promoted content"
                        checked={settings.youtube.searchPage.showSponsored}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'searchPage', 'showSponsored'], checked)
                        }
                        tooltip="Paid promotional content in search results"
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Visual Adjustments */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Visual Adjustments</h4>
                      <SettingToggle
                        id="search-blur"
                        label="Blur Thumbnails"
                        description="Blur video thumbnails instead of showing them clearly"
                        checked={settings.youtube.searchPage.blurThumbnails}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'searchPage', 'blurThumbnails'], checked)
                        }
                        tooltip="Reduces visual stimulation while keeping structural awareness"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Watch Page Settings */}
              <AccordionItem value="watch">
                <AccordionTrigger className="text-lg font-semibold">
                  Watch Page Settings
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Control which buttons and elements are visible while watching videos. Video
                      player controls are always preserved.
                    </p>

                    {/* Engagement Buttons */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Engagement Buttons</h4>
                      <SettingToggle
                        id="watch-like-dislike"
                        label="Like/Dislike Buttons"
                        checked={settings.youtube.watchPage.showLikeDislike}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showLikeDislike'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-share"
                        label="Share Button"
                        checked={settings.youtube.watchPage.showShare}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showShare'], checked)
                        }
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
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Social & Discovery */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Social & Discovery</h4>
                      <SettingToggle
                        id="watch-comments"
                        label="Comments Section"
                        checked={settings.youtube.watchPage.showComments}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showComments'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-related"
                        label="Related Videos Sidebar"
                        description="Recommended and related videos"
                        checked={settings.youtube.watchPage.showRelated}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showRelated'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-playlists"
                        label="Playlists Sidebar"
                        description="When watching a video from a playlist"
                        checked={settings.youtube.watchPage.showPlaylists}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showPlaylists'], checked)
                        }
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
                      />
                      <SettingToggle
                        id="watch-more-actions"
                        label="More Actions"
                        description="Save, Download, Clip, Thanks, Report, Ask AI, Overflow Menu"
                        checked={settings.youtube.watchPage.showMoreActions}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showMoreActions'], checked)
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Creator Profile Page Settings */}
              <AccordionItem value="creatorProfile">
                <AccordionTrigger className="text-lg font-semibold">
                  Creator Profile Page Settings
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Control which tabs and content appear on YouTube channel/creator profile
                      pages. Channel action buttons (Subscribe, Join, Notifications, See Perks) are
                      always visible on creator profiles. Use{' '}
                      <strong>Global Navigation Elements</strong> above to control header and
                      sidebar elements.
                    </p>

                    {/* Tab Visibility */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Tab Visibility</h4>
                      <SettingToggle
                        id="creator-shorts-tab"
                        label="Show Shorts Tab"
                        description="Display the Shorts tab on creator profiles"
                        checked={settings.youtube.creatorProfilePage.showShortsTab}
                        onChange={(checked) =>
                          handleSettingChange(
                            ['youtube', 'creatorProfilePage', 'showShortsTab'],
                            checked
                          )
                        }
                        tooltip="The tab that shows the creator's Shorts videos"
                      />
                      <SettingToggle
                        id="creator-community-tab"
                        label="Show Posts Tab"
                        description="Display the Community/Posts tab"
                        checked={settings.youtube.creatorProfilePage.showCommunityTab}
                        onChange={(checked) =>
                          handleSettingChange(
                            ['youtube', 'creatorProfilePage', 'showCommunityTab'],
                            checked
                          )
                        }
                        tooltip="The tab that shows community posts and updates"
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Content Filtering (Home Tab) */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Home Tab Content</h4>
                      <SettingToggle
                        id="creator-community-in-home"
                        label="Show Community Posts in Home Tab"
                        description="Display community posts in the Home tab"
                        checked={settings.youtube.creatorProfilePage.showCommunityInHome}
                        onChange={(checked) =>
                          handleSettingChange(
                            ['youtube', 'creatorProfilePage', 'showCommunityInHome'],
                            checked
                          )
                        }
                        tooltip="Text, image, and poll posts shown on the channel's Home tab"
                      />
                      <SettingToggle
                        id="creator-shorts-in-home"
                        label="Show Shorts in Home Tab"
                        description="Display Shorts content in the Home tab"
                        checked={settings.youtube.creatorProfilePage.showShortsInHome}
                        onChange={(checked) =>
                          handleSettingChange(
                            ['youtube', 'creatorProfilePage', 'showShortsInHome'],
                            checked
                          )
                        }
                        tooltip="Shorts shelf shown on the channel's Home tab"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

export default Options;
