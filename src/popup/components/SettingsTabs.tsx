import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ModuleToggle from './ModuleToggle';
import { ExtensionSettings } from '@/shared/types/settings';

interface SettingsTabsProps {
  settings: ExtensionSettings;
  disabled: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onGlobalNavigationToggle: (key: string, value: boolean) => void;
  onSearchPageToggle: (key: string, value: boolean) => void;
  onWatchPageToggle: (key: string, value: boolean) => void;
  onCreatorProfilePageToggle: (key: string, value: boolean) => void;
}

/**
 * Tabbed settings interface for the Popup
 * Provides access to all 32 YouTube settings organized across 4 tabs
 */
export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  settings,
  disabled,
  activeTab,
  onTabChange,
  onGlobalNavigationToggle,
  onSearchPageToggle,
  onWatchPageToggle,
  onCreatorProfilePageToggle,
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-3">
        <TabsTrigger value="global">Global</TabsTrigger>
        <TabsTrigger value="search">Search</TabsTrigger>
        <TabsTrigger value="watch">Watch</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>

      {/* Scrollable container for tab content */}
      <div className="max-h-[400px] overflow-y-auto pr-1">
        {/* Global Tab - 5 settings */}
        <TabsContent value="global" className="space-y-0.5 mt-0">
          <ModuleToggle
            id="global-logo"
            label="Show YouTube Logo"
            tooltip="Display the YouTube logo in the top-left corner"
            checked={settings.youtube.globalNavigation.showLogo}
            onChange={(checked) => onGlobalNavigationToggle('showLogo', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-sidebar"
            label="Show Sidebar"
            tooltip="Controls navigation sidebar and hamburger menu"
            checked={settings.youtube.globalNavigation.showSidebar}
            onChange={(checked) => onGlobalNavigationToggle('showSidebar', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-profile"
            label="Show Profile"
            tooltip="Display your account profile picture"
            checked={settings.youtube.globalNavigation.showProfile}
            onChange={(checked) => onGlobalNavigationToggle('showProfile', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-notifications"
            label="Show Notifications Bell"
            tooltip="Show the notifications bell icon in header"
            checked={settings.youtube.globalNavigation.showNotifications}
            onChange={(checked) => onGlobalNavigationToggle('showNotifications', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-hover-previews"
            label="Enable Hover Previews"
            tooltip="Video preview autoplay when hovering over thumbnails"
            checked={settings.youtube.globalNavigation.enableHoverPreviews}
            onChange={(checked) => onGlobalNavigationToggle('enableHoverPreviews', checked)}
            disabled={disabled}
          />
        </TabsContent>

        {/* Search Tab - 5 settings */}
        <TabsContent value="search" className="space-y-0.5 mt-0">
          <ModuleToggle
            id="search-shorts"
            label="Show Shorts"
            tooltip="Short-form vertical videos (YouTube Shorts)"
            checked={settings.youtube.searchPage.showShorts}
            onChange={(checked) => onSearchPageToggle('showShorts', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="search-community-posts"
            label="Show Community Posts"
            tooltip="Text, image, and poll posts from creators"
            checked={settings.youtube.searchPage.showCommunityPosts}
            onChange={(checked) => onSearchPageToggle('showCommunityPosts', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="search-mixes"
            label="Show Mixes/Playlists"
            tooltip="Auto-generated mixes and user-created playlists"
            checked={settings.youtube.searchPage.showMixes}
            onChange={(checked) => onSearchPageToggle('showMixes', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="search-sponsored"
            label="Show Sponsored Content"
            tooltip="Paid promotional content in search results"
            checked={settings.youtube.searchPage.showSponsored}
            onChange={(checked) => onSearchPageToggle('showSponsored', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="search-blur"
            label="Blur Thumbnails"
            tooltip="Reduces visual stimulation while keeping structural awareness"
            checked={settings.youtube.searchPage.blurThumbnails}
            onChange={(checked) => onSearchPageToggle('blurThumbnails', checked)}
            disabled={disabled}
          />
        </TabsContent>

        {/* Watch Tab - 18 settings in single column */}
        <TabsContent value="watch" className="space-y-0.5 mt-0">
          <ModuleToggle
            id="watch-like-dislike"
            label="Like/Dislike"
            tooltip="Thumbs up and thumbs down buttons"
            checked={settings.youtube.watchPage.showLikeDislike}
            onChange={(checked) => onWatchPageToggle('showLikeDislike', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-share"
            label="Share"
            tooltip="Share video via link or social media"
            checked={settings.youtube.watchPage.showShare}
            onChange={(checked) => onWatchPageToggle('showShare', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-save"
            label="Save"
            tooltip="Save to playlists"
            checked={settings.youtube.watchPage.showSave}
            onChange={(checked) => onWatchPageToggle('showSave', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-download"
            label="Download"
            tooltip="Appears when logged in"
            checked={settings.youtube.watchPage.showDownload}
            onChange={(checked) => onWatchPageToggle('showDownload', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-clip"
            label="Clip"
            tooltip="Create short clips from the video"
            checked={settings.youtube.watchPage.showClip}
            onChange={(checked) => onWatchPageToggle('showClip', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-thanks"
            label="Thanks"
            tooltip="Appears when logged in"
            checked={settings.youtube.watchPage.showThanks}
            onChange={(checked) => onWatchPageToggle('showThanks', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-report"
            label="Report"
            tooltip="Report inappropriate content"
            checked={settings.youtube.watchPage.showReport}
            onChange={(checked) => onWatchPageToggle('showReport', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-ask"
            label="Ask AI"
            tooltip="YouTube AI assistant"
            checked={settings.youtube.watchPage.showAskButton}
            onChange={(checked) => onWatchPageToggle('showAskButton', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-subscribe"
            label="Subscribe"
            tooltip="Subscribe to the channel"
            checked={settings.youtube.watchPage.showSubscribe}
            onChange={(checked) => onWatchPageToggle('showSubscribe', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-join"
            label="Join"
            tooltip="Appears when channel offers memberships"
            checked={settings.youtube.watchPage.showJoin}
            onChange={(checked) => onWatchPageToggle('showJoin', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-notifications"
            label="Notifications"
            tooltip="Appears when subscribed to channel"
            checked={settings.youtube.watchPage.showNotifications}
            onChange={(checked) => onWatchPageToggle('showNotifications', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-see-perks"
            label="See Perks"
            tooltip="Appears when user has active membership"
            checked={settings.youtube.watchPage.showSeePerks}
            onChange={(checked) => onWatchPageToggle('showSeePerks', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-overflow-menu"
            label="Overflow Menu"
            tooltip="Three-dots menu with additional options"
            checked={settings.youtube.watchPage.showOverflowMenu}
            onChange={(checked) => onWatchPageToggle('showOverflowMenu', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-comments"
            label="Comments"
            tooltip="User comments below the video"
            checked={settings.youtube.watchPage.showComments}
            onChange={(checked) => onWatchPageToggle('showComments', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-live-chat"
            label="Live Chat"
            tooltip="For live streams and premieres"
            checked={settings.youtube.watchPage.showLiveChat}
            onChange={(checked) => onWatchPageToggle('showLiveChat', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-related"
            label="Related"
            tooltip="Recommended and related videos"
            checked={settings.youtube.watchPage.showRelated}
            onChange={(checked) => onWatchPageToggle('showRelated', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-playlists"
            label="Playlists"
            tooltip="When watching a video from a playlist"
            checked={settings.youtube.watchPage.showPlaylists}
            onChange={(checked) => onWatchPageToggle('showPlaylists', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-end-screen"
            label="End Screen"
            tooltip="Creator-recommended videos at the end"
            checked={settings.youtube.watchPage.showEndScreen}
            onChange={(checked) => onWatchPageToggle('showEndScreen', checked)}
            disabled={disabled}
          />
        </TabsContent>

        {/* Profile Tab - 4 settings */}
        <TabsContent value="profile" className="space-y-0.5 mt-0">
          <ModuleToggle
            id="profile-shorts-tab"
            label="Shorts Tab"
            tooltip="The tab that shows the creator's Shorts videos"
            checked={settings.youtube.creatorProfilePage.showShortsTab}
            onChange={(checked) => onCreatorProfilePageToggle('showShortsTab', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="profile-community-tab"
            label="Posts Tab"
            tooltip="The tab that shows community posts and updates"
            checked={settings.youtube.creatorProfilePage.showCommunityTab}
            onChange={(checked) => onCreatorProfilePageToggle('showCommunityTab', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="profile-community-in-home"
            label="Posts in Home"
            tooltip="Text, image, and poll posts shown on the channel's Home tab"
            checked={settings.youtube.creatorProfilePage.showCommunityInHome}
            onChange={(checked) => onCreatorProfilePageToggle('showCommunityInHome', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="profile-shorts-in-home"
            label="Shorts in Home"
            tooltip="Shorts shelf shown on the channel's Home tab"
            checked={settings.youtube.creatorProfilePage.showShortsInHome}
            onChange={(checked) => onCreatorProfilePageToggle('showShortsInHome', checked)}
            disabled={disabled}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default SettingsTabs;
