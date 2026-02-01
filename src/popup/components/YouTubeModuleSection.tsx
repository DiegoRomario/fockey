/**
 * YouTube Module Section Component (Popup Version)
 * Uses Accordion layout for compact popup interface
 * Provides direct access to all YouTube toggles with tooltip-based descriptions
 */

import React from 'react';
import { Youtube, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModuleToggle from './ModuleToggle';
import { ExtensionSettings } from '@/shared/types/settings';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface YouTubeModuleSectionProps {
  settings: ExtensionSettings;
  onGlobalNavigationToggle: (key: string, value: boolean) => void;
  onSearchPageToggle: (key: string, value: boolean) => void;
  onWatchPageToggle: (key: string, value: boolean) => void;
  onModuleToggle?: (enabled: boolean) => void; // Reserved for future use
  onOpenSettings?: () => void;
  disabled?: boolean;
}

/**
 * YouTube Module section for popup
 * Accordion-based layout for compact, scrollable interface
 */
export const YouTubeModuleSection: React.FC<YouTubeModuleSectionProps> = ({
  settings,
  onGlobalNavigationToggle,
  onSearchPageToggle,
  onWatchPageToggle,
  onOpenSettings,
  disabled = false,
}) => {
  const blockedChannelsCount = settings.youtube.blockedChannels?.length || 0;

  return (
    <div className="space-y-3">
      {/* Hero Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-2">
            <Youtube className="h-5 w-5 text-red-600 dark:text-red-500" />
          </div>
        </div>
        <h3 className="font-semibold text-sm">YouTube Module</h3>
        <p className="text-xs text-muted-foreground">Control YouTube experience</p>
      </div>

      {/* Accordion Settings Interface */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Accordion type="single" defaultValue="global" collapsible className="w-full">
          {/* Global Section */}
          <AccordionItem value="global" className="border-b last:border-b-0">
            <AccordionTrigger className="px-3 py-2.5 text-xs font-semibold hover:no-underline hover:bg-muted/50">
              Global
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-2">
              <div className="space-y-0">
                <ModuleToggle
                  id="global-logo"
                  label="YouTube Logo"
                  tooltip="Display the YouTube logo in the top-left corner"
                  checked={settings.youtube.globalNavigation.showLogo}
                  onChange={(checked) => onGlobalNavigationToggle('showLogo', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="global-sidebar"
                  label="Sidebar"
                  tooltip="Navigation sidebar and hamburger menu"
                  checked={settings.youtube.globalNavigation.showSidebar}
                  onChange={(checked) => onGlobalNavigationToggle('showSidebar', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="global-profile"
                  label="Profile"
                  tooltip="Your account profile picture"
                  checked={settings.youtube.globalNavigation.showProfile}
                  onChange={(checked) => onGlobalNavigationToggle('showProfile', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="global-notifications"
                  label="Notifications Bell"
                  tooltip="Notifications bell icon in header"
                  checked={settings.youtube.globalNavigation.showNotifications}
                  onChange={(checked) => onGlobalNavigationToggle('showNotifications', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="global-hover-previews"
                  label="Hover Previews"
                  tooltip="Video preview autoplay on hover"
                  checked={settings.youtube.globalNavigation.enableHoverPreviews}
                  onChange={(checked) => onGlobalNavigationToggle('enableHoverPreviews', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="global-enable-shorts"
                  label="Shorts"
                  tooltip="Enable YouTube Shorts globally. When disabled (default), all Shorts content is blocked including direct URLs, search results, and creator profiles."
                  checked={settings.youtube.globalNavigation.enableShorts}
                  onChange={(checked) => onGlobalNavigationToggle('enableShorts', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="global-enable-posts"
                  label="Posts"
                  tooltip="Enable YouTube Posts globally. When disabled (default), all Posts content is blocked including direct URLs, search results, and creator profiles."
                  checked={settings.youtube.globalNavigation.enablePosts}
                  onChange={(checked) => onGlobalNavigationToggle('enablePosts', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="global-enable-search-suggestions"
                  label="Search Suggestions"
                  tooltip="Enable search suggestions (autocomplete dropdown). When disabled (default), the search suggestions dropdown is hidden to reduce distractions and algorithmic nudges."
                  checked={settings.youtube.globalNavigation.enableSearchSuggestions}
                  onChange={(checked) =>
                    onGlobalNavigationToggle('enableSearchSuggestions', checked)
                  }
                  disabled={disabled || !settings.youtube.enabled}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Search Section */}
          <AccordionItem value="search" className="border-b last:border-b-0">
            <AccordionTrigger className="px-3 py-2.5 text-xs font-semibold hover:no-underline hover:bg-muted/50">
              Search
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-2">
              <div className="space-y-0">
                <ModuleToggle
                  id="search-mixes"
                  label="Mixes/Playlists"
                  tooltip="Auto-generated mixes and user-created playlists"
                  checked={settings.youtube.searchPage.showMixes}
                  onChange={(checked) => onSearchPageToggle('showMixes', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="search-blur"
                  label="Blur Thumbnails"
                  tooltip="Reduces visual stimulation while keeping structural awareness"
                  checked={settings.youtube.searchPage.blurThumbnails}
                  onChange={(checked) => onSearchPageToggle('blurThumbnails', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Watch Section */}
          <AccordionItem value="watch" className="border-b last:border-b-0">
            <AccordionTrigger className="px-3 py-2.5 text-xs font-semibold hover:no-underline hover:bg-muted/50">
              Watch
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-2">
              <div className="space-y-0">
                <ModuleToggle
                  id="watch-like-dislike"
                  label="Like/Dislike"
                  tooltip="Thumbs up and thumbs down buttons"
                  checked={settings.youtube.watchPage.showLikeDislike}
                  onChange={(checked) => onWatchPageToggle('showLikeDislike', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="watch-subscription-actions"
                  label="Subscription Actions"
                  tooltip="Subscribe, Join, Notifications, See Perks"
                  checked={settings.youtube.watchPage.showSubscriptionActions}
                  onChange={(checked) => onWatchPageToggle('showSubscriptionActions', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="watch-share"
                  label="Share"
                  tooltip="Share video via link or social media"
                  checked={settings.youtube.watchPage.showShare}
                  onChange={(checked) => onWatchPageToggle('showShare', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="watch-comments"
                  label="Comments"
                  tooltip="User comments below the video"
                  checked={settings.youtube.watchPage.showComments}
                  onChange={(checked) => onWatchPageToggle('showComments', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="watch-related"
                  label="Related"
                  tooltip="Recommended and related videos"
                  checked={settings.youtube.watchPage.showRelated}
                  onChange={(checked) => onWatchPageToggle('showRelated', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="watch-playlists"
                  label="Playlists"
                  tooltip="When watching a video from a playlist"
                  checked={settings.youtube.watchPage.showPlaylists}
                  onChange={(checked) => onWatchPageToggle('showPlaylists', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="watch-recommended-video"
                  label="Recommended Video"
                  tooltip="Info Cards during playback"
                  checked={settings.youtube.watchPage.showRecommendedVideo}
                  onChange={(checked) => onWatchPageToggle('showRecommendedVideo', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
                <ModuleToggle
                  id="watch-more-actions"
                  label="More Actions"
                  tooltip="Save, Download, Clip, Thanks, Report, Ask AI, Overflow Menu"
                  checked={settings.youtube.watchPage.showMoreActions}
                  onChange={(checked) => onWatchPageToggle('showMoreActions', checked)}
                  disabled={disabled || !settings.youtube.enabled}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between text-xs">
        {/* Blocked Channels Indicator */}
        {blockedChannelsCount > 0 ? (
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors cursor-pointer',
                  disabled && 'opacity-50'
                )}
              >
                <Lock className="w-3 h-3" />
                <span>{blockedChannelsCount} blocked</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 max-w-[90vw]" side="top" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-xs flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                  Blocked YouTube Channels
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {settings.youtube.blockedChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex flex-col gap-0.5 px-2 py-1.5 bg-muted/50 rounded text-xs"
                    >
                      <span className="font-medium truncate">{channel.name}</span>
                      <span className="text-muted-foreground truncate">@{channel.handle}</span>
                    </div>
                  ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ) : (
          <div className="text-xs text-muted-foreground">No blocked channels</div>
        )}

        {/* Configure Link */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            disabled={disabled}
          >
            <span>Configure</span>
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default YouTubeModuleSection;
