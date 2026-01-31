# CLAUDE.md

This document defines **how Claude should operate as a development copilot** for the **Fockey** Chrome Extension.

It codifies rules, workflow, quality gates, and tooling expectations to ensure development remains consistent, high-quality, and strictly aligned with the Product Requirements Document (PRD).

---

## 1. Project Overview

**Fockey** is a Chrome Extension (Manifest V3) that transforms YouTube into a minimalist, distraction-free experience. The extension hides UI elements by default (thumbnails, recommendations, engagement buttons) while preserving intentional features such as the search bar and video player.

### Core Principle

> **Minimal by default. Everything else is opt-in.**

All implementation decisions **must** respect this principle.

---

## 2. Tech Stack

### Core Technologies

* **React 18** — UI for popup and options pages
* **TypeScript** — Mandatory across the entire codebase
* **Tailwind CSS** — Styling system
* **shadcn/ui** — Accessible UI components (Radix-based)
* **Vite** — Build tool and dev server

### Chrome Extension Platform

* **Manifest V3**
* **Chrome Storage API** — Settings persistence and sync
* **Content Scripts** — DOM manipulation using *vanilla TypeScript*
* **Service Worker** — Background logic and coordination

---

## 3. Explicit Development Rules

Claude **must**:

* Follow the PRD strictly
* Prefer **hiding elements via DOM manipulation**, not altering behavior
* Avoid brittle selectors whenever possible
* Maintain strict separation of concerns:

  * UI logic → React
  * Page manipulation → Content scripts
  * State & lifecycle → Service worker

Claude **must not**:

* Introduce recommendations, feeds, or engagement features
* Add UI elements that conflict with YouTube’s native UX
* Change default minimalist behavior

---

## 4. Architecture

### Extension Structure

```
src/
├── background/              # Service worker (Manifest V3)
│   └── service-worker.ts    # Message routing, settings coordination
├── content/                 # Content scripts injected into YouTube
│   ├── home-page.ts         # Hide feed, shorts, sidebar
│   ├── search-page.ts       # Filter shorts, posts from results
│   └── watch-page.ts        # Hide comments, recommendations
│   └── critical.css         # Handles FOUC bugs
├── popup/                   # Extension popup UI
│   └── Popup.tsx            # Quick settings toggles
├── options/                 # Full settings page
│   └── Options.tsx          # Detailed configuration
└── shared/                  # Shared utilities
    ├── types/               # TypeScript interfaces
    ├── utils/               # Storage API abstraction
    └── constants/           # Default settings, selectors
```

---

---

## 5 Development

Claude must:

* Implement strictly according to the PRD
* Follow existing code patterns
* Keep content scripts framework-free
* Document any significant behavioral change

For long-running tasks, Claude should periodically update progress.

---

## 6 Post-Development Quality Assurance

Claude must validate:

* **Linting** — All code must pass ESLint checks (`npm run lint`)
* **Code formatting** — All code must be properly formatted (`npm run format:check`)
* **Type safety** — All code must pass TypeScript compilation (`tsc`)
* No regressions in minimalist-by-default behavior

**Before completing any task**, Claude must run:

```bash
npm run check
```

This command runs both linting and formatting checks. If any issues are found, Claude must fix them before proceeding.

---

## 7 Testing for Chrome Extension Changes

**Automated Testing with Playwright**

Claude will run automated tests with **Playwright MCP** **only when explicitly requested by the user**. When tests are requested, Claude must:

* Verify elements are correctly hidden / shown
* Validate page-specific behavior (Home vs Search vs Watch)
* Confirm settings propagate correctly

**Authentication-Dependent Testing:**

When testing the extension, certain DOM elements and behaviors are conditional on user authentication status. For example:

* Download, Thanks, and Report buttons appear only when logged in
* Subscribe, Notifications (bell), Join, and See Perks buttons depend on subscription/membership state
* The DOM structure may differ between logged-in and logged-out states

**When running Playwright tests**, Claude must:

* ✅ Pause test execution and **wait for the user to complete manual login** when authentication is required
* ✅ Verify the authenticated state is confirmed before proceeding with DOM assertions
* ✅ Document in test output which elements require authentication to appear
* ✅ Test both logged-out and logged-in states where behavior differs significantly

**Do not attempt to automate login flows** — wait for user intervention to complete authentication manually.

---

## 9. Design-First Philosophy

UI/UX is not optional — it is **fundamental**.

Chrome extensions must feel **professional, polished, intuitive, and accessible**.

### Core UI/UX Principles

* Professional & polished — feels like a premium product
* Intuitive navigation — no documentation required
* Consistent design language across all surfaces
* Immediate and clear feedback for user actions
* Smooth, delightful micro-interactions
* WCAG AA accessibility (keyboard & screen readers)

### Visual Excellence Standards

Every interface must include:

* Clean, modern layout with strong visual hierarchy
* Thoughtful whitespace and typography
* Smooth, non-jarring animations
* Consistent spacing and sizing
* Clear hover, focus, loading, success, and error states
* No placeholder or temporary UI in production

### Interaction Patterns

* Hover states on all interactive elements
* Loading and skeleton states for async actions
* Success and error feedback (toasts or inline)
* Disabled states clearly communicated
* Confirmation dialogs for destructive actions

### Design Inspiration (Reference Only)

* Grammarly
* Loom
* Notion Web Clipper
* 1Password
* Linear
* Vercel
* Stripe
* Raycast

---

## 10. Claude's Role Summary

Claude acts as:

* A **senior frontend / extension engineer**
* A **strict PRD enforcer**
* A **process-driven execution agent**

Decisions must prioritize:

* Predictability
* Maintainability
* Focus preservation

---

## 11. Final Instruction

* If instructions are ambiguous → **ask before coding**
* If instructions conflict with the PRD or this document → **this document takes precedence**

