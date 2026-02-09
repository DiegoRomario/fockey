import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ModuleToggle from './ModuleToggle';
import { ExtensionSettings } from '@/shared/types/settings';
import { useT } from '@/shared/i18n/hooks';

interface SettingsTabsProps {
  settings: ExtensionSettings;
  disabled: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onGlobalNavigationToggle: (key: string, value: boolean) => void;
  onSearchPageToggle: (key: string, value: boolean) => void;
  onWatchPageToggle: (key: string, value: boolean) => void;
}

/**
 * Tabbed settings interface for the Popup
 * Provides access to YouTube settings organized across 3 tabs
 */
export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  settings,
  disabled,
  activeTab,
  onTabChange,
  onGlobalNavigationToggle,
  onSearchPageToggle,
  onWatchPageToggle,
}) => {
  const t = useT();

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-3">
        <TabsTrigger value="global">{t('popup.youtube.global')}</TabsTrigger>
        <TabsTrigger value="search">{t('popup.youtube.search')}</TabsTrigger>
        <TabsTrigger value="watch">{t('popup.youtube.watch')}</TabsTrigger>
      </TabsList>

      {/* Scrollable container for tab content */}
      <div className="max-h-[400px] overflow-y-auto pr-1">
        {/* Global Tab */}
        <TabsContent value="global" className="space-y-0.5 mt-0">
          <ModuleToggle
            id="global-logo"
            label={t('popup.youtube.settings.logo.label')}
            tooltip={t('popup.youtube.settings.logo.tooltip')}
            checked={settings.youtube.globalNavigation.showLogo}
            onChange={(checked) => onGlobalNavigationToggle('showLogo', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-sidebar"
            label={t('popup.youtube.settings.sidebar.label')}
            tooltip={t('popup.youtube.settings.sidebar.tooltip')}
            checked={settings.youtube.globalNavigation.showSidebar}
            onChange={(checked) => onGlobalNavigationToggle('showSidebar', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-profile"
            label={t('popup.youtube.settings.profile.label')}
            tooltip={t('popup.youtube.settings.profile.tooltip')}
            checked={settings.youtube.globalNavigation.showProfile}
            onChange={(checked) => onGlobalNavigationToggle('showProfile', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-notifications"
            label={t('popup.youtube.settings.notifications.label')}
            tooltip={t('popup.youtube.settings.notifications.tooltip')}
            checked={settings.youtube.globalNavigation.showNotifications}
            onChange={(checked) => onGlobalNavigationToggle('showNotifications', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-hover-previews"
            label={t('popup.youtube.settings.hoverPreviews.label')}
            tooltip={t('popup.youtube.settings.hoverPreviews.tooltip')}
            checked={settings.youtube.globalNavigation.enableHoverPreviews}
            onChange={(checked) => onGlobalNavigationToggle('enableHoverPreviews', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-enable-shorts"
            label={t('popup.youtube.settings.shorts.label')}
            tooltip={t('popup.youtube.settings.shorts.tooltip')}
            checked={settings.youtube.globalNavigation.enableShorts}
            onChange={(checked) => onGlobalNavigationToggle('enableShorts', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-enable-posts"
            label={t('popup.youtube.settings.posts.label')}
            tooltip={t('popup.youtube.settings.posts.tooltip')}
            checked={settings.youtube.globalNavigation.enablePosts}
            onChange={(checked) => onGlobalNavigationToggle('enablePosts', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="global-blur-thumbnails"
            label={t('popup.youtube.settings.blurThumbnails.label')}
            tooltip={t('popup.youtube.settings.blurThumbnails.tooltip')}
            checked={settings.youtube.globalNavigation.blurThumbnails}
            onChange={(checked) => onGlobalNavigationToggle('blurThumbnails', checked)}
            disabled={disabled}
          />
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-0.5 mt-0">
          <ModuleToggle
            id="search-mixes"
            label={t('popup.youtube.settings.mixes.label')}
            tooltip={t('popup.youtube.settings.mixes.tooltip')}
            checked={settings.youtube.searchPage.showMixes}
            onChange={(checked) => onSearchPageToggle('showMixes', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="search-suggestions"
            label={t('popup.youtube.settings.searchSuggestions.label')}
            tooltip={t('popup.youtube.settings.searchSuggestions.tooltip')}
            checked={settings.youtube.searchPage.enableSearchSuggestions}
            onChange={(checked) => onSearchPageToggle('enableSearchSuggestions', checked)}
            disabled={disabled}
          />
        </TabsContent>

        {/* Watch Tab */}
        <TabsContent value="watch" className="space-y-0.5 mt-0">
          <ModuleToggle
            id="watch-like-dislike"
            label={t('popup.youtube.settings.likeDislike.label')}
            tooltip={t('popup.youtube.settings.likeDislike.tooltip')}
            checked={settings.youtube.watchPage.showLikeDislike}
            onChange={(checked) => onWatchPageToggle('showLikeDislike', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-subscription-actions"
            label={t('popup.youtube.settings.subscriptionActions.label')}
            tooltip={t('popup.youtube.settings.subscriptionActions.tooltip')}
            checked={settings.youtube.watchPage.showSubscriptionActions}
            onChange={(checked) => onWatchPageToggle('showSubscriptionActions', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-share"
            label={t('popup.youtube.settings.share.label')}
            tooltip={t('popup.youtube.settings.share.tooltip')}
            checked={settings.youtube.watchPage.showShare}
            onChange={(checked) => onWatchPageToggle('showShare', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-comments"
            label={t('popup.youtube.settings.comments.label')}
            tooltip={t('popup.youtube.settings.comments.tooltip')}
            checked={settings.youtube.watchPage.showComments}
            onChange={(checked) => onWatchPageToggle('showComments', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-related"
            label={t('popup.youtube.settings.related.label')}
            tooltip={t('popup.youtube.settings.related.tooltip')}
            checked={settings.youtube.watchPage.showRelated}
            onChange={(checked) => onWatchPageToggle('showRelated', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-playlists"
            label={t('popup.youtube.settings.playlists.label')}
            tooltip={t('popup.youtube.settings.playlists.tooltip')}
            checked={settings.youtube.watchPage.showPlaylists}
            onChange={(checked) => onWatchPageToggle('showPlaylists', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-recommended-video"
            label={t('popup.youtube.settings.recommendedVideo.label')}
            tooltip={t('popup.youtube.settings.recommendedVideo.tooltip')}
            checked={settings.youtube.watchPage.showRecommendedVideo}
            onChange={(checked) => onWatchPageToggle('showRecommendedVideo', checked)}
            disabled={disabled}
          />
          <ModuleToggle
            id="watch-more-actions"
            label={t('popup.youtube.settings.moreActions.label')}
            tooltip={t('popup.youtube.settings.moreActions.tooltip')}
            checked={settings.youtube.watchPage.showMoreActions}
            onChange={(checked) => onWatchPageToggle('showMoreActions', checked)}
            disabled={disabled}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default SettingsTabs;
