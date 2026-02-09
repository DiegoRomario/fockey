/**
 * English (en) translations
 * Complete translation file for Fockey Chrome Extension
 */

export const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    add: 'Add',
    edit: 'Edit',
    remove: 'Remove',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    retry: 'Retry',
    configure: 'Configure',
    proceed: 'Proceed',
    minutes: 'Minutes',
    hours: 'Hours',
    days: 'Days',
  },

  popup: {
    title: 'FOCKEY',
    version: 'v{{version}}',
    settings: 'Open Settings',
    settingsAriaLabel: 'Open Settings',
    settingsTooltip: 'Open Settings',
    languageTooltip: 'Change Language',
    loadingSettings: 'Loading settings...',
    failedToLoad: 'Failed to load settings',
    failedToSave: 'Failed to save settings. Please try again.',

    lockMode: {
      settingsLocked: 'Settings locked for {{time}}',
      unlocksAt: 'Unlocks at {{time}}',
      locked: 'Locked',
    },

    channel: {
      currentChannel: 'Current Channel',
      blockChannel: 'Block Channel',
      unblock: 'Unblock',
      processing: 'Processing...',
      blocked: '{{count}} blocked',
      blockedChannels: 'Blocked YouTube Channels',
      noBlockedChannels: 'No blocked channels',
    },

    quickBlock: {
      title: 'Quick Block',
      description: 'Start a focus session',
      active: 'Quick Block Active',
      noTimeLimit: 'No Time Limit',
      untilManuallyStopped: 'Until manually stopped',
      endsAt: 'Ends at {{time}}',
      extend: 'Extend',
      stop: 'Stop',
      viewDetails: 'View details →',
      configure: 'Configure',
      configureQuickBlock: 'Configure Quick Block',
      noRulesConfigured: 'No blocking rules configured',
      noRulesConfiguredMessage: 'No blocking rules configured',

      durations: {
        '25min': '25 min',
        '1hr': '1 hour',
        '8hrs': '8 hours',
        '24hrs': '24 hours',
      },

      dialogs: {
        extendTitle: 'Extend Quick Block',
        extendDescription: 'Add more time to your focus session',
        stopTitle: 'Stop Quick Block?',
        stopDescription:
          'Are you sure you want to stop this focus session? Your configured items will be saved for future sessions.',
        stopButton: 'Stop Session',
        lockModeWarningTitle: 'Start Quick Block with Lock Mode Active',
        lockModeWarningDescriptionTimed:
          'Lock Mode is currently active. If you start Quick Block now, it will run until the timer expires, and you will not be able to stop it manually while Lock Mode is active.',
        lockModeWarningDescriptionIndefinite:
          'Lock Mode is currently active. If you start Quick Block now, you will not be able to stop it until Lock Mode expires.',
        lockModeWarningQuestion: 'Do you want to proceed?',
        startAnyway: 'Start Anyway',
      },

      errors: {
        noRules: 'No blocking rules configured',
        cannotStopLocked: 'Cannot stop Quick Block while Lock Mode is active',
        failedToStart: 'Failed to start Quick Block',
        failedToStop: 'Failed to stop session',
        failedToExtend: 'Failed to extend session',
        noTimeLimit: 'This session has no time limit',
      },
    },

    schedules: {
      title: 'Schedules',
      description: 'Time-based blocking',
      noSchedulesConfigured: '⚠ No schedules configured',
      add: 'Add',
      createSchedule: 'Create Schedule',
      viewDetails: 'View details →',
      pause: 'Pause',
      resume: 'Resume',
      delete: 'Delete',

      days: {
        everyDay: 'Every day',
        weekdays: 'Weekdays',
        weekends: 'Weekends',
        sun: 'Sun',
        mon: 'Mon',
        tue: 'Tue',
        wed: 'Wed',
        thu: 'Thu',
        fri: 'Fri',
        sat: 'Sat',
      },

      time: {
        allDay: 'All day long',
        noTimeSet: 'No time set',
        periods: '{{count}} periods',
      },

      rules: {
        domains: 'Blocked Domains',
        urlKeywords: 'URL Keywords',
        contentKeywords: 'Content Keywords',
      },
    },

    youtube: {
      title: 'YouTube Module',
      description: 'Control YouTube experience',
      configure: 'Configure',

      global: 'Global',
      search: 'Search',
      watch: 'Watch',

      settings: {
        logo: {
          label: 'YouTube Logo',
          tooltip: 'Display the YouTube logo in the top-left corner',
        },
        sidebar: {
          label: 'Sidebar',
          tooltip: 'Navigation sidebar and hamburger menu',
        },
        profile: {
          label: 'Profile',
          tooltip: 'Your account profile picture',
        },
        notifications: {
          label: 'Notifications Bell',
          tooltip: 'Notifications bell icon in header',
        },
        hoverPreviews: {
          label: 'Hover Previews',
          tooltip: 'Video preview autoplay on hover',
        },
        shorts: {
          label: 'Shorts',
          tooltip:
            'Enable YouTube Shorts globally. When disabled (default), all Shorts content is blocked including direct URLs, search results, and creator profiles.',
        },
        posts: {
          label: 'Posts',
          tooltip:
            'Enable YouTube Posts globally. When disabled (default), all Posts content is blocked including direct URLs, search results, and creator profiles.',
        },
        blurThumbnails: {
          label: 'Blur Thumbnails',
          tooltip:
            'Blur all video thumbnails across all YouTube pages. When enabled, thumbnails in search results, related videos, and creator profiles are blurred to reduce visual stimulation.',
        },
        mixes: {
          label: 'Mixes/Playlists',
          tooltip: 'Auto-generated mixes and user-created playlists',
        },
        searchSuggestions: {
          label: 'Search Suggestions',
          tooltip:
            'Enable search suggestions (autocomplete dropdown). When disabled (default), the search suggestions dropdown is hidden to reduce distractions and algorithmic nudges.',
        },
        likeDislike: {
          label: 'Like/Dislike',
          tooltip: 'Thumbs up and thumbs down buttons',
        },
        subscriptionActions: {
          label: 'Subscription Actions',
          tooltip: 'Subscribe, Join, Notifications, See Perks',
        },
        share: {
          label: 'Share',
          tooltip: 'Share video via link or social media',
        },
        comments: {
          label: 'Comments',
          tooltip: 'User comments below the video',
        },
        related: {
          label: 'Related',
          tooltip: 'Recommended and related videos',
        },
        playlists: {
          label: 'Playlists',
          tooltip: 'When watching a video from a playlist',
        },
        recommendedVideo: {
          label: 'Recommended Video',
          tooltip: 'Info Cards during playback',
        },
        moreActions: {
          label: 'More Actions',
          tooltip: 'Save, Download, Clip, Thanks, Report, Ask AI, Overflow Menu',
        },
      },
    },
  },

  options: {
    title: 'Fockey Settings',
    subtitle: 'Distraction-free YouTube',

    tabs: {
      youtube: 'YouTube',
      general: 'General',
      lockMode: 'Lock Mode',
      manageSettings: 'Manage Settings',
      about: 'About',
    },

    saveStatus: {
      saving: 'Saving changes...',
      saved: 'All changes saved',
      ready: 'Ready',
    },

    youtube: {
      title: 'YouTube Settings',
      description: 'Customize your minimalist YouTube experience',

      tabs: {
        elements: 'Elements Settings',
        blockedChannels: 'Blocked Channels',
      },

      globalNavigation: {
        title: 'Global Navigation Elements',
        description:
          'These settings apply to **all YouTube pages** (Home, Search, Watch). Control persistent header and sidebar navigation elements that appear consistently across all pages.',
      },

      searchPage: {
        title: 'Search Page Settings',
        description:
          'Control which content appears in YouTube search results. By default, only long-form videos are shown. Use **Global Navigation Elements** above to control header, sidebar elements, Shorts, and Posts visibility.',
      },

      watchPage: {
        title: 'Watch Page Settings',
        description:
          'Control which buttons and elements are visible while watching videos. Video player controls are always preserved.',
      },

      blockedChannels: {
        title: 'Blocked YouTube Channels',
        description:
          'Block specific YouTube channels to prevent access to their content across all pages. You can block by channel handle (@username), channel URL, or channel name.',
        inputPlaceholder: 'Enter channel handle, URL, or name',
        blockButton: 'Block',
        blocking: 'Blocking...',
        emptyState: 'No blocked channels yet',
        emptyStateDescription: 'Add a channel above to get started',
        count: 'Blocked Channels ({{count}})',
        unblock: 'Unblock',
      },
    },

    general: {
      title: 'General Blocking',
      description:
        'Block websites and content across the internet with permanent and temporary blocking rules.',
      schedulesTitle: 'Time-Based Schedules',

      quickBlock: {
        title: 'Quick Block',
        description:
          'Fast, temporary blocking for immediate focus sessions. Designed to work with Lock Mode.',

        configureRules: 'Configure Blocking Rules',
        startQuickBlock: 'Start Quick Block',
        active: 'Quick Block Active',
        endsAt: 'Ends at {{time}}',
        noTimeLimit: 'No Time Limit',
        untilStopped: 'Session will continue until manually stopped',

        tabs: {
          domains: 'Domains',
          urlKeywords: 'URL Keywords',
          contentKeywords: 'Content Keywords',
        },

        domains: {
          placeholder: 'example.com or *.example.com',
          error: 'Please enter a valid domain (e.g., example.com or *.example.com for wildcards)',
          hint: 'Examples: reddit.com, twitter.com, *.facebook.com',
          empty: 'No domains configured yet',
        },

        urlKeywords: {
          placeholder: 'watch?v= or /shorts/ or playlist',
          hint: 'Block any URL containing this keyword (case-insensitive)',
          empty: 'No URL keywords configured yet',
        },

        contentKeywords: {
          placeholder: 'trending or celebrity or gossip',
          hint: 'Block elements containing this keyword.',
          empty: 'No content keywords configured yet',
        },

        durations: {
          chooseOrNoLimit: 'Choose a duration or start with no time limit',
          configureToStart: 'Configure at least one blocking rule to start',
          '25min': '25 min',
          '1hr': '1 hr',
          '8hrs': '8 hrs',
          '24hrs': '24 hrs',
          custom: 'Custom',
          indefinite: 'Start Quick Block',
        },

        currentlyBlocking: 'Currently Blocking',
        canAddDuringSession: 'You can add new items during an active session',

        buttons: {
          extendTime: 'Extend Time',
          stopSession: 'Stop Session',
        },

        dialogs: {
          customTitle: 'Custom Duration',
          customDescription: 'Set a custom duration for Quick Block',
          hoursLabel: 'hours',
          minutesLabel: 'minutes',
          start: 'Start',

          extendTitle: 'Extend Quick Block',
          extendDescription: 'Add more time to your focus session',
          addTime: 'Add Time',
          extend: 'Extend',

          stopTitle: 'Stop Quick Block?',
          stopDescription:
            'Are you sure you want to stop this focus session? Your configured items will be saved for future sessions.',
          stopButton: 'Stop Session',

          lockWarningTitle: 'Start Quick Block with Lock Mode Active',
          lockWarningDescription:
            'Lock Mode is currently active. If you start Quick Block now, it will run until the timer expires, and you will not be able to stop it manually while Lock Mode is active.',
          lockWarningDescriptionIndefinite:
            'Lock Mode is currently active. If you start Quick Block now, you will not be able to stop it until Lock Mode expires.',
          lockWarningQuestion: 'Do you want to proceed?',
          startAnyway: 'Start Anyway',
        },
      },

      schedules: {
        title: 'Schedules',
        description:
          'Time-based blocking rules. Each schedule can block specific domains and keywords during designated times.',
        addSchedule: 'Add Schedule',
        emptyState: 'No schedules configured',
        emptyStateDescription: 'Click "Add Schedule" to create one.',

        card: {
          active: 'Active',
          pause: 'Pause',
          resume: 'Resume',
          delete: 'Delete',
          optionsAriaLabel: 'Schedule options',
        },

        rules: {
          domain: '{{count}} Domain',
          domains: '{{count}} Domains',
          urlKeyword: '{{count}} URL Keyword',
          urlKeywords: '{{count}} URL Keywords',
          contentKeyword: '{{count}} Content Keyword',
          contentKeywords: '{{count}} Content Keywords',
          blockedDomains: 'Blocked Domains',
          urlKeywordsLabel: 'URL Keywords',
          contentKeywordsLabel: 'Content Keywords',
        },

        deleteDialog: {
          title: 'Delete Schedule',
          description:
            'Are you sure you want to delete this schedule? This action cannot be undone.',
          cancel: 'Cancel',
          delete: 'Delete',
        },

        edit: {
          titleEdit: 'Edit Schedule',
          titleCreate: 'Create Schedule',
          descriptionEdit: 'Modify your existing blocking schedule',
          descriptionCreate: 'Set up a new time-based blocking schedule',

          name: {
            label: 'Schedule Name',
            placeholder: 'e.g., Focus Work',
          },

          icon: {
            label: 'Icon (Optional)',
          },

          days: {
            label: 'Days',
            all: 'All',
            weekdays: 'Weekdays',
            weekend: 'Weekend',
            clear: 'Clear',
            sun: 'Sun',
            mon: 'Mon',
            tue: 'Tue',
            wed: 'Wed',
            thu: 'Thu',
            fri: 'Fri',
            sat: 'Sat',
          },

          timePeriods: {
            label: 'Active Time Periods',
            hint: 'Schedule will be active during these times. Add multiple periods for breaks (e.g., pause for lunch).',
            warning: '⚠ No more time available in the day. Periods must stay within 00:00 - 23:59.',
            addPeriod: 'Add Period',
            periodLabel: 'Period {{index}}',
            overlap: '⚠ This period overlaps with another time window',
            overlapError: '⚠ Time periods cannot overlap',
            overlapErrorDescription:
              "Please adjust the times so that periods don't conflict with each other.",
          },

          whatToBlock: 'What to Block',

          blockedDomains: {
            label: 'Blocked Domains',
            placeholder: 'example.com',
            empty: 'No domains added',
            error: '⚠ {{error}}',
          },

          urlKeywords: {
            label: 'URL Keywords',
            placeholder: 'e.g., trending, viral',
            hint: 'Block pages with these keywords in the URL',
            empty: 'No URL keywords added',
          },

          contentKeywords: {
            label: 'Content Keywords',
            placeholder: 'e.g., breaking news, celebrity',
            hint: 'Block elements containing these keywords.',
            empty: 'No content keywords added',
          },

          validation: {
            nameRequired: 'Schedule name is required',
            daysRequired: 'At least one day must be selected',
            timePeriodsRequired: 'At least one time period is required',
            timePeriodsOverlap:
              "Time periods cannot overlap. Please adjust the times so periods don't conflict with each other.",
            rulesRequired:
              'At least one blocking rule is required (domain, URL keyword, or content keyword)',
          },

          buttons: {
            cancel: 'Cancel',
            save: 'Save Schedule',
          },
        },

        templates: {
          title: 'SCHEDULE TEMPLATES',
          description: 'Quick-start templates for common blocking patterns',
          useTemplate: 'Use Template',
        },
      },
    },

    lockMode: {
      title: 'Lock Mode',
      description: 'Prevent impulsive changes by locking your settings for a set period',

      locked: {
        title: 'Settings are locked',
        unlocksAt: 'Unlocks at {{time}}',
        message:
          'Stay focused. Your commitment helps you avoid impulsive changes and maintain productivity.',
        extendLabel: 'Extend Lock (optional)',
        extendButton: 'Extend Lock',
        extending: 'Extending...',
        extendHint: 'You can add more time, but cannot shorten or cancel the lock',
      },

      unlocked: {
        title: 'Lock Mode',
        description:
          'Prevent configuration changes for a set period to commit to your settings and stay focused.',
        durationLabel: 'Lock Duration',
        durationPlaceholder: 'Duration',
        durationHint:
          'Examples: 30 minutes, 2 hours, or 1 day (minimum: 1 minute, maximum: 365 days)',
        activateButton: 'Activate Lock Mode',
        activating: 'Activating...',
      },

      units: {
        minutes: 'Minutes',
        hours: 'Hours',
        days: 'Days',
      },
    },

    manageSettings: {
      title: 'Manage Settings',
      description: 'Import, export, or reset your extension settings',

      importExport: {
        title: 'Import & Export',
        description: 'Save your settings to a file or load them from a previous export',
        exportButton: 'Export Settings',
        importButton: 'Import Settings',
      },

      reset: {
        title: 'Reset to Defaults',
        description:
          'Restore all settings to their original default values. This action cannot be undone.',
        button: 'Reset to Defaults',
      },

      appearance: {
        title: 'Appearance',
        description: 'Choose between light and dark theme',
      },

      language: {
        title: 'Language',
        description: 'Select your preferred language',
      },

      resetDialog: {
        title: 'Reset All Settings?',
        description:
          'This will reset all settings to their default values. All YouTube UI elements will be hidden by default (minimalist mode). This action cannot be undone.',
        cancel: 'Cancel',
        reset: 'Reset to Defaults',
      },
    },

    about: {
      title: 'About Fockey',
      subtitle: 'Minimalist, distraction-free YouTube experience',
      version: 'Version',

      whatIs: {
        title: 'What is Fockey?',
        description:
          'Fockey is a productivity-focused Chrome extension designed to transform complex, noisy websites into intent-driven, minimalistic experiences. The extension allows you to remove cognitive distractions and interact with content only when you explicitly choose to.',
      },

      philosophy: {
        title: 'Core Philosophy',
        quote: 'Minimal by default. Everything else is opt-in.',
        description:
          'Fockey enforces a clean, distraction-free default experience while preserving full user control through configurable settings.',
      },
    },
  },

  toasts: {
    settingsSaved: 'Settings saved successfully',
    settingsReset: 'All settings have been reset to defaults',
    settingsExported:
      'Settings exported (YouTube, blocked channels, schedules, Quick Block config, theme)',
    settingsImported:
      'Settings imported (YouTube, blocked channels, schedules, Quick Block config, theme)',

    channelBlocked: '{{name}} has been blocked',
    channelUnblocked: '{{name}} has been unblocked',

    lockModeActivated: 'Settings locked for {{duration}}',
    lockExtended: 'Lock extended by {{duration}}',

    quickBlockStarted: 'Focus session started for {{duration}}',
    quickBlockStartedIndefinite: 'Focus session started with no time limit',
    quickBlockStopped: 'Focus session has been stopped',
    sessionExtended: 'Added {{duration}} to your focus session',

    scheduleCreated: 'Your schedule has been created successfully',
    scheduleUpdated: 'Your schedule has been updated successfully',
    scheduleDeleted: 'The schedule has been deleted successfully',
    scheduleEnabled: 'The schedule is now active',
    scheduleDisabled: 'The schedule has been disabled',

    invalidDuration: 'Invalid Duration',
    invalidDurationMessage: 'Please enter a valid time greater than 0',
    invalidFile: 'Invalid JSON file. Please check the file format',
    selectValidFile: 'Please select a valid JSON file',

    scheduleLocked: 'Cannot modify schedules while Lock Mode is active',
    scheduleDeleteLocked: 'Cannot delete schedules while Lock Mode is active',
    settingsLocked: 'Cannot stop Quick Block while Lock Mode is active',

    noItemsConfigured: 'Please add at least one domain, URL keyword, or content keyword',
    cannotRemoveActive: 'Items cannot be removed while Quick Block is active',
    alreadyExists: 'This keyword is already in the list',
    invalidInput: 'Please enter a URL keyword',
    cannotExtend: 'This session has no time limit',

    failedToLoadSettings: 'Failed to load settings. Please refresh the page.',
    failedToResetSettings: 'Failed to reset settings. Please try again.',
    failedToBlockChannel: 'Failed to block channel. Please try again.',
    failedToUnblockChannel: 'Failed to unblock channel. Please try again.',
    failedToExportSettings: 'Failed to export settings. Please try again.',
    failedToImportSettings: 'Failed to import settings. Please check the file format.',
    failedToReadFile: 'Failed to read file. Please try again.',
    failedToLoadSchedules: 'Failed to load schedules',

    activationFailed: 'Activation Failed',
    extensionFailed: 'Extension Failed',
  },

  errors: {
    generic: 'An error occurred. Please try again.',
    loadSettings: 'Failed to load settings',
    saveSettings: 'Failed to save settings',
    networkError: 'Network error. Please check your connection.',
  },
} as const;

export type TranslationKeys = typeof en;
