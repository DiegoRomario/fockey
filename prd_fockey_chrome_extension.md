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

The Search Page is displayed after submitting a query via the search bar.

#### Default (Minimalist Mode)

**Visible Elements (Default):**

- ✅ Search bar
- ✅ Filters button
- ✅ Video search results (long‑form videos only)

**Hidden Elements (Default):**

- Shorts in search results
- Community posts
- Mixes
- Sponsored content (where technically possible)
- Irrelevant suggestion blocks

**Behavior Details:**

- Only traditional long‑form videos are rendered
- Layout remains identical to YouTube’s native search UX, minus removed elements

**Observed from images:**

- Filters remain fully functional
- Shorts and posts do not appear between video results
- Summary overlays can remain visible when attached to videos

---

#### Filters (Native YouTube)

Fockey preserves all native filters, including:

- Upload date
- Video duration
- Quality (HD / 4K)
- Type (Video / Channel / Playlist)
- Sort order

---

#### Configurable Options (Search Page)

Users can enable:

- Shorts
- Community posts
- Thumbnail blur (instead of hide)

Thumbnail blur helps reduce visual stimulation while keeping structural awareness.

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

