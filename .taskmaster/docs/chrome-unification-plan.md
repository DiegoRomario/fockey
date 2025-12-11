# Global Navigation Elements Unification - Implementation Plan

## Overview

Refactor YouTube module settings to extract common global navigation elements into a shared `globalNavigation` settings section, eliminating duplication and ensuring consistent behavior across all pages.

## Current Problems

1. **Duplication**: Logo, sidebar, hamburger, profile, and notifications settings are duplicated across Home, Search, and Watch pages
2. **Inconsistency**: Changes to global navigation elements on one page don't affect others
3. **Maintenance Burden**: Any global navigation-related change requires updating 3+ places
4. **Logic Complexity**: Each page module manages its own global navigation state

## Proposed Solution

### Architecture Changes

Create a new `GlobalNavigationSettings` interface that manages all persistent global navigation elements:

```typescript
interface GlobalNavigationSettings {
  /** Show YouTube logo in header */
  showLogo: boolean;

  /** Show left sidebar (includes hamburger menu - unified component) */
  showSidebar: boolean;

  /** Show profile avatar in header */
  showProfile: boolean;

  /** Show notifications bell in header */
  showNotifications: boolean;
}
```

**Key Design Decision: Sidebar & Hamburger Unification**

The hamburger menu and left sidebar are functionally coupled:
- Hamburger menu toggles the sidebar
- If sidebar is hidden, hamburger has no purpose
- They should be controlled by a single setting: `showSidebar`

### Settings Schema Migration

#### Before
```typescript
interface YouTubeModuleSettings {
  enabled: boolean;
  homePage: {
    showLogo: boolean;
    showHamburger: boolean;
    showSidebar: boolean;
    showProfile: boolean;
    showNotifications: boolean;
  };
  searchPage: {
    showLogo: boolean;
    showHamburger: boolean;
    showSidebar: boolean;
    showProfile: boolean;
    showNotifications: boolean;
    // ... content settings
  };
  watchPage: {
    // ... action buttons
  };
}
```

#### After
```typescript
interface YouTubeModuleSettings {
  enabled: boolean;
  globalNavigation: GlobalNavigationSettings;  // NEW: Shared global navigation settings
  homePage: HomePageSettings;  // Only home-specific settings (none for now)
  searchPage: SearchPageSettings;  // Only search-specific settings
  watchPage: WatchPageSettings;  // Only watch-specific settings
}
```

## Implementation Steps

### Phase 1: Type System Updates

**Files to Update:**
- `src/shared/types/settings.ts`

**Tasks:**
1. Create new `GlobalNavigationSettings` interface
2. Remove global navigation-related fields from `HomePageSettings`, `SearchPageSettings`
3. Add `globalNavigation: GlobalNavigationSettings` to `YouTubeModuleSettings`
4. Update `DEFAULT_SETTINGS` to use new structure
5. Update JSDoc comments to reflect new architecture

**Acceptance Criteria:**
- ✅ TypeScript compiles without errors
- ✅ All global navigation settings in one location
- ✅ No duplication of global navigation fields across page settings
- ✅ Default values properly defined

### Phase 2: Settings Migration

**Files to Update:**
- `src/shared/storage/migrations.ts`
- `src/shared/storage/validation.ts`

**Tasks:**
1. Create migration function: `migrateToGlobalNavigation_v1_1_0()`
2. Migrate existing per-page global navigation settings to shared `globalNavigation` section
3. Handle edge cases (conflicting settings across pages)
4. Update validation schema to accept new structure
5. Bump settings version to `1.1.0`

**Migration Logic:**
```typescript
// If any page has showLogo=true, set globalNavigation.showLogo=true
// Use OR logic for all global navigation settings (most permissive)
globalNavigation.showLogo = homePage.showLogo || searchPage.showLogo;
globalNavigation.showSidebar = homePage.showSidebar || searchPage.showSidebar;
// etc.
```

**Acceptance Criteria:**
- ✅ Existing user settings migrate correctly
- ✅ No data loss during migration
- ✅ Settings validation passes for new structure
- ✅ Version bump handled correctly

### Phase 3: Content Scripts Updates

**Files to Update:**
- `src/content/youtube/modules/home-page-module.ts`
- `src/content/youtube/modules/search-page-module.ts`
- `src/content/youtube/modules/watch-page-module.ts`

**Tasks:**
1. Update all global navigation element selectors to read from `settings.youtube.globalNavigation` instead of page-specific settings
2. Remove duplicate global navigation-hiding logic
3. Create shared global navigation manipulation utilities if needed
4. Test on all page types

**Code Changes:**
```typescript
// BEFORE
const { showLogo, showSidebar } = settings.youtube.homePage;

// AFTER
const { showLogo, showSidebar } = settings.youtube.globalNavigation;
```

**Acceptance Criteria:**
- ✅ Global navigation elements controlled by shared settings
- ✅ Sidebar and hamburger menu treated as single component
- ✅ No page-specific global navigation logic remains
- ✅ DOM manipulation works correctly

### Phase 4: UI Updates (Options Page)

**Files to Update:**
- `src/options/Options.tsx`
- `src/options/components/SettingToggle.tsx` (if needed)

**Tasks:**
1. Create new "Global Navigation Elements" section in Options UI
2. Move global navigation toggles from page-specific accordions to shared section
3. Position global navigation section prominently (above page-specific settings)
4. Update labels and descriptions
5. Remove global navigation toggles from page-specific sections

**UI Structure:**
```
Fockey Settings
├── Global Navigation Elements (NEW)
│   ├── YouTube Logo
│   ├── Left Sidebar (Note: includes hamburger menu)
│   ├── Profile Avatar
│   └── Notifications Bell
├── Home Page Settings
│   └── (Empty for now - future expansion)
├── Search Page Settings
│   ├── Show Shorts
│   ├── Show Community Posts
│   └── ...
└── Watch Page Settings
    ├── Engagement Buttons
    └── ...
```

**Acceptance Criteria:**
- ✅ Global Navigation Elements section appears above page-specific settings
- ✅ Global navigation toggles control all pages simultaneously
- ✅ Clear labeling explains scope of global navigation settings
- ✅ Visual hierarchy shows global navigation as global, pages as specific

### Phase 5: Popup Updates

**Files to Update:**
- `src/popup/Popup.tsx`
- `src/popup/components/SettingsSection.tsx` (if applicable)

**Tasks:**
1. Update popup to show global navigation settings separately if needed
2. Ensure global navigation toggles affect all pages
3. Update labels and UI accordingly

**Acceptance Criteria:**
- ✅ Popup shows global navigation settings appropriately
- ✅ Quick toggles work correctly
- ✅ UI communicates global nature of global navigation settings

### Phase 6: Documentation Updates

**Files to Update:**
- `prd_fockey_chrome_extension.md`
- `CLAUDE.md` (if references settings structure)
- Any other relevant documentation

**Tasks:**
1. Update PRD to reflect Global Navigation Elements architecture
2. Document Global Navigation vs. page-specific settings distinction
3. Update examples and diagrams
4. Add migration notes for developers

**Acceptance Criteria:**
- ✅ PRD accurately describes new architecture
- ✅ Global Navigation Elements settings clearly documented
- ✅ Examples updated

### Phase 7: Testing & Validation

**Testing Checklist:**
1. ✅ Fresh install with default settings works
2. ✅ Existing users' settings migrate correctly
3. ✅ Global navigation elements hidden/shown consistently across pages
4. ✅ Sidebar and hamburger menu always synchronized
5. ✅ Options page reflects global navigation changes immediately
6. ✅ Export/import preserves global navigation settings
7. ✅ Reset to defaults works correctly
8. ✅ No console errors or warnings
9. ✅ No performance degradation

**Test Scenarios:**
- New user installs extension → All global navigation elements hidden by default
- Existing user updates → Settings migrate preserving intent
- User enables sidebar → Both sidebar and hamburger appear
- User changes global navigation settings → All pages reflect changes
- User exports/imports settings → Global navigation settings preserved

## Rollout Strategy

1. **Development**: Implement changes in feature branch
2. **Testing**: Thorough testing on all YouTube page types
3. **Migration Testing**: Test migration with various existing settings configurations
4. **Documentation**: Update all docs before merge
5. **Release**: Version bump to 1.1.0 with migration notes

## Risk Mitigation

**Risk**: Migration fails for some users
- **Mitigation**: Extensive migration testing, fallback to defaults if migration fails

**Risk**: Performance impact from settings structure change
- **Mitigation**: Settings are still shallow objects, minimal performance impact

**Risk**: User confusion from UI changes
- **Mitigation**: Clear labeling, tooltips explaining "applies to all pages"

## Success Criteria

The refactoring is successful when:

1. ✅ All global navigation settings in single `globalNavigation` section
2. ✅ No duplication of global navigation settings across pages
3. ✅ Sidebar and hamburger treated as unified component
4. ✅ Existing user settings migrate successfully
5. ✅ Options UI clearly distinguishes Global Navigation Elements from page settings
6. ✅ All tests pass
7. ✅ Documentation updated
8. ✅ No regressions in functionality

## Timeline Estimate

- Phase 1 (Types): 1-2 hours
- Phase 2 (Migration): 2-3 hours
- Phase 3 (Content Scripts): 2-3 hours
- Phase 4 (Options UI): 2-3 hours
- Phase 5 (Popup): 1-2 hours
- Phase 6 (Docs): 1-2 hours
- Phase 7 (Testing): 2-3 hours

**Total**: 11-18 hours of focused development time
