# Fockey - Suggested Commands

## Development Commands

### Development Server
```bash
npm run dev              # Start Vite dev server on port 5173
```

### Build & Preview
```bash
npm run build            # Compile TypeScript and build extension to dist/
npm run preview          # Preview production build
```

## Code Quality Commands

### Linting (ESLint)
```bash
npm run lint             # Check all .ts and .tsx files for linting errors
npm run lint:fix         # Auto-fix linting issues where possible
```

### Formatting (Prettier)
```bash
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting without modifying files
```

### Combined Checks
```bash
npm run check            # Run both linting and format checks (recommended before commits)
npm run fix              # Auto-fix both linting and formatting issues
```

## Git Hooks

### Automatic Pre-Commit
The pre-commit hook (via Husky + lint-staged) automatically runs on staged files:
1. ESLint with auto-fix on `.ts` and `.tsx` files
2. Prettier formatting on all staged files
3. Blocks commit if unfixable errors exist

**To bypass** (emergency only):
```bash
git commit --no-verify
```

### Setup
```bash
npm run prepare          # Install Husky git hooks (runs automatically after npm install)
```

## Package Management
```bash
npm install              # Install dependencies (also runs prepare script)
npm install <package>    # Add new dependency
```

## Windows-Specific System Commands

### File Navigation
```powershell
dir                      # List directory contents (equivalent to ls)
cd <path>                # Change directory
cd ..                    # Go up one directory
```

### File Operations
```powershell
type <file>              # Display file contents (equivalent to cat)
copy <src> <dest>        # Copy files
move <src> <dest>        # Move files
del <file>               # Delete file
rmdir <dir>              # Remove directory
```

### Search
```powershell
findstr <pattern> <file> # Search for pattern in file (equivalent to grep)
where <command>          # Find command location (equivalent to which)
```

### Git
```bash
git status               # Check repository status
git add .                # Stage all changes
git commit -m "message"  # Commit staged changes
git push                 # Push to remote
git pull                 # Pull from remote
git log                  # View commit history
```

## Task Master AI Commands (via MCP or CLI)

### Task Management
```bash
task-master list         # List all tasks
task-master next         # Get next available task
task-master show <id>    # Show task details
task-master set-status --id=<id> --status=<status>  # Update task status
```

### Task Analysis
```bash
task-master analyze-complexity --research     # Analyze task complexity
task-master complexity-report                 # View complexity report
```

## Recommended Development Workflow
1. **Start development**: `npm run dev`
2. **Make changes**: Edit source files
3. **Check quality**: `npm run check` (before committing)
4. **Auto-fix issues**: `npm run fix` (if needed)
5. **Commit**: Git hooks will auto-run lint-staged
6. **Build**: `npm run build` (for production)
