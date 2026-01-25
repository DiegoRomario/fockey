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
- **Shorts blocking** (controls whether all Shorts content is accessible across all pages)
- **Posts blocking** (controls whether all Posts content is accessible across all pages)
- **Search suggestions** (controls whether search autocomplete dropdown appears)

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

By default, **all global navigation elements are hidden** and **all Shorts and Posts content is blocked** to create a distraction-free, content-focused experience:

- YouTube logo: **Hidden**
- Left sidebar: **Hidden**
- Hamburger menu: **Hidden** (unified with sidebar)
- Profile avatar: **Hidden**
- Notifications bell: **Hidden**
- Shorts: **Blocked globally** (direct URLs, search results, creator profile tabs, and home tab content)
- Posts: **Blocked globally** (direct URLs, search results, creator profile tabs, and home tab content)
- Search suggestions: **Hidden** (autocomplete dropdown does not appear)

Users can selectively re-enable any element via the extension settings.

### Settings Scope

**Global Navigation Settings:**
- Apply to **all YouTube pages** simultaneously
- Control persistent navigation elements and global content blocking
- Examples: Logo, sidebar, profile avatar, notifications bell, Shorts blocking, Posts blocking, Search suggestions

**Page-Specific Settings:**
- Apply to **individual page types** only
- Control page-specific features and behaviors
- Examples: Thumbnail blur (Search page), engagement buttons (Watch page)

### User Interface Organization

In the extension settings, global navigation controls appear in a dedicated section positioned **above** page-specific settings to emphasize their global scope.

The section is clearly labeled to indicate these controls affect all YouTube pages, not just one page type.

---

### Shorts Blocking Feature

#### Overview

The Shorts Blocking feature provides users with **global control over all YouTube Shorts content** across the entire platform. This feature is part of the Global Navigation Settings and applies uniformly to all YouTube pages, providing a single toggle to control Shorts visibility in all contexts.

#### Key Characteristics

- **Scope:** Single global setting that controls all Shorts content across all YouTube pages
- **Default Behavior:** **All Shorts content is blocked by default** (minimalist principle)
- **Comprehensive Control:** One toggle controls Shorts URLs, search results, creator profile tabs, and home tab content
- **Integration:** Uses the existing channel blocking infrastructure (blocked page redirect) for URL blocking

#### Behavior Details

**When Shorts are Blocked (Default):**
- Direct navigation to any `/shorts/...` URL (e.g., `https://www.youtube.com/shorts/TUNcmnOYYTg`) is **intercepted**
- User is immediately redirected to the **blocked page** (`blocked/index.html`)
- Block page displays a Shorts-specific message: "YouTube Shorts are blocked."
- Blocked URL is shown for reference
- "Go Back" button navigates user to YouTube Home
- **Shorts are hidden from search results** (no Shorts appear in search)
- **Shorts tab is hidden on creator profile pages** (tab completely removed)
- **Shorts shelves are hidden in creator profile Home tabs** (no Shorts content shown)

**When Shorts are Enabled:**
- Direct Shorts URLs function normally
- No redirection occurs
- Shorts videos play as expected
- **Shorts appear in search results** as part of normal search results
- **Shorts tab is visible on creator profile pages**
- **Shorts shelves appear in creator profile Home tabs**

#### Global Control Scope

The Shorts Blocking feature uses a **single toggle** to control all Shorts-related content across the platform:

| Content Type | Controlled By | Behavior When Disabled |
|--------------|---------------|------------------------|
| Direct Shorts URLs (`/shorts/...`) | `enableShorts` (Global) | Redirected to block page |
| Shorts in search results | `enableShorts` (Global) | Hidden from search results |
| Shorts tab on creator profiles | `enableShorts` (Global) | Tab hidden completely |
| Shorts in creator profile Home tab | `enableShorts` (Global) | Shorts shelves hidden |

#### User Interface

**Settings Location:**
- **Options Page:** Global Navigation Elements section (after "Enable Hover Previews")
- **Popup:** Global tab (after "Enable Hover Previews")

**Toggle Details:**
- **Label:** "Enable Shorts"
- **Description (Options):** "Enable YouTube Shorts globally across all pages"
- **Tooltip:** "When disabled (default), all Shorts content is blocked including direct Shorts URLs, Shorts in search results, Shorts tabs on creator profiles, and Shorts in creator profile home tabs."
- **Default State:** `false` (blocked)

#### Technical Implementation

**URL Detection Logic:**
- Checks if URL path starts with `/shorts/`
- Runs on initial page load and SPA navigation
- Executes **after** channel blocking checks

**Redirect Mechanism:**
- Uses same block page as channel blocking (`blocked/index.html`)
- Passes query parameters: `blockType=shorts`, `blockedUrl=[original URL]`
- Block page detects `blockType` and displays appropriate message

**Content Filtering:**
- Search page content scripts check `enableShorts` to hide/show Shorts in results
- Creator profile page content scripts check `enableShorts` to hide/show Shorts tab and content
- DOM manipulation uses CSS to hide elements when disabled

**Storage:**
- Setting stored in: `settings.youtube.globalNavigation.enableShorts`
- Type: `boolean`
- Default: `false`
- Syncs via Chrome Storage API

#### Success Criteria

The Shorts Blocking feature is considered **successfully implemented** when:

- ✅ Direct Shorts URLs (`/shorts/...`) are blocked by default
- ✅ Blocked Shorts URLs redirect to the block page with correct message
- ✅ Block page clearly states "YouTube Shorts are blocked" with instructions
- ✅ Shorts are hidden from search results when disabled
- ✅ Shorts tab is hidden on creator profiles when disabled
- ✅ Shorts shelves are hidden in creator profile Home tabs when disabled
- ✅ Enabling the toggle allows all Shorts content to function normally across all pages
- ✅ Toggle appears in both Options page (Global Navigation) and Popup (Global tab)
- ✅ Tooltip explains the unified global scope (all Shorts content, all pages)
- ✅ No performance impact or flickering during URL checks or content filtering
- ✅ Works correctly with YouTube SPA navigation
- ✅ All code passes lint, format, and type checks

---

### Posts Blocking Feature

#### Overview

The Posts Blocking feature provides users with **global control over all YouTube Community Posts content** across the entire platform. This feature is part of the Global Navigation Settings and applies uniformly to all YouTube pages, providing a single toggle to control Posts visibility in all contexts.

#### Key Characteristics

- **Scope:** Single global setting that controls all Posts content across all YouTube pages
- **Default Behavior:** **All Posts content is blocked by default** (minimalist principle)
- **Comprehensive Control:** One toggle controls Posts URLs, search results, creator profile tabs, and home tab content
- **Integration:** Uses the existing channel blocking infrastructure (blocked page redirect) for URL blocking

#### Behavior Details

**When Posts are Blocked (Default):**
- Direct navigation to any `/post/...` URL (e.g., `https://www.youtube.com/post/Ugkx9qLawJCXRvR27Us6sFIOcHEvm8jk3_-2`) is **intercepted**
- User is immediately redirected to the **blocked page** (`blocked/index.html`)
- Block page displays a Posts-specific message: "YouTube Posts are blocked."
- Blocked URL is shown for reference
- "Go Back" button navigates user to YouTube Home
- **Community Posts are hidden from search results** (no Posts appear in search)
- **Posts tab is hidden on creator profile pages** (tab completely removed)
- **Community Posts are hidden in creator profile Home tabs** (no Posts content shown)

**When Posts are Enabled:**
- Direct Posts URLs function normally
- No redirection occurs
- Posts content displays as expected
- **Community Posts appear in search results** as part of normal search results
- **Posts tab is visible on creator profile pages**
- **Community Posts appear in creator profile Home tabs**

#### Global Control Scope

The Posts Blocking feature uses a **single toggle** to control all Posts-related content across the platform:

| Content Type | Controlled By | Behavior When Disabled |
|--------------|---------------|------------------------|
| Direct Posts URLs (`/post/...`) | `enablePosts` (Global) | Redirected to block page |
| Community Posts in search results | `enablePosts` (Global) | Hidden from search results |
| Posts tab on creator profiles | `enablePosts` (Global) | Tab hidden completely |
| Community Posts in creator profile Home tab | `enablePosts` (Global) | Posts hidden |

#### User Interface

**Settings Location:**
- **Options Page:** Global Navigation Elements section (after "Enable Shorts")
- **Popup:** Global tab (after "Enable Shorts")

**Toggle Details:**
- **Label:** "Enable Posts"
- **Description (Options):** "Enable YouTube Posts globally across all pages"
- **Tooltip:** "When disabled (default), all Posts content is blocked including direct Posts URLs, Community Posts in search results, Posts tabs on creator profiles, and Posts in creator profile home tabs."
- **Default State:** `false` (blocked)

#### Technical Implementation

**URL Detection Logic:**
- Checks if URL path starts with `/post/`
- Runs on initial page load and SPA navigation
- Executes in parallel with Shorts URL checking

**Redirect Mechanism:**
- Uses same block page as channel and Shorts blocking (`blocked/index.html`)
- Passes query parameters: `blockType=posts`, `blockedUrl=[original URL]`
- Block page detects `blockType` and displays appropriate message

**Content Filtering:**
- Search page content scripts check `enablePosts` to hide/show Community Posts in results
- Creator profile page content scripts check `enablePosts` to hide/show Posts tab and content
- DOM manipulation uses CSS to hide elements when disabled

**Storage:**
- Setting stored in: `settings.youtube.globalNavigation.enablePosts`
- Type: `boolean`
- Default: `false`
- Syncs via Chrome Storage API

#### Success Criteria

The Posts Blocking feature is considered **successfully implemented** when:

- ✅ Direct Posts URLs (`/post/...`) are blocked by default
- ✅ Blocked Posts URLs redirect to the block page with correct message
- ✅ Block page clearly states "YouTube Posts are blocked"
- ✅ Community Posts are hidden from search results when disabled
- ✅ Posts tab is hidden on creator profiles when disabled
- ✅ Community Posts are hidden in creator profile Home tabs when disabled
- ✅ Enabling the toggle allows all Posts content to function normally across all pages
- ✅ Toggle appears in both Options page (Global Navigation) and Popup (Global tab)
- ✅ Tooltip explains the unified global scope (all Posts content, all pages)
- ✅ No performance impact or flickering during URL checks or content filtering
- ✅ Works correctly with YouTube SPA navigation
- ✅ All code passes lint, format, and type checks

---

### Search Suggestions Feature

#### Overview

The Search Suggestions feature provides users with **global control over YouTube's search autocomplete dropdown** across the entire platform. This feature is part of the Global Navigation Settings and applies uniformly to all YouTube pages, providing a single toggle to control search suggestions visibility.

#### Key Characteristics

- **Scope:** Single global setting that controls search suggestions across all YouTube pages
- **Default Behavior:** **Search suggestions are hidden by default** (minimalist principle)
- **Purpose:** Eliminates algorithmic nudges and distractions when using the search bar

#### Behavior Details

**When Search Suggestions are Disabled (Default):**
- Search autocomplete dropdown does not appear when typing in the search bar
- No search history or trending suggestions are shown
- Users must type their complete search query and press Enter
- Creates a more intentional, distraction-free search experience

**When Search Suggestions are Enabled:**
- YouTube's native search autocomplete dropdown appears when typing
- Search history and trending suggestions display as normal
- Standard YouTube search experience is preserved

#### User Interface

**Settings Location:**
- **Options Page:** Global Navigation Elements section (after "Enable Posts")
- **Popup:** Global tab (after "Posts")

**Toggle Details:**
- **Label:** "Enable Search Suggestions"
- **Description (Options):** "Enable search suggestions (autocomplete dropdown)"
- **Tooltip:** "When disabled (default), the search suggestions dropdown is hidden to reduce distractions and algorithmic nudges. When enabled, YouTube's native search suggestions appear when typing in the search box."
- **Default State:** `false` (hidden)

#### Success Criteria

The Search Suggestions feature is considered **successfully implemented** when:

- ✅ Search suggestions dropdown is hidden by default across all YouTube pages
- ✅ Enabling the toggle allows search suggestions to appear normally
- ✅ Toggle appears in both Options page (Global Navigation) and Popup (Global tab)
- ✅ Tooltip clearly explains the feature's purpose and default behavior
- ✅ No performance impact or flickering when typing in the search box
- ✅ Works correctly with YouTube SPA navigation across all pages
- ✅ Settings persist across browser sessions

---

## YouTube Module Pause Feature

### Overview

The YouTube Module Pause feature allows users to temporarily disable all Fockey modifications to YouTube, returning the platform to its original, unmodified experience. This feature provides flexibility for moments when users need full access to YouTube's native features without permanently changing their carefully configured minimalist settings.

When paused, YouTube works exactly as it would without the extension installed—all hidden elements, blocked content, and custom behaviors are temporarily suspended.

### Key Characteristics

- **Scope:** Module-level control that affects all YouTube pages simultaneously
- **Default Behavior:** YouTube module is active (not paused)
- **Temporary Nature:** Pause can be time-based or indefinite (manual resume)
- **Settings Preservation:** All extension settings remain saved and unchanged during pause
- **Instant Restoration:** When resumed, all minimalist features immediately return

### Pause Options

Users can pause the YouTube module using multiple duration presets or a custom time period:

**Preset Durations:**
- **15 minutes** — Short break for quick tasks
- **1 hour** — Moderate break for extended browsing
- **For today** — Paused until midnight (end of current day)
- **Custom time** — User-defined hours and minutes
- **Disable (resume manually)** — Indefinite pause with no automatic resume

**Custom Time:**
- Users can specify exact hours and minutes for the pause duration
- Minimum duration: 1 minute
- Maximum duration: Unlimited (when using "Disable" option)

### Behavior Details

**When YouTube Module is Paused:**
- YouTube displays exactly as the original platform (no extension modifications)
- All minimalist features are suspended:
  - Hidden navigation elements become visible (logo, sidebar, profile, notifications)
  - Blocked content becomes accessible (Shorts, Posts)
  - Hidden page elements return (thumbnails, recommendations, comments, etc.)
  - All custom CSS and DOM modifications are removed
- Extension continues running in the background
- Settings remain saved and unchanged
- Users can resume at any time (unless paused indefinitely)

**When YouTube Module is Resumed:**
- All minimalist features immediately return without page refresh
- YouTube returns to configured minimalist mode
- Hidden elements disappear instantly
- Blocked content becomes inaccessible again
- Navigation and page behavior restore to extension-controlled state

### User Interface

**Pause Button (Options Page):**
- Located in the YouTube Settings card header (top-right)
- Shows current status: "Pause" when active, "Resume" when paused
- Single click opens the pause/resume modal

**Pause Modal:**
- **Title:** "For how long do you want to pause?"
- **Description:** "YouTube will return to its original experience during the pause"
- **Preset Options:** Clean, card-style buttons for each duration
- **Custom Time:** Expandable section with hour/minute inputs and "Start" button
- **Disable Option:** Clearly labeled with warning styling to indicate indefinite pause
- **Resume Mode:** When paused, modal changes to "Resume YouTube Module?" with single "Resume Now" button

**Status Indicators:**

**Options Page:**
- **Paused State Banner:** Amber-themed notification banner displayed prominently below YouTube Settings header
- **Countdown Timer:** Live, real-time countdown showing remaining time (e.g., "23m 45s" or "1h 15m 30s")
- **Expiration Time:** "Resumes at [time]" for clarity
- **Indefinite Pause:** Shows "Paused indefinitely" message with "Resume" button

**Popup:**
- **Three-Dots Overflow Menu:** Added to YouTube module card (top-right corner)
- **Menu Action:** "Pause YouTube Module" or "Resume YouTube Module" depending on current state
- **Status Indication:** When paused, shows countdown timer in popup header
- **Consistent Behavior:** Same pause modal used in both Options and Popup

### Lock Mode Integration

The YouTube Module Pause feature respects Lock Mode restrictions:

**When Lock Mode is Active:**
- **Cannot pause** — Pause button is disabled in Options page
- **Cannot resume** — Resume action is disabled in popup overflow menu
- **Visual Feedback:** Disabled state clearly indicated with reduced opacity
- **Tooltip Explanation:** Hovering shows "Cannot pause while Lock Mode is active"
- **Rationale:** Lock Mode prevents all settings changes, including pause state, to enforce commitment

**When Lock Mode is Inactive:**
- Full pause and resume functionality available
- No restrictions on duration selection
- Users have complete control over pause state

### Automatic Resume

**Time-Based Pause:**
- Chrome alarm automatically triggers resume when countdown reaches zero
- Resume happens silently in the background
- No notifications or interruptions
- YouTube immediately returns to minimalist mode on next page interaction
- Works correctly even if browser is closed during pause period

**Indefinite Pause:**
- No automatic resume
- Requires manual resume action from user
- Persists across browser restarts
- Clear "Resume" action available in both Options and Popup

### Real-Time Updates

**Countdown Timer:**
- Updates every second with precise remaining time
- Format adapts to duration: "23m 45s", "1h 15m 30s", "2d 5h 30m"
- Consistent across Options page and Popup
- No page refresh required

**Cross-Context Synchronization:**
- Pause/resume actions immediately reflect across all open YouTube tabs
- Options page and Popup stay synchronized
- Changes propagate instantly without manual refresh

### Success Criteria

The YouTube Module Pause feature is considered **successfully implemented** when:

- ✅ Users can pause the YouTube module from both Options page and Popup
- ✅ Preset durations (15 min, 1 hr, today) work correctly
- ✅ Custom time input allows flexible hour/minute combinations
- ✅ "Disable" option creates indefinite pause requiring manual resume
- ✅ When paused, YouTube returns to completely original experience (no extension modifications)
- ✅ When resumed, all minimalist features return instantly without page refresh
- ✅ Countdown timer updates in real-time and displays accurate remaining time
- ✅ Automatic resume triggers silently at scheduled time
- ✅ Pause state persists across browser restarts
- ✅ Lock Mode prevents pause/resume actions when active
- ✅ Status indicators clearly show pause state in Options page and Popup
- ✅ Modal interface is polished, intuitive, and consistent across contexts
- ✅ No performance impact or visual glitches during pause/resume transitions

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

All persistent navigation elements (YouTube logo, left sidebar, profile avatar, notifications bell) and content blocking (Shorts, Posts) are controlled by the **Global Navigation settings** described in the "Global Navigation Elements" section above.

These settings apply globally across all YouTube pages, not just the Search page.

**Page-Specific Content Options:**
- ☑️ Show Mixes / Playlists

**Page-Specific Visual Adjustments:**
- ☑️ **Thumbnail blur** (instead of hide) — reduces visual stimulation while keeping structural awareness of thumbnails

**Important:** By default, **all header/sidebar elements and distracting content are hidden** to maintain focus. Users must explicitly opt-in to restore any of these elements via the extension settings.

Shorts and Community Posts visibility in search results is controlled by the global **Enable Shorts** and **Enable Posts** toggles (see Global Navigation Elements section).

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
- ✅ Shorts and posts are removed from results (controlled by global Enable Shorts and Enable Posts toggles)
- ✅ Algorithmic suggestions are removed from results
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

All persistent navigation elements (YouTube logo, left sidebar, profile avatar, notifications bell) and content blocking (Shorts, Posts) are controlled by the **Global Navigation settings** described in the "Global Navigation Elements" section above.

These settings apply globally across all YouTube pages, not just the Creator Profile page.

**Channel Action Buttons:**

Channel action buttons (Subscribe, Join, Notifications Bell, See Perks) are **always visible** on creator profile pages by default and are **not configurable** on this page. These buttons are essential for creator-viewer interaction and engagement. Users can control these buttons specifically on the Watch page if desired.

**Important:** By default, **all header/sidebar elements and distraction-prone content are hidden** to maintain focus. Users must explicitly opt-in to restore any of these elements via the extension settings.

Shorts and Posts visibility on creator profiles (tabs and home tab content) is controlled by the global **Enable Shorts** and **Enable Posts** toggles (see Global Navigation Elements section).

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
- ✅ Shorts and Posts tabs are hidden by default (controlled by global Enable Shorts and Enable Posts toggles)
- ✅ Shorts content is filtered out of all tabs (controlled by global Enable Shorts toggle)
- ✅ Community posts are filtered out of all tabs (controlled by global Enable Posts toggle)
- ✅ Channel action buttons (Subscribe, Join, Notifications Bell, See Perks) remain always visible and are not configurable
- ✅ Native YouTube channel navigation and tab switching remain intact
- ✅ Channel metadata and creator information remain fully accessible
- ✅ Visual design matches the minimalist style of the Home and Search pages
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

## General Module — Time-Based Website Blocking

### Overview

The General Module extends Fockey's minimalist philosophy beyond YouTube by providing **scheduled, time-based blocking of any website or web content** across the entire internet. Users can create focused work environments by blocking distracting websites during specific days and times.

Each schedule defines **when** to block (days + time periods) and **what** to block (domains, URL keywords, or page content). Multiple schedules can run simultaneously for different contexts (e.g., "Work Hours", "Evening Study", "Weekend Detox").

---

### How Schedules Work

A **Blocking Schedule** consists of:

**1. Schedule Identity**
- **Name:** Custom label (e.g., "Work Hours Focus")
- **Icon:** Optional emoji for visual identification (💼, 📚, 🎯)
- **Status:** Enabled or disabled (can be toggled on/off)

**2. Active Time**
- **Days:** Any combination of weekdays, weekend, or specific days
- **Time Periods:** One or more time windows per day in 24-hour format (e.g., "09:00 - 17:00")
  - Periods cannot cross midnight (must stay within 00:00 - 23:59)
  - New periods auto-populate 1 minute after the previous period ends
  - System warns if periods overlap

**3. Blocking Rules** (at least one required)
- **Domains:** Block entire websites with automatic subdomain inheritance
- **URL Keywords:** Block pages containing specific keywords in the URL
- **Content Keywords:** Block pages containing specific keywords in visible text

**Example Schedule:**
- **Name:** "Work Hours Focus"
- **Days:** Monday - Friday
- **Time:** 9:00 AM - 5:00 PM
- **Blocks:** reddit.com, twitter.com, /shorts, cryptocurrency
- **Result:** All specified sites and content are blocked during weekday work hours

---

### Schedule Templates

Schedule Templates are **predefined configurations** that help users quickly create new schedules with common blocking patterns. Templates are **not active schedules** — they serve as starting points that pre-fill the schedule creation form.

#### Available Templates

**1. 24/7 Template** (⏰ Clock icon)
- **Days:** Every day (Monday - Sunday)
- **Time:** All day (00:00 - 23:59)
- **Use Case:** Continuous blocking for sites that should always be inaccessible

**2. Work Template** (💼 Briefcase icon)
- **Days:** Weekdays (Monday - Friday)
- **Time:** 8:00 AM - 6:00 PM
- **Use Case:** Focus during standard work hours

**3. Digital Detox Template** (🧘 Meditation icon)
- **Days:** Weekends (Saturday - Sunday)
- **Time:** All day (00:00 - 23:59)
- **Use Case:** Complete digital disconnect during weekends

#### How Templates Work

**Selecting a Template:**
1. User clicks **"Use Template"** button on any template card
2. Schedule creation dialog opens with pre-filled fields:
   - Schedule name (e.g., "24/7", "Work", "Digital Detox")
   - Icon (template emoji)
   - Days (pre-selected based on template)
   - Time periods (pre-configured times)
   - Blocking rules section (empty — user adds their own)
3. User reviews, edits as needed, adds blocking rules, and saves

**Template Benefits:**
- Quick setup for common blocking patterns
- Consistent scheduling across users
- Reduces configuration time and errors
- Educational — shows users example configurations

**Visual Presentation:**
- Templates appear below the schedules list in the Time-Based Schedules section
- Card-based layout with centered content
- Large emoji icons for visual identification
- Human-readable day and time formatting (e.g., "Weekdays", "8:00 AM → 6:00 PM")
- Disabled during Lock Mode

**Important:** Templates are **read-only presets** stored in the application code. They cannot be edited or deleted by users. Users create their own schedules by using templates as starting points.

---

### Blocking Strategies

#### Domain Blocking

Block entire websites by domain name. Blocking a domain automatically blocks all subdomains.

**Examples:**
- Block `reddit.com` → Also blocks `www.reddit.com`, `old.reddit.com`, `new.reddit.com`
- Block `youtube.com` → Also blocks `www.youtube.com`, `m.youtube.com`, `music.youtube.com`

**Input Formats:**
- Domain only: `reddit.com`
- Full URL: `https://www.reddit.com/r/programming` (auto-normalized to `reddit.com`)
- Subdomain: `news.ycombinator.com`

#### URL Keyword Blocking

Block pages whose URLs contain specific keywords (case-insensitive).

**Examples:**
- Keyword `shorts` blocks: `youtube.com/shorts/abc123`, `tiktok.com/shorts/xyz789`
- Keyword `gaming` blocks: `reddit.com/r/gaming`, `youtube.com/gaming/live`

#### Content Keyword Blocking

Hide specific elements on a page that contain certain keywords in their text or media metadata (case-insensitive). Unlike domain and URL keyword blocking, content keywords **do not redirect to the blocked page**—they apply a blur effect to matching elements while allowing the rest of the page to remain visible.

**How it works:**
- Elements containing the keyword in their text content are blurred
- Images and media with the keyword in their metadata (src, alt, title, aria-label) are also blurred
- Blocking is applied automatically when rules are added (no page reload required)
- Multiple elements can be blurred on a single page

**Examples:**
- Keyword `cryptocurrency` blurs any text block, headline, or image related to "cryptocurrency"
- Keyword `breaking news` blurs news articles and thumbnails containing "breaking news"

**Note:** Content keyword blocking requires the page to load before checking, as it analyzes visible page content and media attributes.

---

### Schedules Management

#### Schedules List

**Visual Layout:**
- **Card-based display** with centered content layout
- Each card features:
  - **Large emoji icon** at center-top (or calendar icon placeholder if no emoji selected)
  - **Schedule name** in large, bold text
  - **Days** formatted naturally (e.g., "Mon - Fri", "Every day", "Weekends")
  - **Time periods** formatted with arrows (e.g., "9:00 AM → 5:00 PM")
  - **Status indicator**: "Active" badge with play icon (green theme) when enabled

**Blocking Rules Display:**
- **Interactive hover cards** showing blocking rules with counts
- Three color-coded badge categories:
  - **Domains** (red/rose theme) - Shows count (e.g., "5 domains")
  - **URL Keywords** (orange theme) - Shows count (e.g., "3 keywords")
  - **Content Keywords** (amber theme) - Shows count (e.g., "2 keywords")
- Hover over badge reveals full list of items in scrollable card
- Consistent color coding with Quick Block

**Actions:**
- **Options menu** (dropdown) in top-right corner of each card:
  - **Pause/Resume** - Toggles schedule enabled state
  - **Delete** - Removes schedule (with confirmation dialog)
- **Click card to edit** (opens edit dialog)
- All interactive elements disabled during Lock Mode

**Empty State:**
- Calendar icon in circle
- Message: "No schedules configured"
- Guides users to click "+ Add Schedule" button

**Delete Confirmation:**
- Alert dialog requires explicit confirmation
- Message: "Are you sure you want to delete this schedule? This action cannot be undone."
- Prevents accidental deletion

#### Create/Edit Schedule

**Edit Dialog Interface:**

**Schedule Info Card:**
- **Name input field** (required)
- **Icon selector** with emoji options:
  - 9 emoji choices: 🎯 🔒 🚫 ⏰ 📚 💼 🏃 🧘
  - Optional selection (calendar icon used if none selected)

**Days Selector Card:**
- **7 individual day buttons** (Sun - Sat)
- **Quick select buttons** for convenience:
  - "All" - Select every day
  - "Weekdays" - Monday through Friday
  - "Weekend" - Saturday and Sunday
  - "Clear" - Deselect all days
- Selected days highlighted with primary color
- Visual feedback on selection state

**Active Time Periods Card:**
- **Multiple time periods** supported per schedule
- Each period displays:
  - Clock icon for visual clarity
  - Period number (Period 1, Period 2, etc.)
  - Start time input (24-hour format)
  - Arrow separator
  - End time input (24-hour format)
  - Remove button (if more than 1 period exists)

**Time Period Management:**
- **"Add Period" button** to create additional time windows
- **Auto-populated defaults**: New periods start 1 minute after previous period ends
- **Overlap detection** with visual error highlighting (destructive color)
- **Validation rules**:
  - Cannot overlap with other periods
  - Must stay within same day (00:00 - 23:59)
  - At least 1 hour remaining in day for new periods
- **Real-time error messages** for time conflicts

**What to Block Section:**
- **Collapsible container** with expand/collapse icon
- **Three subsections** with visual separators:

**1. Blocked Domains** (Globe icon, red theme)
  - Domain input field with "Add" button
  - Domain validation (requires valid TLD, supports wildcards)
  - Badge display with removal buttons
  - Error handling for invalid formats
  - Empty state message when no domains added
  - Helper text with examples

**2. URL Keywords** (Link icon, orange theme)
  - Keyword input field with "Add" button
  - No validation (any text accepted)
  - Badge display with removal buttons
  - Helper text explaining functionality

**3. Content Keywords** (FileText icon, amber theme)
  - Keyword input field with "Add" button
  - No validation (any text accepted)
  - Badge display with removal buttons
  - Helper text explaining functionality

**Validation & Error Feedback:**
- **Error summary card** with red background appears when validation fails
- Lists all validation errors:
  - Schedule name required
  - At least one day must be selected
  - At least one time period required
  - No overlapping time periods allowed
  - At least one blocking rule (domain, URL keyword, or content keyword) required
- Prevents saving until all errors resolved

**Action Buttons:**
- **"Cancel" button** (outline variant) - Closes dialog without saving
- **"Save Schedule" button** (primary variant) - Saves changes and updates list
- Save button disabled until all validation passes

#### Lock Mode Integration

**When Lock Mode is Active:**
- **All schedule editing blocked** - Edit dialog cannot be opened
- **Schedule deletion blocked** - Delete option disabled in menu
- **Pause/Resume blocked** - Cannot toggle schedule enabled state
- **Visual feedback**: Reduced opacity on locked schedules, disabled state on controls
- **Tooltip on hover**: Explains lock status and expiration time
- **Read-only access preserved**: Users can still view schedule details for reference

---

### Blocked Page

When a schedule blocks a page via domain or URL keyword rules, users are redirected to the blocked page with:

- **Block message** indicating why the page was blocked:
  - Domain blocks: "This domain (**example.com**) is blocked by schedule **Work Hours Focus**"
  - URL keyword blocks: "This URL contains the blocked keyword: **shorts**"
- **Schedule name** that triggered the block
- **Active time period** (e.g., "Active: 09:00 - 17:00")
- **Go Back button** to navigate away
- **Blocked URL** displayed at the bottom

**Note:** Content keyword blocking does not redirect to this page—it blurs matching elements directly on the page instead (see Content Keyword Blocking section above).

---

### Quick Block

Quick Block is a **fast, temporary blocking feature** designed for immediate focus sessions. Users can instantly block selected websites and keywords for a predefined duration without creating a full schedule.

#### Two Main States

**1. Configuration State (Inactive)**

When no Quick Block session is active, users configure what to block:

**Configure Blocking Rules:**
- **Three-tab interface** (Domains, URL Keywords, Content Keywords)
- Add items inline with immediate validation
- Tab-specific helper text with examples
- Color-coded by type (Domains: red, URL Keywords: orange, Content Keywords: amber)
- Items configured here are session-specific (cleared when session ends)

**Start Quick Block:**
- **Preset duration buttons** displayed in grid layout:
  - 25 minutes
  - 1 hour
  - 8 hours
  - 24 hours
  - Custom time (opens dialog with hours/minutes inputs)
- **"Start Quick Block" button** (disabled until at least one item is configured)
- **Indefinite sessions** supported (no time limit option available via custom time dialog)
- Configuration status displayed below button

**Lock Mode Warning:**
- When starting a session while Lock Mode is active, warning dialog appears
- Explains that stopping the session will be blocked by Lock Mode
- Requires explicit "Start Anyway" confirmation
- Different messaging for indefinite vs. timed sessions

**2. Active Session State**

When a Quick Block session is running:

**Large Timer Display:**
- Prominent countdown timer in amber/orange theme
- Shows remaining time (e.g., "1h 23m 45s") or "No Time Limit" for indefinite sessions
- End time displayed (e.g., "Ends at 3:30 PM")
- Large, bold font for visibility
- Real-time updates every second

**Currently Blocking Section:**
- Grouped display of all active blocking rules
- Color-coded headers by category:
  - Domains (red/rose theme)
  - URL Keywords (orange theme)
  - Content Keywords (amber theme)
- Badge display with item counts
- Read-only during active session (cannot edit rules)

**Session Controls:**
- **"Extend Time" button** (for timed sessions only)
  - Opens dialog with preset duration options (25min, 1hr, 24hrs)
  - Adds time to current session
  - Available even when Lock Mode is active
- **"Stop Session" button** (destructive variant)
  - Requires confirmation dialog before stopping
  - Disabled when Lock Mode is active
  - Confirmation message: "Your configured items will be saved for future sessions"

**Blocking Behavior:**
- Blocked pages redirect to blocked page with "Quick Block ends in [time]" message
- Shows remaining session time on blocked page
- For indefinite sessions, shows "No time limit" message

**Session Expiration:**
- **Silent automatic expiration** when countdown reaches zero
- **Toast notification** confirming session ended
- UI automatically returns to configuration state
- Configured items cleared (not persisted)

#### Blocklist Library

Quick Block maintains a **session-specific library** of configured items:
- Items added during configuration remain in the interface during that browser session
- Library cleared when configuration state is reset
- Does not persist across browser restarts
- Quick reuse within same session

#### Lock Mode Integration

**Starting Sessions:**
- **Warning dialog** when attempting to start while Lock Mode is active
- Explains inability to stop until Lock Mode expires
- Requires explicit confirmation to proceed
- Prevents accidental commitment conflicts

**During Active Sessions:**
- **Cannot stop session** when Lock Mode is active (button disabled)
- **Can extend time** even with Lock Mode active (commitment reinforcement)
- Creates powerful commitment mechanism for uninterrupted focus sessions
- Tooltip explains why stop is disabled

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
| **Global Navigation**      | Enable Shorts              | Off     | Yes          | All pages      |
| **Global Navigation**      | Enable Posts               | Off     | Yes          | All pages      |
| **Global Navigation**      | Enable Search Suggestions  | Off     | Yes          | All pages      |
| **YouTube Module Pause**   | Pause YouTube module       | Off     | Yes          | All pages      |
| **YouTube Module Pause**   | Preset durations           | N/A     | Yes          | All pages      |
| **YouTube Module Pause**   | Custom duration            | N/A     | Yes          | All pages      |
| **YouTube Module Pause**   | Indefinite pause           | N/A     | Yes          | All pages      |
| **YouTube Module Pause**   | Automatic resume           | On      | No           | All pages      |
| **YouTube Module Pause**   | Real-time countdown        | On      | No           | All pages      |
| **Channel Blocking**       | Block specific channels    | Off     | Yes          | All pages      |
| **Channel Blocking**       | Blocked page redirect      | On      | No           | All pages      |
| **Channel Blocking**       | Filter blocked content     | On      | No           | All pages      |
| **Lock Mode**              | Activate lock              | Off     | Yes          | All pages      |
| **Lock Mode**              | Extend lock                | N/A     | Yes          | All pages      |
| **Lock Mode**              | Silent unlock              | On      | No           | All pages      |
| **Lock Mode**              | Block settings changes     | On      | No           | All pages      |
| **Lock Mode**              | Allow channel blocking     | On      | No           | All pages      |
| **General Module**         | Time-based schedules       | Off     | Yes          | All sites      |
| **General Module**         | Schedule Templates         | On      | No           | All sites      |
| **General Module**         | Quick Block                | Off     | Yes          | All sites      |
| **General Module**         | Domain blocking            | Off     | Yes          | All sites      |
| **General Module**         | URL keyword blocking       | Off     | Yes          | All sites      |
| **General Module**         | Content keyword blocking   | Off     | Yes          | All sites      |
| **Home**            | Search bar                 | On      | No           | Home only      |
| **Home**            | Feed, Shorts               | Off     | N/A          | Home only      |
| **Search**          | Search bar, Results        | On      | No           | Search only    |
| **Search**          | Mixes / Playlists          | Off     | Yes          | Search only    |
| **Search**          | Thumbnail blur             | Off     | Yes          | Search only    |
| **Creator**         | Channel info & tabs        | On      | No           | Creator only   |
| **Creator**         | Channel action buttons     | On      | No           | Creator only   |
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

