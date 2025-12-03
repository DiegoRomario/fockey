# Fockey - Tech Stack

## Core Technologies
- **React 18** — UI framework for popup and options pages
- **TypeScript** — Mandatory across the entire codebase (strict mode enabled)
- **Tailwind CSS** — Utility-first styling system
- **shadcn/ui** — Accessible UI components built on Radix UI
- **Vite** — Build tool and dev server (port 5173)

## Chrome Extension Platform
- **Manifest V3** — Latest Chrome Extension standard
- **Chrome Storage API** — Settings persistence and cross-device sync
- **Content Scripts** — DOM manipulation using vanilla TypeScript (no React)
- **Service Worker** — Background logic, message routing, and lifecycle coordination

## Build Configuration
- **Node.js**: >= 18.0.0
- **TypeScript**: ES2020 target, strict mode, path aliases (@/*)
- **Vite**: Modern bundler with web extension plugin
- **Output**: `dist/` directory

## Key Dependencies
- React & React DOM 18.3.1
- Radix UI components (accordion, dialog, label, separator, switch, tabs)
- Tailwind utilities (clsx, tailwind-merge, class-variance-authority)
- lucide-react for icons
