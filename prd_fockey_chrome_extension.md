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
- Content blocking by topic or keyword
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

Users can selectively re-enable any element via the extension settings.

### Settings Scope

**Global Navigation Settings:**
- Apply to **all YouTube pages** simultaneously
- Control persistent navigation elements
- Examples: Logo, sidebar, profile avatar, notifications bell

**Page-Specific Settings:**
- Apply to **individual page types** only
- Control page-specific content and features
- Examples: Shorts visibility (Search page), engagement buttons (Watch page)

### User Interface Organization

In the extension settings, global navigation controls appear in a dedicated section positioned **above** page-specific settings to emphasize their global scope.

The section is clearly labeled to indicate these controls affect all YouTube pages, not just one page type.

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
- ☑️ Show sponsored content (if detectable)

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

**Page-Specific Content Options:**
- ☑️ Show Shorts-type content in Videos tab
- ☑️ Show Community posts in Home tab
- ☑️ Show Shorts in Playlists

**Page-Specific Channel Action Buttons:**
- ☑️ Show Subscribe button
- ☑️ Show Notifications (bell) button
- ☑️ Show Join / Membership buttons

**Important:** By default, **all header/sidebar elements, action buttons, and distraction-prone tabs are hidden** to maintain focus. Users must explicitly opt-in to restore any of these elements via the extension settings.

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

- ✅ Only the search bar, channel header (banner, avatar, name, metadata), and allowed tabs are visible by default
- ✅ All navigation chrome (logo, sidebar, profile, etc.) is hidden
- ✅ Shorts and Posts tabs are hidden by default
- ✅ Shorts-type content is filtered out of the Videos tab and other visible tabs
- ✅ Channel action buttons (Subscribe, Join, Notifications) are hidden by default
- ✅ Native YouTube channel navigation and tab switching remain intact
- ✅ Channel metadata and creator information remain fully accessible
- ✅ Visual design matches the minimalist style of the Home and Search pages
- ✅ Settings allow granular control over re-enabling hidden tabs, content types, and action buttons
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

**Hidden Elements (Default):**

**Engagement Action Buttons:**
- Like button
- Dislike button
- Share button
- Save button
- Download button (appears only when user is logged in)
- Clip button
- Thanks button (appears only when user is logged in)
- Report button (may be grouped in three-dots overflow menu)
- Ask button (YouTube AI assistant feature)

**Channel-Related Buttons:**
- Subscribe button
- Notifications (bell) button (appears only when subscribed to channel)
- Join button (channel membership — appears when channel offers memberships and user is not a member)
- See Perks button (appears only when user has active channel membership)

**Social & Discovery Elements:**
- Comments section
- Live chat (if applicable)
- Related / recommended videos (right sidebar)
- Playlists sidebar

**End-of-Video Elements:**
- End cards / end-screen thumbnails (non-configurable, always hidden)

**Important Notes on Button Visibility:**

- **Conditional Appearance:** Some buttons (Download, Thanks, Notifications, See Perks) appear conditionally based on user authentication status, subscription state, or channel membership status. The extension must handle these cases gracefully.
- **Three-Dots Overflow Menu:** YouTube may group certain action buttons (e.g., Report, Save, Clip) inside a three-dots overflow menu to save screen space, especially on smaller viewports. The extension must:
  - Detect and hide the overflow menu itself by default
  - Allow re-enabling the overflow menu via settings (or individual buttons within it)
  - Ensure that hidden buttons remain hidden whether they appear inline or within the overflow menu

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

Users can selectively re-enable hidden elements via extension settings. Each element is individually toggleable.

**Engagement Action Buttons**

- ☑️ Like button
- ☑️ Dislike button
- ☑️ Share button
- ☑️ Save button
- ☑️ Download button
- ☑️ Clip button
- ☑️ Thanks button
- ☑️ Report button
- ☑️ Ask button (YouTube AI assistant)
- ☑️ Three-dots overflow menu (enables all grouped buttons)

**Channel-Related Buttons**

- ☑️ Subscribe button
- ☑️ Notifications (bell) button
- ☑️ Join button
- ☑️ See Perks button
- ☑️ Hide channel info section (avatar + channel name) — **Visible by default, can be hidden via settings**

**Social Elements**

- ☑️ Comments section
- ☑️ Live chat

**Discovery Elements**

- ☑️ Related videos sidebar
- ☑️ Playlists
- ☑️ Creator‑recommended end‑screen videos

**Note:** End cards and end-screen thumbnails are **always hidden** and cannot be re-enabled. This is a core minimalist design decision.

**Default Behavior & Conditional Rules:**

- **All listed engagement and social elements are hidden by default** in minimalist mode
- **Channel info (avatar + name) is visible by default** because users need to know which channel they're watching
- **Conditional buttons** (e.g., Notifications, See Perks, Download, Thanks) are hidden regardless of their native visibility state
- **If a button is enabled in settings** but YouTube doesn't render it (e.g., Join button when channel has no memberships), the extension does nothing — it simply doesn't hide the button if/when YouTube decides to show it
- **Three-dots overflow menu toggle:** When enabled, all buttons within the overflow menu become visible; when disabled, the overflow menu itself is hidden
- **Per-button granularity:** Users can choose to enable specific buttons (e.g., Like/Dislike only) without enabling the entire overflow menu

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
| **Watch**           | Comments / Recommendations | Off     | Yes          | Watch only     |

---

## Success Metrics (Qualitative)

- Reduced visual clutter
- Increased intentional search behavior
- Positive feedback from productivity‑focused users

---

## Version

**v1.0 — YouTube Module Only**

