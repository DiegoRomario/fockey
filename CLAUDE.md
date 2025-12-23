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

## 4. Serena MCP — Mandatory Codebase Operations

**Serena MCP is the default tool for all codebase navigation, search, and refactoring operations.**

### Required Usage

Claude **must use Serena MCP** for:

* Searching files, directories, symbols, exports, imports, and references
* Navigating unfamiliar code or large codebases
* Performing safe, precise bulk changes using regular expressions
* Refactoring repeated or structurally similar code
* Renaming symbols or identifiers across multiple files
* Applying mechanical transformations (format changes, API updates, migrations)

### Operational Rules

* **Always evaluate Serena MCP first** before manual search, grep, or free-form edits
* Use Serena MCP to **locate source of truth** instead of guessing file locations
* **Preview matches** before applying modifications
* **Regex-based edits must use Serena MCP** for consistency and safety
* **Cross-file changes require Serena MCP** to confirm scope first

### Fallback Only When Necessary

Skip Serena MCP **only if** it cannot accomplish the task, and briefly state why.

---

## 5. Architecture

### Extension Structure

```
src/
├── background/              # Service worker (Manifest V3)
│   └── service-worker.ts    # Message routing, settings coordination
├── content/                 # Content scripts injected into YouTube
│   ├── home-page.ts         # Hide feed, shorts, sidebar
│   ├── search-page.ts       # Filter shorts, posts from results
│   └── watch-page.ts        # Hide comments, recommendations
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

## 6. Mandatory Development Flow

Claude must **always** follow this workflow.

### 6.1 Initial Context

* Task may be:

  * Explicitly provided by the user
  * Retrieved from **Taskmaster MCP**

**Goal**: Execute the task strictly following the steps below.

---

### 6.2 Step 1 — Analysis & Planning

Claude must:

* Fully understand the task scope
* Identify affected YouTube pages or extension layers
* Define a clear implementation plan
* Identify dependencies and technical constraints
* Retrieve the task from Taskmaster if not explicitly provided

Claude must **present the plan before coding**, unless explicitly instructed otherwise.

---

### 6.3 Step 2 — Task Start (Taskmaster)

Before writing production code, Claude must mark the task as **in-progress**.

**Via MCP Tool:**

```bash
set_task_status(id="TASK_ID", status="in-progress")
```

**Via CLI:**

```bash
task-master set-status --id=TASK_ID --status=in-progress
```

Claude must verify task dependencies before proceeding.

---

### 6.4 Step 3 — Pre-Development Quality Assurance

Claude must:

* Validate the initial codebase state
* Ensure no failing checks already exist
* Avoid stacking changes on top of broken code

If issues are found, Claude must stop and report them.

---

### 6.5 Step 4 — Development

Claude must:

* Implement strictly according to the PRD
* Follow existing code patterns
* Keep content scripts framework-free
* Document any significant behavioral change

For long-running tasks, Claude should periodically update progress.

---

### 6.6 Step 5 — Post-Development Quality Assurance

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

### 6.7 Mandatory Testing for Chrome Extension Changes

⚠️ **Critical Rule**

For **any task related to the Chrome Extension itself** (content scripts, popup UI, options page, service worker, or DOM behavior), Claude **must validate behavior using at least one**:

* ✅ **Playwright MCP** (for testing behavior)

Claude must:

* Verify elements are correctly hidden / shown
* Validate page-specific behavior (Home vs Search vs Watch)
* Confirm settings propagate correctly

**Authentication-Dependent Testing:**

When testing the extension, certain DOM elements and behaviors are conditional on user authentication status. For example:

* Download, Thanks, and Report buttons appear only when logged in
* Subscribe, Notifications (bell), Join, and See Perks buttons depend on subscription/membership state
* The DOM structure may differ between logged-in and logged-out states

**When using Playwright MCP**, Claude must:

* ✅ Pause test execution and **wait for the user to complete manual login** when authentication is required
* ✅ Verify the authenticated state is confirmed before proceeding with DOM assertions
* ✅ Document in test output which elements require authentication to appear
* ✅ Test both logged-out and logged-in states where behavior differs significantly

**Do not attempt to automate login flows** — wait for user intervention to complete authentication manually.

Unverified DOM changes are **not acceptable**.

---

### 6.8 Step 6 — Task Completion (Taskmaster)

After successful validation, Claude must mark the task as **done** and summarize changes.

---

## 7. Documentation & Knowledge Retrieval

When searching for **technical documentation, APIs, or best practices** (e.g., React, TypeScript, Tailwind, Chrome Extensions):

* ✅ **Use Context7 MCP as the primary source of truth**
* Avoid outdated blog posts or unofficial snippets
* Prefer official documentation and stable APIs

Context7 should be used **before making architectural or implementation decisions** based on documentation.

---

## 8. Quality Bar / Definition of Done

A task is considered **DONE** only if:

* ✅ Task was set to *in-progress* before development
* ✅ Code follows the defined tech stack
* ✅ **All lint checks pass** (`npm run lint` returns no errors)
* ✅ **All formatting checks pass** (`npm run format:check` returns no errors)
* ✅ **TypeScript compilation succeeds** (no type errors)
* ✅ Minimalist default behavior is preserved
* ✅ DOM changes are verified via MCP tools
* ✅ No broken UX flows
* ✅ Task is marked as *done* in Taskmaster

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

@./.taskmaster/CLAUDE.md
