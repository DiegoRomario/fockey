# Fockey - Design Guidelines & Patterns

## Core Design Philosophy

### Minimalist-First Principle
> **Minimal by default. Everything else is opt-in.**

Every feature, UI element, and interaction must respect this core principle.

### Design-First Development
UI/UX is **fundamental**, not optional. Chrome extensions must feel **professional, polished, intuitive, and accessible**.

## UI/UX Principles

### Core Standards
- **Professional & Polished**: Feels like a premium product
- **Intuitive Navigation**: No documentation required to use
- **Consistent Design Language**: Across all surfaces (popup, options, content)
- **Immediate Feedback**: Clear feedback for all user actions
- **Delightful Interactions**: Smooth, non-jarring micro-interactions
- **Accessibility**: WCAG AA compliance (keyboard & screen readers)

### Visual Excellence Requirements
Every interface must include:
- Clean, modern layout with strong visual hierarchy
- Thoughtful whitespace and typography
- Smooth, non-jarring animations
- Consistent spacing and sizing (Tailwind spacing scale)
- Clear states: hover, focus, loading, success, error, disabled
- **No placeholder or temporary UI in production**

### Interaction Patterns
- ✅ Hover states on all interactive elements
- ✅ Loading and skeleton states for async actions
- ✅ Success and error feedback (toasts or inline)
- ✅ Disabled states clearly communicated
- ✅ Confirmation dialogs for destructive actions

## Design Inspiration (Reference)
Look to these products for quality benchmarks:
- Grammarly
- Loom
- Notion Web Clipper
- 1Password
- Linear
- Vercel
- Stripe
- Raycast

## Component Library
**shadcn/ui** components (Radix-based) for:
- Accessible, keyboard-navigable interfaces
- Consistent design system
- Pre-built interaction patterns

## Development Patterns

### Separation of Concerns
**Strict boundaries:**
- **UI Logic** → React components (popup, options)
- **Page Manipulation** → Content scripts (vanilla TypeScript)
- **State & Lifecycle** → Service worker

### Content Script Rules
- ✅ Vanilla TypeScript only (no React)
- ✅ Prefer hiding elements via DOM manipulation
- ✅ Avoid brittle selectors whenever possible
- ✅ Use mutation observers for dynamic content
- ✅ Minimize reflows during manipulation

### Settings Management
- Real-time DOM updates (no page reload when possible)
- Persisted per user via Chrome Storage API
- Default = Minimalist Mode enabled for all pages
- Granular opt-in controls for hidden elements

### Prohibited Patterns
**Must NOT:**
- ❌ Introduce recommendations, feeds, or engagement features
- ❌ Add UI elements that conflict with YouTube's native UX
- ❌ Change default minimalist behavior
- ❌ Use React in content scripts
- ❌ Create brittle, platform-specific selectors without fallbacks

## Styling Guidelines

### Tailwind CSS Usage
- Utility-first approach
- Consistent spacing scale (p-4, m-2, etc.)
- Responsive design utilities
- Custom utilities via `@/lib/utils.ts` (cn helper)

### Color Scheme
- Follow shadcn/ui theming system
- Support light/dark modes (if applicable)
- Maintain sufficient contrast for accessibility

### Typography
- Clear hierarchy (headings, body, captions)
- Readable font sizes (minimum 14px for body text)
- Appropriate line-height for readability

## Architecture Decisions

### When to Use Each Layer

**Service Worker:**
- Message routing between contexts
- Settings synchronization
- Extension lifecycle management
- Background tasks

**Content Scripts:**
- Direct DOM manipulation
- Page-specific YouTube transformations
- Event listeners for dynamic content
- Real-time settings application

**React Components:**
- User-facing UI (popup, options)
- Settings forms and toggles
- Complex state management
- User feedback and notifications

## Quality Bar
All implementations must:
- ✅ Follow PRD requirements strictly
- ✅ Preserve YouTube core functionality
- ✅ Ensure low performance overhead
- ✅ Maintain backwards compatibility with settings
- ✅ Provide clear, immediate user feedback
- ✅ Handle edge cases gracefully
