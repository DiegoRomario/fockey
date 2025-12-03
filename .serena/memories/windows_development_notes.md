# Fockey - Windows Development Notes

## System Information
**Operating System**: Windows (win32)
**Node.js Requirement**: >= 18.0.0

## Windows-Specific Commands

### Directory Navigation
```powershell
dir                      # List files in current directory
dir /s                   # List files recursively
cd <path>                # Change directory
cd ..                    # Go up one directory
cd \                     # Go to root drive
pwd                      # Print working directory (PowerShell)
```

### File Operations
```powershell
type <file>              # Display file contents (like cat)
copy <source> <dest>     # Copy files
xcopy <src> <dest> /s    # Copy directories recursively
move <source> <dest>     # Move/rename files
del <file>               # Delete file
rmdir <dir> /s           # Remove directory and subdirectories
mkdir <dir>              # Create directory
```

### Search & Find
```powershell
findstr <pattern> <file> # Search for text pattern in file (like grep)
findstr /s <pattern> *   # Search recursively in all files
where <command>          # Find command location (like which)
```

### Path Handling
- **Backslashes**: Windows uses `\` for paths (e.g., `C:\repositories\fockey\src`)
- **Git Bash**: Can use forward slashes `/` (e.g., `src/content/content.ts`)
- **Node.js/npm**: Handles both path separators cross-platform

### Environment Variables
```powershell
echo %PATH%              # Display PATH (cmd)
$env:PATH                # Display PATH (PowerShell)
set VAR=value            # Set environment variable (cmd)
$env:VAR = "value"       # Set environment variable (PowerShell)
```

## Git on Windows

### Line Endings
Project uses `"endOfLine": "auto"` in Prettier to handle Windows CRLF vs Unix LF automatically.

### Git Configuration
```bash
git config --global core.autocrlf true    # Convert LF to CRLF on checkout
git config --global core.eol lf           # Use LF in repository
```

### Git Commands (Git Bash or PowerShell)
```bash
git status               # Check repository status
git add .                # Stage all changes
git commit -m "message"  # Commit with message
git log --oneline        # View commit history
git branch               # List branches
git checkout -b <name>   # Create and switch to new branch
```

## npm on Windows

### Package Scripts
All npm scripts in `package.json` work cross-platform:
```bash
npm run dev              # Works on Windows, Mac, Linux
npm run build            # Uses && chaining (supported in npm scripts)
npm run check            # Multiple commands with &&
```

### Parallel Commands
When needed, use `concurrently` or `npm-run-all` packages (not currently in project).

## Terminal Recommendations

### Options for Windows Development
1. **Windows Terminal** (recommended) - Modern, tabbed, supports PowerShell/CMD/Git Bash
2. **Git Bash** - Unix-like commands, comes with Git for Windows
3. **PowerShell** - Native Windows, powerful scripting
4. **CMD** - Legacy Windows command prompt
5. **WSL 2** - Full Linux environment (optional, advanced)

### Current Setup
Based on working directory path format (`C:\repositories\fockey`), using:
- Windows file system
- Standard Windows paths with backslashes
- npm scripts handle cross-platform compatibility

## Common Windows Development Gotchas

### Path Issues
- ✅ Use `path.resolve()` in Node.js for cross-platform paths
- ✅ Vite config uses `path.resolve(__dirname, './src')` - works on Windows
- ✅ TypeScript path aliases (`@/*`) work correctly

### File Permissions
- No Unix-style chmod needed on Windows
- Git hooks (Husky) work but may need execution permissions in Git Bash

### Case Sensitivity
- Windows file system is case-insensitive
- Git is case-sensitive by default
- Be careful with file renames (use `git mv` for case changes)

## IDE Recommendations
- **Visual Studio Code**: Excellent Windows support, TypeScript integration, Git integration
- **WebStorm**: Full-featured, great for React/TypeScript
- **Cursor**: AI-powered, VSCode fork

## Performance Notes
- `node_modules` can slow down Windows Defender - add exclusion if needed
- SSD recommended for fast npm installs and builds
- Consider enabling WSL 2 for better performance with large projects (optional)
