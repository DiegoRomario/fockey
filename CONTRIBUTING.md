# Contributing to Fockey

Thank you for contributing to Fockey! This document outlines the development workflow and quality standards.

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. The `prepare` script will automatically install Git hooks via Husky

## Code Quality Standards

### Automated Checks

This project uses automated tools to maintain code quality:

- **ESLint**: TypeScript and React linting with strict rules
- **Prettier**: Code formatting for consistent style
- **Husky**: Git hooks for pre-commit and pre-push checks
- **lint-staged**: Runs linting and formatting on staged files only

### Pre-Commit Hook

Before each commit, the pre-commit hook automatically:

1. Runs ESLint on staged `.ts` and `.tsx` files and attempts to fix issues
2. Runs Prettier to format all staged files
3. Blocks the commit if there are unfixable linting errors

This ensures all committed code meets quality standards.

### Formatting and Linting Rules

#### Prettier Configuration
- **Print Width**: 100 characters
- **Semi**: Always use semicolons
- **Single Quote**: Use single quotes for strings
- **Trailing Comma**: ES5 style (objects, arrays)
- **Tab Width**: 2 spaces
- **Arrow Parens**: Always wrap arrow function parameters
- **End of Line**: Auto (cross-platform compatibility)

#### ESLint Configuration
- TypeScript strict rules enabled
- React 18 best practices (no React import required in JSX)
- React Hooks rules enforced
- Chrome Extension API globals recognized

### Manual Commands

You can run checks manually at any time:

```bash
# Check all code for linting and formatting issues
npm run check

# Automatically fix linting and formatting issues
npm run fix

# Run only linting
npm run lint

# Run only linting with auto-fix
npm run lint:fix

# Run only formatting check
npm run format:check

# Run only formatting with auto-fix
npm run format
```

### Bypassing Hooks (Emergency Only)

In rare cases where you need to bypass hooks:

```bash
git commit --no-verify
```

**⚠️ Warning**: Only use `--no-verify` when absolutely necessary. All code should pass quality checks before being committed.

## Testing

Tests will be integrated in Task 12. Once implemented, the pre-push hook will automatically run tests before pushing to the remote repository.

## Project Structure

```
src/
├── background/       # Service worker (Manifest V3)
├── content/         # Content scripts for YouTube pages
├── popup/           # Extension popup UI
├── options/         # Full settings page
└── shared/          # Shared utilities and types
```

## Tech Stack

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Styling
- **shadcn/ui**: Accessible UI components
- **Vite**: Build tool and dev server

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes following the code quality standards
3. Ensure all automated checks pass
4. Run `npm run check` before committing
5. Commit your changes (pre-commit hook will run automatically)
6. Push to your branch (pre-push hook will run when tests are implemented)
7. Open a pull request

## Questions or Issues?

If you encounter issues with the development setup or have questions, please open an issue on GitHub.
