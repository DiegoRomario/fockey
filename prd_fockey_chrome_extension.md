# Product Requirements Document (PRD)

## Product Name

**Fockey**

## Product Type

Google Chrome Extension

## Vision

Fockey is a productivity‑focused Chrome extension designed to transform complex, noisy websites into **intent‑driven, minimalistic experiences**. The extension allows users to remove cognitive distractions and interact with content only when they explicitly choose to.

The extension itself is **modular by design**. Multiple website modules will be supported in the future.

- ✅ **YouTube Module** — *Version 1 (MVP)*
- ⏳ Other website modules — *Coming soon*

This PRD covers **only the YouTube module**, which will be the first and only module shipped in the initial release.

---

## Problem Statement

Modern content platforms—especially YouTube—are designed to maximize engagement through constant visual stimuli:

- Thumbnails everywhere
- Endless recommendations
- Shorts, posts, sidebars, pop‑ups
- Strong algorithmic nudges

These elements reduce focus and often lead to unintentional consumption.

**Fockey solves this by enforcing a clean, distraction‑free default experience**, while preserving full user control through configurable settings.

---

## Goals

### Primary Goals

- Reduce distraction on YouTube
- Enable intentional, search‑driven usage
- Improve focus and productivity

### Secondary Goals

- Allow granular control over hidden elements
- Preserve YouTube core functionality
- Ensure low performance overhead

### Non‑Goals (v1)

- Content recommendation optimization
- Content blocking by topic or keyword (note: specific channel blocking is supported)
- Support for websites other than YouTube

---

## Supported Platform (v1)

- Google Chrome (Desktop)

---

## Tech Stack

### Core Technologies

- **React 18** — UI framework for extension popup and options pages
- **TypeScript** — End-to-end type safety across the extension
- **Tailwind CSS** — Utility-first styling for rapid and consistent UI development
- **shadcn/ui** — Accessible, headless UI components built on Radix UI
- **Vite** — Modern build tool and development server optimized for fast iteration

### Chrome Extension Platform

- **Manifest V3** — Latest Chrome Extension standard
- **Chrome Storage API** — Persisted, cross-device user settings synchronization
- **Content Scripts** — Lightweight DOM manipulation using vanilla TypeScript
- **Service Worker** — Background tasks, state coordination, and lifecycle management

---

## High‑Level Architecture

### Extension Structure

- Core Extension Shell
- YouTube Module (v1)
  - Home Page Sub‑Module
  - Search Page Sub‑Module
  - Creator Profile Page Sub‑Module
  - Watch Page Sub‑Module

Each sub‑module manages DOM manipulation, visibility toggles, and UI overrides for its specific YouTube page type.

---

## Global Navigation Elements

### Overview

YouTube's persistent navigation elements appear consistently across all pages. These include:

- **YouTube logo** (top-left corner)
- **Left sidebar** (navigation menu with Home, Subscriptions, Library, etc.)
- **Hamburger menu** (button that toggles the sidebar)
- **Profile avatar** (account button in top-right)
- **Notifications bell** (notification icon in top-right)
- **Shorts URL blocking** (controls whether direct Shorts URLs are accessible)
- **Posts URL blocking** (controls whether direct Posts URLs are accessible)

### Unified Control

All global navigation elements are controlled by a **single, shared settings section** that applies to **all YouTube pages simultaneously** (Home, Search, Watch, Creator Profile).

**Benefits:**
- ✅ **Consistency** - Navigation behavior is identical across all pages
- ✅ **Simplicity** - Users configure navigation once, not per-page
- ✅ **Clarity** - Clear separation between global navigation and page-specific content

### Sidebar & Hamburger Menu Unification

**Important Design Decision:**

The **left sidebar** and **hamburger menu** are treated as a **single, unified component**:

- The hamburger menu button toggles the sidebar open/closed (native YouTube behavior)
- If the sidebar is hidden, the hamburger menu serves no purpose
- Therefore, **both elements share the same visibility state**
- There is **no separate toggle** for the hamburger menu

**Behavior:**
- When sidebar is **enabled** → Both sidebar AND hamburger are visible
- When sidebar is **disabled** → Both sidebar AND hamburger are hidden

### Default Behavior (Minimalist Mode)

By default, **all global navigation elements are hidden** to create a distraction-free, content-focused experience:

- YouTube logo: **Hidden**
- Left sidebar: **Hidden**
- Hamburger menu: **Hidden** (unified with sidebar)
- Profile avatar: **Hidden**
- Notifications bell: **Hidden**
- Shorts URLs: **Blocked** (direct navigation to `/shorts/...` URLs redirects to block page)
- Posts URLs: **Blocked** (direct navigation to `/post/...` URLs redirects to block page)

Users can selectively re-enable any element via the extension settings.

### Settings Scope

**Global Navigation Settings:**
- Apply to **all YouTube pages** simultaneously
- Control persistent navigation elements and global blocking rules
- Examples: Logo, sidebar, profile avatar, notifications bell, Shorts URL blocking, Posts URL blocking

**Page-Specific Settings:**
- Apply to **individual page types** only
- Control page-specific content and features
- Examples: Shorts visibility (Search page), engagement buttons (Watch page)

### User Interface Organization

In the extension settings, global navigation controls appear in a dedicated section positioned **above** page-specific settings to emphasize their global scope.

The section is clearly labeled to indicate these controls affect all YouTube pages, not just one page type.

---

### Shorts URL Blocking Feature

#### Overview

The Shorts URL Blocking feature provides users with **global control over YouTube Shorts accessibility** by blocking direct navigation to Shorts URLs (`/shorts/...`). This feature is part of the Global Navigation Settings and applies uniformly across all YouTube pages.

#### Key Characteristics

- **Scope:** Global setting that affects all YouTube pages
- **Default Behavior:** **Shorts URLs are blocked by default** (minimalist principle)
- **Independence:** This setting **only controls direct Shorts URL navigation**, not Shorts visibility in search results or creator profile pages
- **Integration:** Uses the existing channel blocking infrastructure (blocked page redirect)

#### Behavior Details

**When Shorts URLs are Blocked (Default):**
- Direct navigation to any `/shorts/...` URL (e.g., `https://www.youtube.com/shorts/TUNcmnOYYTg`) is **intercepted**
- User is immediately redirected to the **blocked page** (`blocked/index.html`)
- Block page displays a Shorts-specific message: "YouTube Shorts are blocked."
- Blocked URL is shown for reference
- "Go Back" button navigates user to YouTube Home

**When Shorts URLs are Enabled:**
- Direct Shorts URLs function normally
- No redirection occurs
- Shorts videos play as expected

#### Distinction from Page-Specific Shorts Toggles

**Important:** The Shorts URL Blocking feature is **completely independent** from page-specific Shorts visibility settings:

| Feature | Scope | Controls |
|---------|-------|----------|
| **Shorts URL Blocking** (Global) | All pages | Direct navigation to `/shorts/...` URLs |
| **Show Shorts** (Search Page) | Search page only | Shorts visibility in search results |
| **Show Shorts Tab** (Creator Profile) | Creator profile only | Shorts tab visibility on channel pages |
| **Show Shorts in Home Tab** (Creator Profile) | Creator profile only | Shorts shelf in channel Home tab |

**Example Scenario:**
- User has Shorts URL Blocking **enabled** (Shorts URLs accessible)
- User has "Show Shorts" (Search Page) **disabled**
- **Result:** User can navigate directly to Shorts URLs, but Shorts won't appear in search results

#### User Interface

**Settings Location:**
- **Options Page:** Global Navigation Elements section (after "Hover Previews")
- **Popup:** Global tab (after "Enable Hover Previews")

**Toggle Details:**
- **Label:** "Enable Shorts URLs"
- **Description (Options):** "Allow direct navigation to YouTube Shorts URLs (/shorts/...)"
- **Tooltip:** "When disabled (default), direct Shorts URLs are blocked. Note: This only affects direct Shorts URL navigation, not Shorts visibility in search results or creator profile pages (use page-specific toggles for those)."
- **Default State:** `false` (blocked)

#### Technical Implementation

**Detection Logic:**
- Checks if URL path starts with `/shorts/`
- Runs on initial page load and SPA navigation
- Executes **after** channel blocking checks

**Redirect Mechanism:**
- Uses same block page as channel blocking (`blocked/index.html`)
- Passes query parameters: `blockType=shorts`, `blockedUrl=[original URL]`
- Block page detects `blockType` and displays appropriate message

**Storage:**
- Setting stored in: `settings.youtube.globalNavigation.enableShortsUrls`
- Type: `boolean`
- Default: `false`
- Syncs via Chrome Storage API

#### Success Criteria

The Shorts URL Blocking feature is considered **successfully implemented** when:

- ✅ Direct Shorts URLs (`/shorts/...`) are blocked by default
- ✅ Blocked Shorts URLs redirect to the block page with correct message
- ✅ Block page clearly states "YouTube Shorts are blocked" with instructions
- ✅ Enabling the toggle allows Shorts URLs to function normally
- ✅ Toggle appears in both Options page (Global Navigation) and Popup (Global tab)
- ✅ Tooltip explains the feature scope (URL-only, not search/profile Shorts)
- ✅ Feature is completely independent of page-specific Shorts toggles
- ✅ No performance impact or flickering during URL checks
- ✅ Works correctly with YouTube SPA navigation
- ✅ All code passes lint, format, and type checks

---

### Posts URL Blocking Feature

#### Overview

The Posts URL Blocking feature provides users with **global control over YouTube Community Posts accessibility** by blocking direct navigation to Posts URLs (`/post/...`). This feature is part of the Global Navigation Settings and applies uniformly across all YouTube pages.

#### Key Characteristics

- **Scope:** Global setting that affects all YouTube pages
- **Default Behavior:** **Posts URLs are blocked by default** (minimalist principle)
- **Independence:** This setting **only controls direct Posts URL navigation**, not Posts visibility in search results or creator profile pages
- **Integration:** Uses the existing channel blocking infrastructure (blocked page redirect)

#### Behavior Details

**When Posts URLs are Blocked (Default):**
- Direct navigation to any `/post/...` URL (e.g., `https://www.youtube.com/post/Ugkx9qLawJCXRvR27Us6sFIOcHEvm8jk3_-2`) is **intercepted**
- User is immediately redirected to the **blocked page** (`blocked/index.html`)
- Block page displays a Posts-specific message: "YouTube Posts are blocked."
- Blocked URL is shown for reference
- "Go Back" button navigates user to YouTube Home

**When Posts URLs are Enabled:**
- Direct Posts URLs function normally
- No redirection occurs
- Posts content displays as expected

#### Distinction from Page-Specific Posts Toggles

**Important:** The Posts URL Blocking feature is **completely independent** from page-specific Posts visibility settings:

| Feature | Scope | Controls |
|---------|-------|----------|
| **Posts URL Blocking** (Global) | All pages | Direct navigation to `/post/...` URLs |
| **Show Community Posts** (Search Page) | Search page only | Community Posts visibility in search results |
| **Show Posts Tab** (Creator Profile) | Creator profile only | Posts tab visibility on channel pages |
| **Show Community Posts in Home Tab** (Creator Profile) | Creator profile only | Posts content in channel Home tab |

**Example Scenario:**
- User has Posts URL Blocking **enabled** (Posts URLs accessible)
- User has "Show Community Posts" (Search Page) **disabled**
- **Result:** User can navigate directly to Posts URLs, but Posts won't appear in search results

#### User Interface

**Settings Location:**
- **Options Page:** Global Navigation Elements section (after "Enable Shorts URLs")
- **Popup:** Global tab (after "Enable Shorts URLs")

**Toggle Details:**
- **Label:** "Enable Posts URLs"
- **Description (Options):** "Allow direct navigation to YouTube Posts URLs (/post/...)"
- **Tooltip:** "When disabled (default), direct Posts URLs are blocked. Note: This only affects direct Posts URL navigation, not Posts visibility in search results or creator profile pages (use page-specific toggles for those)."
- **Default State:** `false` (blocked)

#### Technical Implementation

**Detection Logic:**
- Checks if URL path starts with `/post/`
- Runs on initial page load and SPA navigation
- Executes in parallel with Shorts URL checking

**Redirect Mechanism:**
- Uses same block page as channel and Shorts blocking (`blocked/index.html`)
- Passes query parameters: `blockType=posts`, `blockedUrl=[original URL]`
- Block page detects `blockType` and displays appropriate message

**Storage:**
- Setting stored in: `settings.youtube.globalNavigation.enablePostsUrls`
- Type: `boolean`
- Default: `false`
- Syncs via Chrome Storage API

#### Success Criteria

The Posts URL Blocking feature is considered **successfully implemented** when:

- ✅ Direct Posts URLs (`/post/...`) are blocked by default
- ✅ Blocked Posts URLs redirect to the block page with correct message
- ✅ Block page clearly states "YouTube Posts are blocked"
- ✅ Enabling the toggle allows Posts URLs to function normally
- ✅ Toggle appears in both Options page (Global Navigation) and Popup (Global tab)
- ✅ Tooltip explains the feature scope (URL-only, not search/profile Posts)
- ✅ Feature is completely independent of page-specific Posts toggles
- ✅ No performance impact or flickering during URL checks
- ✅ Works correctly with YouTube SPA navigation
- ✅ All code passes lint, format, and type checks

---

## YouTube Module — Detailed Requirements

### 1. Home Page Sub‑Module

#### Default (Minimalist Mode)

When the user lands on **youtube.com (Home Page)**, the page is transformed into a **clean, empty canvas**.

**Visible Elements (Default):**

- ✅ Search bar (centered at the top)

**Hidden Elements (Default):**

- Video thumbnails (feed)
- Shorts shelf
- Community posts
- Left sidebar (Home, Subscriptions, You, etc.)
- YouTube logo
- Hamburger menu
- Profile avatar
- Notifications button
- Upload / Create button
- Any promotional banners

**Observed from images:**

- The resulting UI closely resembles a blank page with only the search bar exposed
- Top‑center alignment preserves spatial familiarity
- No visual content below the search bar

---

#### Configurable Options (Home Page)

**Global Navigation Elements:**

All persistent navigation elements (YouTube logo, left sidebar, profile avatar, notifications bell) are controlled by the **Global Navigation settings** described in the "Global Navigation Elements" section above.

These settings apply globally across all YouTube pages, not just the Home page.

**Page-Specific Options:**

Currently, the Home Page has no page-specific configurable options beyond the global navigation elements. Future versions may add Home-specific features.

---

### 2. Search Page Sub‑Module

The Search Page is displayed after submitting a query via the search bar. It transforms YouTube's search results into a **clean, focused, results-only experience** while maintaining **complete visual consistency** with the Home Page's minimalist design language.

#### Design Philosophy

The Search Page follows the **same visual language and layout style as the Home Page**, ensuring UI and design consistency across all Fockey-managed YouTube pages. However, unlike the Home Page (which shows only the search bar), the Search Page is a **focused, results-oriented view** that displays search results in a distraction-free format.

---

#### Default (Minimalist Mode)

When a user performs a search on YouTube, the Search Page is simplified into a clean, results-focused interface.

**Visible Elements (Default):**

- ✅ **Search bar** (positioned at top-center, maintaining spatial consistency with Home Page)
- ✅ **Filters button** (positioned directly below or adjacent to the search bar)
- ✅ **Video search results** (long-form videos only, displayed in YouTube's native grid/list format)

**Hidden Elements (Default):**

The following elements **must be hidden** to maintain the minimalist, distraction-free experience:

**Navigation & Chrome:**
- YouTube logo
- Hamburger menu / menu button
- Left sidebar (Home, Subscriptions, Library, etc.)
- Profile avatar / account button
- Notifications button
- Upload / Create button
- Any global navigation elements
- Any secondary navigation toolbars

**Content Distractions:**
- Shorts in search results
- Community posts
- Mixes / playlists (unless explicitly searched for)
- Channel recommendations
- Sponsored content (where technically possible)
- "People also watched" sections
- "For you" or algorithmic suggestion blocks
- Promotional banners or cards

**Engagement Prompts:**
- "New to you" labels
- View count badges (optional, can be preserved if non-intrusive)
- Upload date overlays (optional, can be preserved if non-intrusive)

---

#### Layout & Visual Structure

**Page Header:**
- Search bar centered horizontally at the top
- Filters button positioned immediately below the search bar or to its right
- No branding, navigation, or account elements visible
- Clean, empty top bar similar to Home Page design

**Search Results Area:**
- Begins directly below the search bar + filters section
- Uses YouTube's native results grid/list layout
- Only long-form video thumbnails and metadata are shown
- Vertical scroll enabled for browsing results
- No horizontal scrolling shelves (e.g., Shorts carousel)

**Observed from images:**
- Extremely clean header with only functional search elements
- No visible navigation chrome (sidebar, logo, profile, etc.)
- Results appear immediately below search controls
- Visual consistency with the minimalist Home Page design
- Focus entirely on search intent and results

---

#### Behavior Details

**Search Functionality:**
- Native YouTube search logic is preserved
- Search bar remains fully functional
- Auto-suggest / autocomplete preserved (if YouTube provides it natively)
- Query history unaffected

**Result Filtering:**
- Only **traditional long-form videos** are rendered by default
- Shorts, posts, mixes, and non-video content are hidden
- Layout remains identical to YouTube's native search UX, **minus removed elements**

---

#### Filters (Native YouTube)

Fockey preserves all native YouTube filters, including:
- **Upload date** (Last hour, Today, This week, This month, This year)
- **Type** (Video, Channel, Playlist, Movie)
- **Duration** (Under 4 minutes, 4-20 minutes, Over 20 minutes)
- **Features** (Live, 4K, HD, Subtitles/CC, Creative Commons, 360°, VR180, 3D, HDR, Location, Purchased)
- **Sort by** (Relevance, Upload date, View count, Rating)

All filter controls remain accessible via the **Filters button**.

---

#### Configurable Options (Search Page)

**Global Navigation Elements:**

All persistent navigation elements (YouTube logo, left sidebar, profile avatar, notifications bell) are controlled by the **Global Navigation settings** described in the "Global Navigation Elements" section above.

These settings apply globally across all YouTube pages, not just the Search page.

**Page-Specific Content Options:**
- ☑️ Show Shorts in search results
- ☑️ Show Community posts
- ☑️ Show Mixes / Playlists

**Page-Specific Visual Adjustments:**
- ☑️ **Thumbnail blur** (instead of hide) — reduces visual stimulation while keeping structural awareness of thumbnails

**Important:** By default, **all header/sidebar elements and distracting content are hidden** to maintain focus. Users must explicitly opt-in to restore any of these elements via the extension settings.

---

#### Technical Implementation Notes

**DOM Manipulation Strategy:**
- Hide elements using `display: none` or `visibility: hidden`
- Avoid altering YouTube's native search logic or API calls
- Use mutation observers to handle dynamic result loading
- Preserve accessibility attributes where possible

**Element Selectors (Indicative):**
- Search results: `ytd-video-renderer`
- Shorts: `ytd-reel-shelf-renderer`, `ytd-short-shelf-renderer`
- Community posts: `ytd-post-renderer`
- Sidebar: `#guide`, `ytd-guide-renderer`
- Header chrome: `ytd-topbar-logo-renderer`, `ytd-masthead`

**Performance Considerations:**
- Minimize reflows during DOM manipulation
- Use CSS-based hiding where possible
- Debounce mutation observer callbacks

---

#### Success Criteria

The Search Page is considered **successfully implemented** when:

- ✅ Only the search bar, filters button, and long-form video results are visible by default
- ✅ All navigation chrome (logo, sidebar, profile, etc.) is hidden
- ✅ Shorts, posts, and algorithmic suggestions are removed from results
- ✅ Native YouTube search functionality remains intact
- ✅ Filters button works correctly and all filter options are accessible
- ✅ Visual design matches the minimalist style of the Home Page
- ✅ Settings allow granular control over re-enabling hidden elements
- ✅ No performance degradation or flickering during page load

---

### 3. Creator Profile Page Sub‑Module

The Creator Profile Page is displayed when a user navigates to a creator's channel (e.g., `youtube.com/@MrBeast`). It follows the **same minimalist design language as the Home and Search pages**, ensuring visual and behavioral consistency across all Fockey-managed YouTube surfaces.

#### Design Philosophy

The Creator Profile Page maintains the **same navigation chrome visibility rules as the Home and Search pages** while preserving full access to creator information and channel content. Unlike the Home Page (which shows only the search bar) or the Search Page (which shows search results), the Creator Profile Page is a **creator-focused view** that displays channel metadata and content tabs in a distraction-free format.

---

#### Default (Minimalist Mode)

When a user navigates to a creator's channel page, the interface is simplified into a clean, creator-focused experience.

**Visible Elements (Default):**

- ✅ **Search bar** (positioned at top-center, maintaining spatial consistency with Home and Search pages)
- ✅ **Channel banner / cover image**
- ✅ **Channel profile image / avatar**
- ✅ **Channel name and verified badge** (if applicable)
- ✅ **Basic channel metadata** (subscriber count, video count, etc.)
- ✅ **Channel description / about section** (when applicable)
- ✅ **Content tabs** (Videos, Playlists, Podcasts, etc. — see Tab Visibility Rules below)
- ✅ **Video content** (long-form videos only, displayed in YouTube's native grid/list format)

**Hidden Elements (Default):**

The following elements **must be hidden** to maintain the minimalist, distraction-free experience:

**Navigation & Chrome:**
- YouTube logo
- Hamburger menu / menu button
- Left sidebar (Home, Subscriptions, Library, etc.)
- Profile avatar / account button
- Notifications button
- Upload / Create button
- Any global navigation elements
- Any secondary navigation toolbars

**Content Tabs (Hidden by Default):**
- **Shorts tab** — Hidden completely
- **Posts / Community tab** — Hidden completely

**Content Distractions (Within Visible Tabs):**
- Shorts-type content in the Videos tab or any other tab
- Community posts
- Promotional banners or cards
- "Featured" or algorithmic suggestion blocks

**Engagement Prompts:**
- Subscribe button on channel header
- Notifications (bell) button
- Join / Membership buttons
- Any channel action buttons in the header area

---

#### Layout & Visual Structure

**Page Header:**
- Search bar centered horizontally at the top
- No branding, navigation, or account elements visible
- Clean, empty top bar identical to Home and Search page design

**Channel Header Area:**
- Channel banner displayed full-width below the search bar
- Channel avatar positioned according to YouTube's native layout
- Channel name, verification badge, and basic metadata visible
- Channel description accessible (typically in About section or below header)
- **All channel action buttons hidden** (Subscribe, Join, Notifications, etc.)

**Content Tabs Area:**
- Standard YouTube channel tabs displayed (Videos, Playlists, Podcasts, etc.)
- **Shorts and Posts tabs are hidden by default**
- Tab bar follows YouTube's native styling and behavior
- Active tab state preserved

**Content Area:**
- Begins directly below the channel tabs
- Uses YouTube's native content grid/list layout
- Only long-form videos and non-Shorts content are shown
- Vertical scroll enabled for browsing content
- No horizontal scrolling shelves (e.g., Shorts carousel)

**Observed Design Principles:**
- Extremely clean header with only functional search elements
- No visible navigation chrome (sidebar, logo, profile, etc.)
- Channel branding and metadata remain fully accessible
- Content appears immediately below tabs
- Visual consistency with the minimalist Home and Search page design
- Focus entirely on creator content and intentional browsing

---

#### Tab Visibility Rules

**Default Visible Tabs:**
- **Home** (if present on the channel)
- **Videos** — Always visible, shows only long-form videos
- **Playlists** — Always visible
- **Podcasts** — Always visible (if present on the channel)
- **Live** — Always visible (if present on the channel)
- **About** — Always visible

**Hidden Tabs (Default):**
- **Shorts** — Hidden completely by default
- **Posts / Community** — Hidden completely by default

**Content Filtering Within Tabs:**
- In the **Videos** tab, any Shorts-type content is hidden
- In the **Home** tab, Shorts shelves and Community posts are hidden
- In the **Playlists** tab, playlists containing only Shorts are hidden (or Shorts within mixed playlists are filtered out)

---

#### Behavior Details

**Channel Navigation:**
- Native YouTube channel navigation logic is preserved
- All tabs remain fully functional
- Switching between tabs works as expected
- URL structure and routing unaffected

**Content Filtering:**
- Only **traditional long-form videos** are rendered in the Videos tab
- Shorts and posts are hidden across all visible tabs
- Layout remains identical to YouTube's native channel UX, **minus removed elements**

**Channel Information:**
- All creator metadata remains accessible
- Channel description, links, and contact info preserved
- About section fully functional

---

#### Configurable Options (Creator Profile Page)

**Global Navigation Elements:**

All persistent navigation elements (YouTube logo, left sidebar, profile avatar, notifications bell) are controlled by the **Global Navigation settings** described in the "Global Navigation Elements" section above.

These settings apply globally across all YouTube pages, not just the Creator Profile page.

**Page-Specific Tab Visibility Options:**
- ☑️ Show Shorts tab
- ☑️ Show Posts / Community tab

**Page-Specific Content Filtering Options (Home Tab Only):**
- ☑️ Show Community posts in Home tab
- ☑️ Show Shorts in Home tab

**Channel Action Buttons:**

Channel action buttons (Subscribe, Join, Notifications Bell, See Perks) are **always visible** on creator profile pages by default and are **not configurable** on this page. These buttons are essential for creator-viewer interaction and engagement. Users can control these buttons specifically on the Watch page if desired.

**Important:** By default, **all header/sidebar elements and distraction-prone tabs are hidden** to maintain focus. Users must explicitly opt-in to restore any of these elements via the extension settings. The four configurable options for Creator Profile pages are intentionally minimal to preserve the core channel browsing experience.

---

#### Technical Implementation Notes

**DOM Manipulation Strategy:**
- Hide elements using `display: none` or `visibility: hidden`
- Avoid altering YouTube's native channel navigation logic or API calls
- Use mutation observers to handle dynamic content loading
- Preserve accessibility attributes where possible

**Element Selectors (Indicative):**
- Channel header: `ytd-c4-tabbed-header-renderer`, `ytd-page-header-renderer`
- Channel tabs: `tp-yt-paper-tab`, `ytd-tab-renderer`
- Shorts tab: `tp-yt-paper-tab[title="Shorts"]`, `ytd-tab-renderer[tab-title="Shorts"]`
- Posts tab: `tp-yt-paper-tab[title="Community"]`, `ytd-tab-renderer[tab-title="Posts"]`
- Videos content: `ytd-grid-video-renderer`, `ytd-rich-item-renderer`
- Shorts content: `ytd-reel-shelf-renderer`, `ytd-short-shelf-renderer`, `ytd-rich-shelf-renderer[is-shorts]`
- Subscribe button: `ytd-subscribe-button-renderer`
- Channel actions: `ytd-button-renderer` (within channel header context)
- Sidebar: `#guide`, `ytd-guide-renderer`
- Header chrome: `ytd-topbar-logo-renderer`, `ytd-masthead`

**Performance Considerations:**
- Minimize reflows during DOM manipulation
- Use CSS-based hiding where possible
- Debounce mutation observer callbacks
- Handle tab switching efficiently without re-running expensive DOM queries

---

#### Success Criteria

The Creator Profile Page is considered **successfully implemented** when:

- ✅ Only the search bar, channel header (banner, avatar, name, metadata), channel action buttons (Subscribe, Join, Notifications, See Perks), and Videos tab are visible by default
- ✅ All navigation chrome (logo, sidebar, profile avatar, notifications bell) is hidden by default (controlled by Global Navigation settings)
- ✅ Shorts and Posts tabs are hidden by default
- ✅ Shorts content is filtered out of the Home tab unless explicitly enabled
- ✅ Community posts are filtered out of the Home tab unless explicitly enabled
- ✅ Channel action buttons (Subscribe, Join, Notifications Bell, See Perks) remain always visible and are not configurable
- ✅ Native YouTube channel navigation and tab switching remain intact
- ✅ Channel metadata and creator information remain fully accessible
- ✅ Visual design matches the minimalist style of the Home and Search pages
- ✅ Settings allow granular control over 4 specific options: Show Shorts Tab, Show Posts Tab, Show Community Posts in Home Tab, Show Shorts in Home Tab
- ✅ No performance degradation or flickering during page load or tab switching

---

### 4. Watch Page Sub‑Module

The Watch Page is where the user watches a selected video.

#### Default (Minimalist Mode)

**Visible Elements (Default):**

- ✅ Search bar
- ✅ Video player
- ✅ Video title
- ✅ Video description
- ✅ Channel avatar (profile picture)
- ✅ Channel name and subscriber count
- ✅ **Subscription Action Buttons** (Subscribe, Join, Notifications, See Perks) — visible by default for basic channel interaction

**Hidden Elements (Default):**

**Engagement Action Buttons:**
- Like button
- Dislike button
- Share button
- More Actions (Save, Download, Clip, Thanks, Report, Ask AI, Overflow Menu) — unified group controlled by a single toggle
  - Save button
  - Download button (appears only when user is logged in)
  - Clip button
  - Thanks button (appears only when user is logged in)
  - Report button (may be grouped in three-dots overflow menu)
  - Ask button (YouTube AI assistant feature)
  - Three-dots overflow menu

**Social & Discovery Elements:**
- Comments section
- Live chat (if applicable)
- Related / recommended videos (right sidebar)
- Playlists sidebar
- Recommended Video Cards (Info Cards and teasers during playback — configurable)

**End-of-Video Elements:**
- End cards / end-screen thumbnails (non-configurable, always hidden)

**Important Notes on Button Visibility:**

- **Conditional Appearance:** Some buttons (Download, Thanks, Notifications, See Perks) appear conditionally based on user authentication status, subscription state, or channel membership status. The extension must handle these cases gracefully.
- **More Actions Unified Toggle:** To simplify settings management, Save, Download, Clip, Thanks, Report, Ask AI, and the Three-Dots Overflow Menu are all controlled by a single "More Actions" toggle. This reduces UI complexity while maintaining full control over these secondary action buttons.
- **Subscription Actions Unified Toggle:** Subscribe, Join, Notifications (bell), and See Perks buttons are controlled by a single "Subscription Actions" toggle. This simplifies state management and reduces cognitive load by grouping all channel subscription-related actions together.
- **Three-Dots Overflow Menu:** YouTube may group certain action buttons (e.g., Report, Save, Clip) inside a three-dots overflow menu to save screen space, especially on smaller viewports. When the "More Actions" toggle is disabled, all these buttons are hidden whether they appear inline or within the overflow menu.

**Observed from images:**

- The video remains fully functional
- Timeline, volume, captions, and fullscreen controls remain intact
- Caption toggle and settings (gear icon) are still accessible

---

#### Video Player Controls (Preserved)

The following **must always remain available**:

- Play / Pause
- Volume
- Seek bar
- Video quality selector
- Playback speed
- Captions (CC)
- Fullscreen / Theater mode

---

#### Configurable Options (Watch Page)

Users can selectively re-enable hidden elements via extension settings. Most elements are individually toggleable, with some grouped for simplified management.

**Engagement Action Buttons**

- ☑️ Like / Dislike buttons (unified toggle for both Like and Dislike)
- ☑️ Share button
- ☑️ **Subscription Actions** (unified toggle for Subscribe, Join, Notifications, See Perks) — **enabled by default**
  - Includes: Subscribe, Notifications (bell), Join/Membership, See Perks buttons
  - When enabled (default), all subscription-related buttons become visible (subject to YouTube's conditional rendering)
  - When disabled, all subscription-related buttons are hidden

**Social Elements**

- ☑️ Comments section
- ☑️ Live chat

**Discovery Elements**

- ☑️ Related videos sidebar
- ☑️ Playlists
- ☑️ **Recommended Video Cards** (Info Cards and teasers during playback)
- ☑️ **More Actions** (unified toggle for Save, Download, Clip, Thanks, Report, Ask AI, and Overflow Menu)
  - Includes: Save, Download, Clip, Thanks, Report, Ask AI assistant, and Three-dots overflow menu
  - When enabled, all included buttons become visible (subject to YouTube's conditional rendering based on auth state)
  - When disabled, all included buttons are hidden

**Note:** End cards and end-screen thumbnails are **always hidden** and cannot be re-enabled. This is a core minimalist design decision.

**Default Behavior & Conditional Rules:**

- **Most engagement and social elements are hidden by default** in minimalist mode, with **Subscription Actions visible by default** to maintain basic channel interaction functionality
- **Conditional buttons** (e.g., Notifications, See Perks, Download, Thanks) follow their toggle settings regardless of their native visibility state
- **If a button is enabled in settings** but YouTube doesn't render it (e.g., Join button when channel has no memberships), the extension does nothing — it simply doesn't hide the button if/when YouTube decides to show it
- **Subscription Actions unified toggle:** Enabled by default, all subscription-related buttons (Subscribe, Join, Notifications, See Perks) are visible; when disabled, all are hidden
- **More Actions unified toggle:** When enabled, all included buttons (Save, Download, Clip, Thanks, Report, Ask AI, and Overflow Menu) become visible; when disabled, all are hidden
- **Simplified settings management:** The Subscription Actions and More Actions unified toggles reduce cognitive load by grouping related buttons, resulting in 8 clean toggles instead of 12 individual controls on the Watch page

---

## Channel Blocking Feature

### Overview

The Channel Blocking feature empowers users to completely block specific YouTube channels, preventing access to both the channel's profile page and any individual videos from that channel. This feature aligns with Fockey's core minimalist philosophy by giving users **ultimate control over their content environment** and eliminating unwanted distractions at the source.

When a user blocks a channel, all attempts to access content from that channel are intercepted and redirected to a visually polished **blocked page** that reinforces productivity and focus.

---

### Feature Goals

**Primary Goals:**
- Provide users with granular control over which YouTube creators they can access
- Eliminate distractions from specific channels without affecting the broader YouTube experience
- Maintain a seamless, intuitive blocking workflow across all YouTube surfaces

**Secondary Goals:**
- Support multiple channel identification patterns (handle, name, URL)
- Integrate blocking functionality into existing extension UI surfaces (popup, settings)
- Deliver a polished, on-brand blocked page experience

---

### Channel Blocking Rules & Input Patterns

Users must be able to block YouTube channels using **any of the following input patterns**:

1. **Channel Handle** (preferred)
   - Format: `@mrbeast`, `@channelname`
   - Most reliable identifier, as it's unique per channel

2. **Channel Name**
   - Format: `MrBeast`, `Channel Name`
   - May match multiple channels if names are similar (handle preferred)

3. **Channel URL**
   - Full URL: `https://www.youtube.com/@mrbeast`
   - Short URL: `youtube.com/@mrbeast`
   - Channel ID URL: `youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA`

**Normalization & Matching Logic:**
- All input patterns should be normalized to a canonical channel identifier (ideally channel handle or channel ID)
- Handle and URL-based inputs should be preferred for accuracy
- Name-based inputs should warn users if ambiguity is detected
- Blocked channels are stored using a reliable, permanent identifier (channel ID or handle)

---

### Blocking Behavior

Once a channel is blocked, the following access restrictions apply:

#### 1. **Blocked Channel Profile Page**

When a user attempts to navigate to a blocked channel's profile page (e.g., `https://www.youtube.com/@MrBeast`), they are **immediately redirected** to the **Blocked Page**.

**Examples of blocked URLs:**
- `https://www.youtube.com/@MrBeast`
- `https://www.youtube.com/c/MrBeast6000`
- `https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA`

#### 2. **Blocked Channel Videos**

When a user attempts to watch a video from a blocked channel (e.g., `https://www.youtube.com/watch?v=4l97aNza_Zc`), they are **immediately redirected** to the **Blocked Page**.

**Detection Logic:**
- Extract channel information from the Watch Page DOM or YouTube API
- Match against the list of blocked channels
- Redirect if a match is found

**Important:** The blocking must occur **before** the video player loads, to avoid any visual flicker or partial rendering.

#### 3. **Blocked Content in Search Results, Feeds, and Recommendations**

Blocked channels' content should be **hidden** from:
- Search results
- Home page feed (if Home content is enabled)
- Related/recommended videos sidebar (Watch Page)
- Any other surfaces where channel content may appear

**Implementation Strategy:**
- Use mutation observers to detect and hide blocked channel content dynamically
- Apply content filtering at the DOM level (similar to existing Shorts/Posts filtering)
- Ensure no performance degradation during content filtering

---

### Blocked Page Design

When a user is redirected due to a channel block, they are shown a **full-page interstitial** with the following design:

**Visual Design:**
- **Background:** Smooth gradient (purple-to-blue) covering the full viewport
- **Lock Icon:** Centered, circular badge with a lock symbol (golden/amber color)
- **Heading:** "Page Blocked" (large, bold, white text)
- **Channel Name Message:** "Channel '[Channel Name]' is blocked" (subtitle, white text)
- **Motivational Message:** "Stay focused on what matters. This block helps you avoid distractions and maintain productivity." (smaller white text)
- **Go Back Button:** Prominent, centered button with a subtle outline (white border, transparent background)
- **Footer Text:** "Blocked: [URL]" (small, faded white text at the bottom of the page)

**Behavioral Details:**
- **Go Back Button:** Navigates the user back to their previous page (using `history.back()`)
- **Responsive Design:** Full-page layout adapts to all screen sizes
- **Branding:** Maintains Fockey's polished, minimalist design language
- **Performance:** Page renders instantly with no external dependencies

**Technical Implementation:**
- Hosted as an extension HTML page (`blocked.html`)
- Receives channel name and URL as query parameters
- Fully self-contained (no external API calls)

---

### Settings Page Integration

A new **"Blocked YouTube Channels"** section must be added to the extension's Settings (Options) page.

**Section Layout:**

**Header:**
- Title: "Blocked YouTube Channels"
- Subtitle: "Block YouTube channels to hide their videos and prevent access to their channel pages."

**Input Area:**
- Text input field with placeholder: "Enter channel name or @channel"
- **"Block"** button positioned to the right of the input field
- Informational text below input: "Examples: @mrbeast, MrBeast, or youtube.com/@mrbeast"

**Blocked Channels List:**
- Display a list of all currently blocked channels
- Each list item shows:
  - Channel name (if available)
  - Channel handle (e.g., `@mrbeast`)
  - **"Unblock"** button (or trash icon) for removal
- If no channels are blocked, show:
  - Empty state icon (YouTube icon with a strikethrough or lock)
  - Text: "No blocked channels yet"
  - Subtext: "Use the input above to block a channel, or visit YouTube and use the popup."

**User Interaction:**
1. User enters a channel identifier (handle, name, or URL) in the input field
2. User clicks the **"Block"** button
3. Extension resolves the channel identifier to a canonical form (channel ID or handle)
4. Channel is added to the blocked list and persisted to Chrome Storage API
5. UI updates immediately to reflect the new blocked channel
6. Success feedback is shown (toast notification or inline message)

**Edge Cases:**
- **Invalid Input:** Show error message if input cannot be resolved to a valid channel
- **Duplicate Block:** Show warning if channel is already blocked
- **Empty Input:** Disable "Block" button until valid input is provided

---

### Popup Integration

The extension popup must include a new **"Block Channel"** button that allows users to quickly block the current YouTube channel they are viewing.

**Button Location:**
- Positioned within the popup UI, ideally in a dedicated section or near the top for quick access
- Follows the established shadcn/ui design patterns and Tailwind styling

**Button Design:**
- Red background with white text
- Label: "Block"
- Icon: Lock or shield icon (optional)
- Disabled state: Grayed out if not on a valid channel page or watch page

**Popup Channel Info Display:**
- Show the current channel's name (e.g., "MrBeast")
- Show the current channel's handle (e.g., "@MrBeast")
- Display this info in a card or section above or near the "Block" button

**User Interaction Flow:**
1. User opens the extension popup while on a YouTube video or channel page
2. Popup displays the current channel's name and handle
3. User clicks the **"Block"** button
4. Extension adds the channel to the blocked list
5. Popup shows success feedback (e.g., "Channel blocked successfully")
6. User is optionally redirected away from the blocked content (or immediately sees the blocked page if on a video/channel page)
7. The blocked channel automatically appears in the Settings page's "Blocked Channels" list

**Contextual Availability:**
- Button is **only enabled** when:
  - User is on a YouTube Watch Page (`/watch?v=...`)
  - User is on a YouTube Channel Profile Page (`/@channelname`, `/channel/...`, `/c/...`)
- Button is **disabled** when:
  - User is on Home, Search, or any non-channel/video page
  - Channel information cannot be reliably extracted

**Edge Cases:**
- **Channel Already Blocked:** Show message "Channel already blocked" and disable button
- **Invalid Page Context:** Show message "Navigate to a video or channel to block"

---

### Data Storage & Persistence

**Blocked Channels List Storage:**
- Stored using **Chrome Storage API** (sync storage for cross-device persistence)
- Storage key: `blockedChannels`
- Data structure:
  ```json
  {
    "blockedChannels": [
      {
        "id": "UCX6OQ3DkcsbYNE6H8uQQuVA",
        "handle": "@mrbeast",
        "name": "MrBeast",
        "blockedAt": 1677649200000
      }
    ]
  }
  ```

**Key Fields:**
- `id` (required): YouTube channel ID (canonical identifier)
- `handle` (optional): Channel handle (e.g., `@mrbeast`)
- `name` (optional): Display name of the channel
- `blockedAt` (optional): Timestamp of when the channel was blocked

**Data Synchronization:**
- Changes to the blocked channels list are immediately persisted to Chrome Storage
- All extension contexts (popup, content scripts, service worker) listen for storage changes
- Real-time updates across all open YouTube tabs when channels are blocked/unblocked

---

### Technical Implementation Notes

**Content Script Integration:**
- Each YouTube page content script (home, search, watch, profile) must:
  - Check if the current page's channel is in the blocked list
  - Redirect to the blocked page if a match is found
  - Filter out blocked channel content from feeds, recommendations, and search results

**Service Worker Coordination:**
- Service worker listens for navigation events to blocked channels
- Provides blocked channel list to content scripts on demand
- Handles storage synchronization and cross-tab communication

**Performance Considerations:**
- Blocked channel checks must be **fast and non-blocking**
- Use efficient data structures for channel matching (Map or Set)
- Avoid unnecessary DOM queries or API calls
- Ensure no visual flicker when blocking content

**Channel Resolution Logic:**
- Use YouTube's DOM to extract channel information when possible
- Fallback to URL parsing for channel ID/handle extraction
- Handle edge cases where channel info is unavailable or ambiguous

---

### Success Criteria

The Channel Blocking feature is considered **successfully implemented** when:

- ✅ Users can add channels to a block list using handles, names, or URLs via the Settings page
- ✅ Users can quickly block the current channel via the popup "Block" button
- ✅ Blocked channel profile pages redirect to the Blocked Page immediately
- ✅ Videos from blocked channels redirect to the Blocked Page immediately
- ✅ Blocked channel content is hidden from search results, feeds, and recommendations
- ✅ The Blocked Page displays a polished, branded interstitial with channel info and "Go Back" button
- ✅ Settings page shows a list of all blocked channels with an "Unblock" option
- ✅ All blocked channel data is persisted and synchronized via Chrome Storage API
- ✅ The popup displays current channel info and enables/disables the "Block" button contextually
- ✅ No performance degradation or flickering during channel blocking or content filtering
- ✅ Edge cases (invalid input, duplicate blocks, ambiguous names) are handled gracefully with clear user feedback

---

## Lock Mode Feature

### Overview

Lock Mode is a time-based commitment system that prevents impulsive configuration changes by temporarily locking all extension settings for a user-defined duration. This feature aligns with Fockey's core philosophy of intentional focus and minimalism by helping users commit to their carefully chosen settings and avoid constant tweaking.

When activated, Lock Mode transforms the extension into a **read-only state** where all configuration changes are blocked until the lock period expires. Users can set the lock duration and extend it, but cannot unlock early—creating an absolute commitment mechanism that reinforces focus and productivity.

---

### Feature Goals

**Primary Goals:**
- Prevent impulsive settings changes that disrupt focus and productivity
- Enforce commitment to carefully chosen configurations
- Reduce decision fatigue by eliminating constant re-configuration temptation
- Support long-term focus by making settings changes deliberately difficult during lock periods

**Secondary Goals:**
- Provide flexible lock durations (minutes, hours, days)
- Allow lock extension for continued commitment
- Display clear visual feedback about lock status and remaining time
- Maintain usability while preventing configuration changes

---

### Lock Mode Behavior

Once Lock Mode is activated, the following restrictions and behaviors apply:

#### 1. **Settings Enforcement**

**Locked Operations (Blocked):**
- All settings toggles and switches are **disabled** (grayed out, unclickable)
- Reset to Defaults button is **disabled**
- Import Settings functionality is **blocked**
- Channel unblocking is **blocked** (cannot remove existing blocks)
- Any attempt to modify settings via storage or messages is **rejected**

**Allowed Operations (Exceptions):**
- **Channel blocking** — Users can still add new channel blocks (commitment to focus)
- **Lock extension** — Users can extend the lock duration (add more time only, not shorten)
- **Read-only access** — All settings remain visible for reference

**Error Handling:**
- Any blocked operation shows a clear error message: "Settings are locked for X more minutes"
- Disabled UI controls display tooltips explaining the lock status
- No silent failures—users always understand why an action is blocked

#### 2. **Lock Duration & Time Management**

**Activation:**
- Lock duration set via numeric input + unit selector (Minutes / Hours / Days)
- Minimum duration: **1 minute**
- Maximum duration: **365 days**
- Validation prevents invalid inputs (zero, negative, or extreme values)
- Immediate activation upon confirmation—no delay or grace period

**Active Lock:**
- **Live countdown timer** updates every second (format: "9h 23m 15s" or "2d 5h 30m")
- **Expiration timestamp** displayed (e.g., "Unlocks at Dec 26, 2025 10:30 PM")
- **Motivational messaging** reinforces commitment and focus
- **Warning color** when less than 1 hour remaining (amber/gold)

**Lock Extension:**
- Activated locks can be **extended** by adding additional time
- Validation ensures new expiration time is in the future
- Extension immediately updates countdown and expiration timestamp
- Success feedback confirms new unlock time

**Unlock:**
- **Automatic unlock** when countdown reaches zero
- **Silent unlock** — no notifications, toasts, or alerts
- UI controls automatically re-enabled
- Lock Mode section returns to activation state
- User discovers unlock when they next interact with settings

#### 3. **Lock Persistence & Robustness**

**Persistence Across Sessions:**
- Lock state survives browser restarts
- Chrome alarms recreated on service worker startup
- Lock state verified on every extension load
- Expired locks automatically cleared on startup

**Defense Against Bypass:**
- **Dual unlock mechanism:**
  1. Primary: Chrome alarm fires at scheduled time
  2. Backup: Periodic validation in keep-alive alarm (every 25 minutes)
  3. Startup: Immediate check on service worker initialization
- **Device-specific lock:** Stored in `chrome.storage.local` (not synced across devices)
- **Centralized validation:** All settings mutations check `isLockModeActive()` guard function
- **Time drift handling:** Validates lock expiration on every check

---

### Lock Mode UI

#### Options Page — Lock Mode Control Panel

**Location:**
- Dedicated section in the Settings (Options) page
- Positioned prominently to emphasize its importance
- Card-based design with lock icon and clear status indicators

**Unlocked State:**
- **Lock icon** (open/unlocked) in muted colors
- **Title:** "Lock Mode"
- **Description:** "Prevent configuration changes for a set period to commit to your settings and stay focused."
- **Duration input:** Numeric field with validation
- **Unit selector:** Dropdown (Minutes / Hours / Days)
- **Activate button:** Primary variant, disabled until valid input provided
- **Validation message:** "Examples: 30 minutes, 2 hours, or 1 day (minimum: 1 minute, maximum: 365 days)"

**Locked State:**
- **Lock icon** (closed) in amber/gold color with circular badge background
- **Title:** "Settings are locked"
- **Live countdown timer:**
  - Large, prominent display (4xl font size)
  - Format: "9h 23m 15s", "2d 5h 30m", or "23m 45s"
  - Updates every second
  - Amber color when < 1 hour remaining
- **Expiration time:** "Unlocks at [formatted date/time]"
- **Motivational message:** "Stay focused. Your commitment helps you avoid impulsive changes and maintain productivity."
- **Extension controls:**
  - Duration input field (same as activation)
  - Unit selector (Minutes / Hours / Days)
  - "Extend Lock" button (outline variant)
  - Informational text: "You can add more time, but cannot shorten or cancel the lock"
- **No early unlock option** — absolute commitment enforced

**Visual Design:**
- Card component with border-2 for emphasis
- Color-coded lock icons (muted when unlocked, amber when locked)
- Clear visual hierarchy (countdown as focal point when locked)
- Smooth transitions between unlocked/locked states
- Consistent spacing and typography matching shadcn/ui design system

#### Popup — Lock Status Indicator

**Purpose:**
- Display **read-only** lock status
- No lock activation controls (Options page only)
- Show remaining time and expiration in compact format

**Visual Elements:**
- **Lock icon badge** appears when locked (amber/gold color)
- **Compact countdown** below master toggle
- **Status text:** "Settings Locked"
- **Remaining time:** "9h 23m remaining"
- **Expiration time:** "Until Dec 26, 2025 10:30 PM" (in tooltip or secondary text)

**Disabled Controls:**
- Master toggle for YouTube module **disabled** when locked
- All setting tabs and toggles **disabled** when locked
- Visual feedback: Reduced opacity, not-allowed cursor
- Tooltip on hover: "Locked until [time]"

**Important:**
- Popup does **NOT** include lock activation controls
- Lock can only be activated from the Options page
- Popup is purely informational when locked

---

### Settings Page Integration

Lock Mode is integrated into the Options page as a dedicated, prominent section.

**Section Layout:**

**Positioning:**
- Appears at the top of the Settings page (high visibility)
- Card-based layout with clear visual boundaries
- Grouped with other global settings (not page-specific)

**Section Components:**
- Lock Mode Control Panel (as described above)
- Clear separation from other settings sections
- Accordion-style expansion possible for advanced settings (future)

**Disabled Settings During Lock:**
- **All SettingToggle components** across all sections (Global Nav, Search, Watch, Creator Profile)
- **Import Settings button** (disabled completely)
- **Reset to Defaults button** (disabled completely)
- **Unblock buttons** in Blocked Channels section (disabled completely)

**Visual Indicators:**
- Disabled switches with reduced opacity
- Lock icon overlay on disabled sections (optional)
- Tooltip on disabled controls: "Locked until [time]"
- Grayed-out labels for all disabled elements

---

### Device-Specific Behavior

Lock Mode is **device-specific** and does not sync across browsers or devices. This design decision:
- Treats the lock as a **local commitment tool** tied to a specific device
- Prevents users from bypassing locks by accessing settings on another device
- Avoids synchronization conflicts and timing issues across devices

---

### Edge Cases

**1. Browser Restart:**
- Lock state persists across browser restarts
- Active locks automatically resume countdown
- Expired locks (during shutdown) are automatically cleared

**2. Extension Updates:**
- Lock state survives extension updates
- Active locks continue without interruption
- No loss of lock commitment during updates

**3. System Clock Changes:**
- Lock expiration is based on absolute time, not elapsed duration
- Manual system clock changes do not bypass the lock
- Lock expires at the originally scheduled time

**4. Concurrent Lock Attempts:**
- When locked, activation controls are replaced with extension controls
- Only one lock can be active at a time
- Cannot activate a new lock until the current one expires

**5. Invalid Duration Inputs:**
- Input validation enforces: minimum 1 minute, maximum 365 days
- Non-numeric, negative, or zero values show inline error messages
- Activation button remains disabled until valid input is provided

**6. Lock Bypass Attempts:**
- **Accepted Limitation:** Lock Mode is a **commitment tool**, not a security feature
- Users can bypass locks via browser developer tools or by disabling the extension
- The feature relies on user commitment and intentionality, not technical enforcement

---

### Success Criteria

The Lock Mode feature is considered **successfully implemented** when:

- ✅ Users can activate Lock Mode from the Options page with custom durations (minutes, hours, or days)
- ✅ Users can extend active locks by adding more time (cannot shorten or cancel)
- ✅ All settings controls are disabled and unclickable during an active lock
- ✅ Channel blocking remains available during lock (add new blocks only, cannot unblock)
- ✅ Live countdown timer displays accurate remaining time and updates in real-time
- ✅ Lock state persists across browser restarts and extension updates
- ✅ Lock expires silently without notifications when countdown reaches zero
- ✅ Popup displays read-only lock status with remaining time and expiration timestamp
- ✅ Options page shows clear lock status with motivational messaging
- ✅ Clear user feedback for all lock-related actions (activation, extension, blocked operations)
- ✅ Edge cases handled gracefully (invalid input, browser restart, system clock changes)
- ✅ UI is polished, professional, and visually consistent with the rest of the extension
- ✅ Lock Mode is fully keyboard-accessible and screen reader-friendly
- ✅ Lock Mode does not degrade extension performance when active or inactive

---

## Settings & Configuration

### Access Points

- Extension popup (quick toggles)
- Full settings page (advanced configuration)

### Settings Characteristics

- Real‑time DOM update (no page reload required where possible)
- Persisted per user
- Default = Minimalist Mode enabled

---

## UX Principles

- **Intent over temptation**
- **Minimal by default, powerful by choice**
- **Preserve muscle memory (search bar position, filters)**

---

## Functional Requirements Summary

| Category                   | Feature                    | Default | Configurable | Scope          |
| -------------------------- | -------------------------- | ------- | ------------ | -------------- |
| **Global Navigation**      | YouTube Logo               | Off     | Yes          | All pages      |
| **Global Navigation**      | Left Sidebar (+ Hamburger) | Off     | Yes          | All pages      |
| **Global Navigation**      | Profile Avatar             | Off     | Yes          | All pages      |
| **Global Navigation**      | Notifications Bell         | Off     | Yes          | All pages      |
| **Global Navigation**      | Enable Shorts URLs         | Off     | Yes          | All pages      |
| **Global Navigation**      | Enable Posts URLs          | Off     | Yes          | All pages      |
| **Channel Blocking**       | Block specific channels    | Off     | Yes          | All pages      |
| **Channel Blocking**       | Blocked page redirect      | On      | No           | All pages      |
| **Channel Blocking**       | Filter blocked content     | On      | No           | All pages      |
| **Lock Mode**              | Activate lock              | Off     | Yes          | All pages      |
| **Lock Mode**              | Extend lock                | N/A     | Yes          | All pages      |
| **Lock Mode**              | Silent unlock              | On      | No           | All pages      |
| **Lock Mode**              | Block settings changes     | On      | No           | All pages      |
| **Lock Mode**              | Allow channel blocking     | On      | No           | All pages      |
| **Home**            | Search bar                 | On      | No           | Home only      |
| **Home**            | Feed, Shorts               | Off     | N/A          | Home only      |
| **Search**          | Search bar, Results        | On      | No           | Search only    |
| **Search**          | Shorts / Posts             | Off     | Yes          | Search only    |
| **Search**          | Thumbnail blur             | Off     | Yes          | Search only    |
| **Creator**         | Channel info & tabs        | On      | No           | Creator only   |
| **Creator**         | Shorts / Posts tabs        | Off     | Yes          | Creator only   |
| **Creator**         | Channel action buttons     | Off     | Yes          | Creator only   |
| **Watch**           | Video player               | On      | No           | Watch only     |
| **Watch**           | Channel info section       | On      | Yes          | Watch only     |
| **Watch**           | Engagement buttons         | Off     | Yes          | Watch only     |
| **Watch**           | Subscription Actions       | On      | Yes          | Watch only     |
| **Watch**           | Comments / Recommendations | Off     | Yes          | Watch only     |

---

## Success Metrics (Qualitative)

- Reduced visual clutter
- Increased intentional search behavior
- Positive feedback from productivity‑focused users

---

## Version

**v1.0 — YouTube Module Only**

