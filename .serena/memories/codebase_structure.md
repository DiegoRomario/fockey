# Fockey - Codebase Structure

## Root Directory Structure
```
fockey/
├── .claude/                    # Claude Code configuration
├── .husky/                     # Git hooks (pre-commit, pre-push)
├── .serena/                    # Serena MCP configuration
├── .taskmaster/                # Task Master AI project management
├── dist/                       # Build output (generated)
├── goal/                       # Design mockups/references
├── node_modules/               # Dependencies (generated)
├── public/                     # Static assets & manifest.json
└── src/                        # Source code (see below)
```

## Source Code Structure (`src/`)
```
src/
├── background/                 # Service Worker (Manifest V3)
│   └── service-worker.ts       # Message routing, settings coordination
│
├── content/                    # Content Scripts (YouTube DOM manipulation)
│   ├── content.ts              # Main content script entry point
│   └── youtube/                # YouTube-specific modules
│       ├── home-page.ts        # Home page: hide feed, shorts, sidebar
│       ├── search-page.ts      # Search page: filter shorts, posts
│       └── utils/              # Content script utilities
│           ├── content-filter.ts   # Content filtering logic
│           └── dom-helpers.ts      # DOM manipulation helpers
│
├── popup/                      # Extension Popup UI
│   ├── index.html              # Popup HTML entry point
│   ├── index.tsx               # Popup React mount
│   └── Popup.tsx               # Main popup component
│
├── options/                    # Full Settings Page
│   ├── index.html              # Options HTML entry point
│   ├── index.tsx               # Options React mount
│   └── Options.tsx             # Main options component
│
├── components/                 # Shared React Components
│   └── ui/                     # shadcn/ui components
│       ├── accordion.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── label.tsx
│       ├── separator.tsx
│       ├── switch.tsx
│       └── tabs.tsx
│
├── shared/                     # Shared Code (cross-context)
│   ├── constants/              # App-wide constants
│   ├── storage/                # Chrome Storage API abstraction
│   │   ├── index.ts            # Storage exports
│   │   ├── migrations.ts       # Settings migration logic
│   │   ├── settings-manager.ts # Settings CRUD operations
│   │   └── validation.ts       # Settings validation
│   ├── styles/                 # Global styles
│   │   └── globals.css         # Tailwind + global CSS
│   ├── types/                  # TypeScript definitions
│   │   ├── messages.ts         # Extension messaging types
│   │   └── settings.ts         # Settings interfaces & defaults
│   └── utils/                  # Shared utilities
│
└── lib/                        # Library utilities
    └── utils.ts                # Common utility functions
```

## Architecture Layers

### 1. Service Worker (`background/`)
- Coordinates extension lifecycle
- Routes messages between contexts
- Manages settings synchronization

### 2. Content Scripts (`content/`)
- Injected into YouTube pages
- Pure TypeScript (no React)
- DOM manipulation for minimalist UI
- Page-specific modules: Home, Search, Watch

### 3. UI Components (`popup/`, `options/`)
- React 18 applications
- Quick toggles (popup) vs detailed config (options)
- Real-time settings updates

### 4. Shared Layer (`shared/`)
- Cross-context code (service worker, content scripts, React UI)
- Storage abstractions, types, constants
- No framework dependencies
