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
  - Watch Page Sub‑Module

Each sub‑module manages DOM manipulation, visibility toggles, and UI overrides for its specific YouTube page type.

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

Users can selectively enable:

- YouTube logo
- Hamburger menu
- Left sidebar
- Profile avatar
- Notifications button

Each option is independent and toggleable via settings.

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

Users can selectively re-enable hidden elements via the extension settings:

**Content Options:**
- ☑️ Show Shorts in search results
- ☑️ Show Community posts
- ☑️ Show Mixes / Playlists
- ☑️ Show sponsored content (if detectable)

**Visual Adjustments:**
- ☑️ **Thumbnail blur** (instead of hide) — reduces visual stimulation while keeping structural awareness of thumbnails

**Navigation Options (Advanced):**
- ☑️ Show YouTube logo
- ☑️ Show hamburger menu
- ☑️ Show left sidebar
- ☑️ Show profile avatar
- ☑️ Show notifications button

**Important:** By default, **all navigation and chrome elements are hidden** to maintain focus. Users must explicitly opt-in to restore any of these elements.

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

### 3. Watch Page Sub‑Module

The Watch Page is where the user watches a selected video.

#### Default (Minimalist Mode)

**Visible Elements (Default):**

- ✅ Search bar
- ✅ Video player
- ✅ Video title
- ✅ Video description

**Hidden Elements (Default):**

- Like button
- Dislike button
- Share button
- Save button
- Download button
- Clip button
- Thanks / Join / Membership buttons
- Subscribe button
- Comments section
- Live chat (if applicable)
- Channel avatar
- Channel name block
- Related / recommended videos (right sidebar)
- Creator‑recommended end‑screen videos
- Playlists sidebar

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

Users can enable:

**Engagement Controls**

- Like / Dislike
- Share
- Save
- Download
- Clip

**Channel Controls**

- Subscribe button
- Join / Membership button
- Channel info section

**Social Elements**

- Comments section
- Live chat

**Discovery Elements**

- Related videos sidebar
- Playlists
- Creator‑recommended end‑screen videos

Each element is individually toggleable.

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

| Page   | Feature                    | Default | Configurable |
| ------ | -------------------------- | ------- | ------------ |
| Home   | Search bar                 | On      | No           |
| Home   | Feed, Shorts, Sidebar      | Off     | Yes          |
| Search | Long‑form videos           | On      | No           |
| Search | Shorts / Posts             | Off     | Yes          |
| Watch  | Video                      | On      | No           |
| Watch  | Engagement buttons         | Off     | Yes          |
| Watch  | Comments / Recommendations | Off     | Yes          |

---

## Success Metrics (Qualitative)

- Reduced visual clutter
- Increased intentional search behavior
- Positive feedback from productivity‑focused users

---

## Version

**v1.0 — YouTube Module Only**

