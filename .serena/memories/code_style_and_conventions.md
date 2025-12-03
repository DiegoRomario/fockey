# Fockey - Code Style & Conventions

## Prettier Configuration
- **Print Width**: 100 characters
- **Semicolons**: Always required
- **Quotes**: Single quotes for strings
- **Trailing Comma**: ES5 style (objects, arrays)
- **Tab Width**: 2 spaces
- **Arrow Functions**: Always wrap parameters in parentheses
- **End of Line**: Auto (cross-platform compatibility)

## ESLint Configuration
- **TypeScript**: Strict rules enabled (@typescript-eslint)
- **React**: Version 18 rules, no React import required in JSX files
- **React Hooks**: Rules enforced (hooks rules + exhaustive deps warning)
- **Globals**: Browser, ES2021, Node, Chrome Extension API

## TypeScript Standards
- **Strict Mode**: Enabled
- **Target**: ES2020
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx (automatic runtime)
- **Path Aliases**: `@/*` maps to `./src/*`
- **Types**: Chrome extension types, Vite client types

## Code Organization
- **Content Scripts**: Vanilla TypeScript only (no React)
- **UI Components**: React 18 with TypeScript
- **Shared Code**: Utilities, types, and constants in `src/shared/`
- **Separation of Concerns**: UI logic (React) vs Page manipulation (Content scripts) vs State (Service worker)

## Naming Conventions
- **Files**: kebab-case for all files (e.g., `home-page.ts`, `settings-manager.ts`)
- **Components**: PascalCase for React components (e.g., `Popup.tsx`, `Options.tsx`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_SETTINGS`)
- **Interfaces/Types**: PascalCase (e.g., `ExtensionSettings`, `YouTubeModuleSettings`)
