# Fockey - Task Completion Checklist

## When a Task is Complete

Before marking a task as done, ensure the following steps are completed:

### 1. Code Quality Checks
```bash
npm run check            # Verify linting and formatting
npm run fix              # Auto-fix any issues found
```

**Requirements:**
- ✅ No ESLint errors
- ✅ Code follows Prettier formatting rules
- ✅ TypeScript compiles without errors

### 2. Build Verification
```bash
npm run build            # Ensure production build succeeds
```

**Requirements:**
- ✅ TypeScript compilation passes
- ✅ Vite build completes successfully
- ✅ No build warnings or errors

### 3. Manual Testing (Chrome Extension Changes)

⚠️ **Critical for extension functionality changes**

For any changes to content scripts, popup, options page, or service worker:

**Using Playwright MCP** (preferred):
- Verify elements are correctly hidden/shown
- Validate page-specific behavior (Home vs Search vs Watch)
- Confirm settings propagate correctly

**Using Chrome DevTools MCP** (alternative):
- Take snapshots before/after changes
- Verify DOM manipulation works as expected
- Test real-time settings updates

**Requirements:**
- ✅ Verified via MCP tools (Playwright or Chrome DevTools)
- ✅ No broken UX flows
- ✅ Minimalist-by-default behavior preserved

### 4. Code Review (Self)
- ✅ Follows PRD requirements strictly
- ✅ Adheres to existing code patterns
- ✅ Maintains separation of concerns (UI/content/background)
- ✅ Content scripts remain framework-free
- ✅ No unnecessary complexity or over-engineering

### 5. Documentation
- ✅ Significant behavioral changes are documented
- ✅ New features align with minimalist principle
- ✅ Implementation notes added to task if needed

### 6. Git Workflow
```bash
git status               # Review changes
git add .                # Stage changes (pre-commit hook will run)
git commit -m "feat: <description>"   # Commit with descriptive message
```

**Pre-commit hook verifies:**
- ✅ ESLint auto-fix runs on staged TypeScript files
- ✅ Prettier formats all staged files
- ✅ No unfixable linting errors

### 7. Task Master Update
```bash
# Mark task as done in Task Master
task-master set-status --id=<task-id> --status=done

# Or via MCP
set_task_status(id="<task-id>", status="done")
```

## Definition of Done

A task is **DONE** only if:
- ✅ Task was marked as in-progress before development
- ✅ Code follows the defined tech stack
- ✅ Minimalist default behavior is preserved
- ✅ DOM changes are verified via MCP tools (if applicable)
- ✅ No broken UX flows
- ✅ Code quality checks pass (linting, formatting, build)
- ✅ Task is marked as done in Task Master

## Common Pitfalls to Avoid
- ❌ Committing without running `npm run check`
- ❌ Skipping manual testing for extension changes
- ❌ Not verifying build before marking task complete
- ❌ Over-engineering solutions beyond requirements
- ❌ Breaking minimalist-by-default behavior
- ❌ Using React in content scripts
