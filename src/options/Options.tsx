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
              defaultValue={['home', 'search', 'watch']}
              className="w-full"
            >
              {/* Home Page Settings */}
              <AccordionItem value="home">
                <AccordionTrigger className="text-lg font-semibold">
                  Home Page Settings
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Control which UI elements are visible on the YouTube home page. By default,
                      only the search bar is shown.
                    </p>

                    <SettingToggle
                      id="home-logo"
                      label="YouTube Logo"
                      description="Show the YouTube logo in the top-left corner"
                      checked={settings.youtube.homePage.showLogo}
                      onChange={(checked) =>
                        handleSettingChange(['youtube', 'homePage', 'showLogo'], checked)
                      }
                      tooltip="The clickable YouTube logo that returns you to the home page"
                    />

                    <SettingToggle
                      id="home-hamburger"
                      label="Hamburger Menu"
                      description="Show the menu button to toggle the sidebar"
                      checked={settings.youtube.homePage.showHamburger}
                      onChange={(checked) =>
                        handleSettingChange(['youtube', 'homePage', 'showHamburger'], checked)
                      }
                      tooltip="The three-line menu icon that opens/closes the left sidebar"
                    />

                    <SettingToggle
                      id="home-sidebar"
                      label="Left Sidebar"
                      description="Show the navigation sidebar (Home, Subscriptions, Library, etc.)"
                      checked={settings.youtube.homePage.showSidebar}
                      onChange={(checked) =>
                        handleSettingChange(['youtube', 'homePage', 'showSidebar'], checked)
                      }
                      tooltip="The left navigation panel with links to Home, Subscriptions, Library, and more"
                    />

                    <SettingToggle
                      id="home-profile"
                      label="Profile Avatar"
                      description="Show your account profile picture"
                      checked={settings.youtube.homePage.showProfile}
                      onChange={(checked) =>
                        handleSettingChange(['youtube', 'homePage', 'showProfile'], checked)
                      }
                      tooltip="Your profile picture in the top-right corner for accessing account settings"
                    />

                    <SettingToggle
                      id="home-notifications"
                      label="Notifications Button"
                      description="Show the notifications bell icon"
                      checked={settings.youtube.homePage.showNotifications}
                      onChange={(checked) =>
                        handleSettingChange(['youtube', 'homePage', 'showNotifications'], checked)
                      }
                      tooltip="The bell icon that shows notifications from your subscriptions"
                    />
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
                      Control which elements appear in YouTube search results. By default, only
                      long-form videos are shown.
                    </p>

                    {/* Navigation Chrome */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Navigation Elements</h4>
                      <SettingToggle
                        id="search-logo"
                        label="YouTube Logo"
                        checked={settings.youtube.searchPage.showLogo}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'searchPage', 'showLogo'], checked)
                        }
                      />
                      <SettingToggle
                        id="search-hamburger"
                        label="Hamburger Menu"
                        checked={settings.youtube.searchPage.showHamburger}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'searchPage', 'showHamburger'], checked)
                        }
                      />
                      <SettingToggle
                        id="search-sidebar"
                        label="Left Sidebar"
                        checked={settings.youtube.searchPage.showSidebar}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'searchPage', 'showSidebar'], checked)
                        }
                      />
                      <SettingToggle
                        id="search-profile"
                        label="Profile Avatar"
                        checked={settings.youtube.searchPage.showProfile}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'searchPage', 'showProfile'], checked)
                        }
                      />
                      <SettingToggle
                        id="search-notifications"
                        label="Notifications Button"
                        checked={settings.youtube.searchPage.showNotifications}
                        onChange={(checked) =>
                          handleSettingChange(
                            ['youtube', 'searchPage', 'showNotifications'],
                            checked
                          )
                        }
                      />
                    </div>

                    <Separator className="my-4" />

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

                    {/* Channel Info */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Channel Information</h4>
                      <SettingToggle
                        id="watch-channel-info"
                        label="Channel Info Section"
                        description="Show channel avatar and name (visible by default)"
                        checked={settings.youtube.watchPage.showChannelInfo}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showChannelInfo'], checked)
                        }
                        tooltip="The channel's profile picture and name below the video"
                      />
                    </div>

                    <Separator className="my-4" />

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
                        id="watch-save"
                        label="Save Button"
                        description="Save to playlists"
                        checked={settings.youtube.watchPage.showSave}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showSave'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-download"
                        label="Download Button"
                        description="Appears when logged in"
                        checked={settings.youtube.watchPage.showDownload}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showDownload'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-clip"
                        label="Clip Button"
                        checked={settings.youtube.watchPage.showClip}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showClip'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-thanks"
                        label="Thanks Button"
                        description="Appears when logged in"
                        checked={settings.youtube.watchPage.showThanks}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showThanks'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-report"
                        label="Report Button"
                        checked={settings.youtube.watchPage.showReport}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showReport'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-ask"
                        label="Ask Button"
                        description="YouTube AI assistant"
                        checked={settings.youtube.watchPage.showAskButton}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showAskButton'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-overflow"
                        label="Three-Dots Menu"
                        description="Overflow menu with additional options"
                        checked={settings.youtube.watchPage.showOverflowMenu}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showOverflowMenu'], checked)
                        }
                      />
                    </div>

                    <Separator className="my-4" />

                    {/* Channel Actions */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Channel Action Buttons</h4>
                      <SettingToggle
                        id="watch-subscribe"
                        label="Subscribe Button"
                        checked={settings.youtube.watchPage.showSubscribe}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showSubscribe'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-notifications-bell"
                        label="Notifications Bell"
                        description="Appears when subscribed to channel"
                        checked={settings.youtube.watchPage.showNotifications}
                        onChange={(checked) =>
                          handleSettingChange(
                            ['youtube', 'watchPage', 'showNotifications'],
                            checked
                          )
                        }
                      />
                      <SettingToggle
                        id="watch-join"
                        label="Join/Membership Button"
                        description="Appears when channel offers memberships"
                        checked={settings.youtube.watchPage.showJoin}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showJoin'], checked)
                        }
                      />
                      <SettingToggle
                        id="watch-perks"
                        label="See Perks Button"
                        description="Appears when user has active membership"
                        checked={settings.youtube.watchPage.showSeePerks}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showSeePerks'], checked)
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
                        id="watch-live-chat"
                        label="Live Chat"
                        description="For live streams and premieres"
                        checked={settings.youtube.watchPage.showLiveChat}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showLiveChat'], checked)
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
                        id="watch-endscreen"
                        label="End Screen Videos"
                        description="Creator-recommended videos at the end"
                        checked={settings.youtube.watchPage.showEndScreen}
                        onChange={(checked) =>
                          handleSettingChange(['youtube', 'watchPage', 'showEndScreen'], checked)
                        }
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
