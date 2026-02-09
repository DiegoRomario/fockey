/**
 * Spanish (es) translations
 * Complete translation file for Fockey Chrome Extension
 */

export const es = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    close: 'Cerrar',
    add: 'Agregar',
    edit: 'Editar',
    remove: 'Quitar',
    loading: 'Cargando...',
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    retry: 'Reintentar',
    configure: 'Configurar',
    proceed: 'Continuar',
    minutes: 'Minutos',
    hours: 'Horas',
    days: 'Días',
  },

  popup: {
    title: 'FOCKEY',
    version: 'v{{version}}',
    settings: 'Abrir Configuración',
    settingsAriaLabel: 'Abrir Configuración',
    settingsTooltip: 'Abrir Configuración',
    languageTooltip: 'Cambiar Idioma',
    loadingSettings: 'Cargando configuración...',
    failedToLoad: 'Error al cargar la configuración',
    failedToSave: 'Error al guardar la configuración. Por favor, int éntalo de nuevo.',

    lockMode: {
      settingsLocked: 'Configuración bloqueada por {{time}}',
      unlocksAt: 'Se desbloquea a las {{time}}',
      locked: 'Bloqueado',
    },

    channel: {
      currentChannel: 'Canal Actual',
      blockChannel: 'Bloquear Canal',
      unblock: 'Desbloquear',
      processing: 'Procesando...',
      blocked: '{{count}} bloqueado(s)',
      blockedChannels: 'Canales Bloqueados de YouTube',
      noBlockedChannels: 'No hay canales bloqueados',
    },

    quickBlock: {
      title: 'Bloqueo Rápido',
      description: 'Iniciar una sesión de enfoque',
      active: 'Bloqueo Rápido Activo',
      noTimeLimit: 'Sin Límite de Tiempo',
      untilManuallyStopped: 'Hasta detenerlo manualmente',
      endsAt: 'Termina a las {{time}}',
      extend: 'Extender',
      stop: 'Detener',
      viewDetails: 'Ver detalles →',
      configure: 'Configurar',
      configureQuickBlock: 'Configurar Bloqueo Rápido',
      noRulesConfigured: 'No hay reglas de bloqueo configuradas',
      noRulesConfiguredMessage: 'No hay reglas de bloqueo configuradas',

      durations: {
        '25min': '25 min',
        '1hr': '1 hora',
        '8hrs': '8 horas',
        '24hrs': '24 horas',
      },

      dialogs: {
        extendTitle: 'Extender Bloqueo Rápido',
        extendDescription: 'Agregar más tiempo a tu sesión de enfoque',
        stopTitle: '¿Detener Bloqueo Rápido?',
        stopDescription:
          '¿Estás seguro de que quieres detener esta sesión de enfoque? Tus elementos configurados se guardarán para sesiones futuras.',
        stopButton: 'Detener Sesión',
        lockModeWarningTitle: 'Iniciar Bloqueo Rápido con Modo de Bloqueo Activo',
        lockModeWarningDescriptionTimed:
          'El Modo de Bloqueo está activo actualmente. Si inicias el Bloqueo Rápido ahora, se ejecutará hasta que expire el temporizador y no podrás detenerlo manualmente mientras el Modo de Bloqueo esté activo.',
        lockModeWarningDescriptionIndefinite:
          'El Modo de Bloqueo está activo actualmente. Si inicias el Bloqueo Rápido ahora, no podrás detenerlo hasta que el Modo de Bloqueo expire.',
        lockModeWarningQuestion: '¿Quieres continuar?',
        startAnyway: 'Iniciar De Todos Modos',
      },

      errors: {
        noRules: 'No hay reglas de bloqueo configuradas',
        cannotStopLocked:
          'No se puede detener el Bloqueo Rápido mientras el Modo de Bloqueo está activo',
        failedToStart: 'Error al iniciar Bloqueo Rápido',
        failedToStop: 'Error al detener sesión',
        failedToExtend: 'Error al extender sesión',
        noTimeLimit: 'Esta sesión no tiene límite de tiempo',
      },
    },

    schedules: {
      title: 'Horarios',
      description: 'Bloqueo basado en tiempo',
      noSchedulesConfigured: '⚠ No hay horarios configurados',
      add: 'Agregar',
      createSchedule: 'Crear Horario',
      viewDetails: 'Ver detalles →',
      pause: 'Pausar',
      resume: 'Reanudar',
      delete: 'Eliminar',

      days: {
        everyDay: 'Todos los días',
        weekdays: 'Días laborables',
        weekends: 'Fines de semana',
        sun: 'Dom',
        mon: 'Lun',
        tue: 'Mar',
        wed: 'Mié',
        thu: 'Jue',
        fri: 'Vie',
        sat: 'Sáb',
      },

      time: {
        allDay: 'Todo el día',
        noTimeSet: 'Sin horario establecido',
        periods: '{{count}} períodos',
      },

      rules: {
        domains: 'Dominios Bloqueados',
        urlKeywords: 'Palabras Clave de URL',
        contentKeywords: 'Palabras Clave de Contenido',
      },
    },

    youtube: {
      title: 'Módulo de YouTube',
      description: 'Controlar experiencia de YouTube',
      configure: 'Configurar',

      global: 'Global',
      search: 'Búsqueda',
      watch: 'Ver',

      settings: {
        logo: {
          label: 'Logo de YouTube',
          tooltip: 'Mostrar el logo de YouTube en la esquina superior izquierda',
        },
        sidebar: {
          label: 'Barra Lateral',
          tooltip: 'Barra lateral de navegación y menú hamburguesa',
        },
        profile: {
          label: 'Perfil',
          tooltip: 'Foto de perfil de tu cuenta',
        },
        notifications: {
          label: 'Campana de Notificaciones',
          tooltip: 'Icono de campana de notificaciones en el encabezado',
        },
        hoverPreviews: {
          label: 'Vistas Previas al Pasar el Ratón',
          tooltip: 'Vista previa automática de video al pasar el ratón',
        },
        shorts: {
          label: 'Shorts',
          tooltip:
            'Habilitar YouTube Shorts globalmente. Cuando está desactivado (por defecto), todo el contenido de Shorts está bloqueado, incluidas las URLs directas, resultados de búsqueda y perfiles de creadores.',
        },
        posts: {
          label: 'Posts',
          tooltip:
            'Habilitar Posts de YouTube globalmente. Cuando está desactivado (por defecto), todo el contenido de Posts está bloqueado, incluidas las URLs directas, resultados de búsqueda y perfiles de creadores.',
        },
        blurThumbnails: {
          label: 'Difuminar Miniaturas',
          tooltip:
            'Difuminar todas las miniaturas de video en todas las páginas de YouTube. Cuando está habilitado, las miniaturas en los resultados de búsqueda, videos relacionados y perfiles de creadores se difuminan para reducir la estimulación visual.',
        },
        mixes: {
          label: 'Mezclas/Listas de Reproducción',
          tooltip:
            'Mezclas generadas automáticamente y listas de reproducción creadas por usuarios',
        },
        searchSuggestions: {
          label: 'Sugerencias de Búsqueda',
          tooltip:
            'Habilitar sugerencias de búsqueda (menú desplegable de autocompletar). Cuando está desactivado (por defecto), el menú de sugerencias de búsqueda está oculto para reducir distracciones y empujones algorítmicos.',
        },
        likeDislike: {
          label: 'Me Gusta/No Me Gusta',
          tooltip: 'Botones de pulgar arriba y pulgar abajo',
        },
        subscriptionActions: {
          label: 'Acciones de Suscripción',
          tooltip: 'Suscribirse, Unirse, Notificaciones, Ver Ventajas',
        },
        share: {
          label: 'Compartir',
          tooltip: 'Compartir video por enlace o redes sociales',
        },
        comments: {
          label: 'Comentarios',
          tooltip: 'Comentarios de usuarios debajo del video',
        },
        related: {
          label: 'Relacionados',
          tooltip: 'Videos recomendados y relacionados',
        },
        playlists: {
          label: 'Listas de Reproducción',
          tooltip: 'Al ver un video de una lista de reproducción',
        },
        recommendedVideo: {
          label: 'Video Recomendado',
          tooltip: 'Tarjetas de información durante la reproducción',
        },
        moreActions: {
          label: 'Más Acciones',
          tooltip:
            'Guardar, Descargar, Recortar, Agradecer, Reportar, Preguntar a IA, Menú Desbordante',
        },
      },
    },
  },

  options: {
    title: 'Configuración de Fockey',
    subtitle: 'YouTube sin distracciones',

    tabs: {
      youtube: 'YouTube',
      general: 'General',
      lockMode: 'Modo de Bloqueo',
      manageSettings: 'Gestionar Configuración',
      about: 'Acerca de',
    },

    saveStatus: {
      saving: 'Guardando cambios...',
      saved: 'Todos los cambios guardados',
      ready: 'Listo',
    },

    youtube: {
      title: 'Configuración de YouTube',
      description: 'Personaliza tu experiencia minimalista en YouTube',

      tabs: {
        elements: 'Configuración de Elementos',
        blockedChannels: 'Canales Bloqueados',
      },

      globalNavigation: {
        title: 'Elementos de Navegación Global',
        description:
          'Estas configuraciones se aplican a **todas las páginas de YouTube** (Inicio, Búsqueda, Ver). Controla los elementos persistentes de encabezado y barra lateral que aparecen consistentemente en todas las páginas.',
      },

      searchPage: {
        title: 'Configuración de Página de Búsqueda',
        description:
          'Controla qué contenido aparece en los resultados de búsqueda de YouTube. Por defecto, solo se muestran videos de formato largo. Usa **Elementos de Navegación Global** arriba para controlar encabezado, barra lateral, Shorts y visibilidad de Posts.',
      },

      watchPage: {
        title: 'Configuración de Página de Ver',
        description:
          'Controla qué botones y elementos son visibles al ver videos. Los controles del reproductor de video siempre se conservan.',
      },

      blockedChannels: {
        title: 'Canales Bloqueados de YouTube',
        description:
          'Bloquea canales específicos de YouTube para evitar el acceso a su contenido en todas las páginas. Puedes bloquear por identificador de canal (@usuario), URL de canal o nombre de canal.',
        inputPlaceholder: 'Ingresa identificador, URL o nombre del canal',
        blockButton: 'Bloquear',
        blocking: 'Bloqueando...',
        emptyState: 'Aún no hay canales bloqueados',
        emptyStateDescription: 'Agrega un canal arriba para comenzar',
        count: 'Canales Bloqueados ({{count}})',
        unblock: 'Desbloquear',
      },
    },

    general: {
      title: 'Bloqueo General',
      description:
        'Bloquea sitios web y contenido en internet con reglas de bloqueo permanentes y temporales.',
      schedulesTitle: 'Horarios Basados en Tiempo',

      quickBlock: {
        title: 'Bloqueo Rápido',
        description:
          'Bloqueo temporal rápido para sesiones de enfoque inmediatas. Diseñado para funcionar con el Modo de Bloqueo.',

        configureRules: 'Configurar Reglas de Bloqueo',
        startQuickBlock: 'Iniciar Bloqueo Rápido',
        active: 'Bloqueo Rápido Activo',
        endsAt: 'Termina a las {{time}}',
        noTimeLimit: 'Sin Límite de Tiempo',
        untilStopped: 'La sesión continuará hasta que se detenga manualmente',

        tabs: {
          domains: 'Dominios',
          urlKeywords: 'Palabras Clave de URL',
          contentKeywords: 'Palabras Clave de Contenido',
        },

        domains: {
          placeholder: 'ejemplo.com o *.ejemplo.com',
          error:
            'Ingresa un dominio válido (por ejemplo, ejemplo.com o *.ejemplo.com para comodines)',
          hint: 'Ejemplos: reddit.com, twitter.com, *.facebook.com',
          empty: 'No hay dominios configurados aún',
        },

        urlKeywords: {
          placeholder: 'watch?v= o /shorts/ o playlist',
          hint: 'Bloquear cualquier URL que contenga esta palabra clave (sin distinguir mayúsculas)',
          empty: 'No hay palabras clave de URL configuradas aún',
        },

        contentKeywords: {
          placeholder: 'tendencia o celebridad o chisme',
          hint: 'Bloquear elementos que contengan esta palabra clave.',
          empty: 'No hay palabras clave de contenido configuradas aún',
        },

        durations: {
          chooseOrNoLimit: 'Elige una duración o inicia sin límite de tiempo',
          configureToStart: 'Configura al menos una regla de bloqueo para iniciar',
          '25min': '25 min',
          '1hr': '1 h',
          '8hrs': '8 h',
          '24hrs': '24 h',
          custom: 'Personalizado',
          indefinite: 'Iniciar Bloqueo Rápido',
        },

        currentlyBlocking: 'Bloqueando Actualmente',
        canAddDuringSession: 'Puedes agregar nuevos elementos durante una sesión activa',

        buttons: {
          extendTime: 'Extender Tiempo',
          stopSession: 'Detener Sesión',
        },

        dialogs: {
          customTitle: 'Duración Personalizada',
          customDescription: 'Establece una duración personalizada para el Bloqueo Rápido',
          hoursLabel: 'horas',
          minutesLabel: 'minutos',
          start: 'Iniciar',

          extendTitle: 'Extender Bloqueo Rápido',
          extendDescription: 'Agregar más tiempo a tu sesión de enfoque',
          addTime: 'Agregar Tiempo',
          extend: 'Extender',

          stopTitle: '¿Detener Bloqueo Rápido?',
          stopDescription:
            '¿Estás seguro de que quieres detener esta sesión de enfoque? Tus elementos configurados se guardarán para sesiones futuras.',
          stopButton: 'Detener Sesión',

          lockWarningTitle: 'Iniciar Bloqueo Rápido con Modo de Bloqueo Activo',
          lockWarningDescription:
            'El Modo de Bloqueo está activo actualmente. Si inicias el Bloqueo Rápido ahora, se ejecutará hasta que expire el temporizador y no podrás detenerlo manualmente mientras el Modo de Bloqueo esté activo.',
          lockWarningDescriptionIndefinite:
            'El Modo de Bloqueo está activo actualmente. Si inicias el Bloqueo Rápido ahora, no podrás detenerlo hasta que el Modo de Bloqueo expire.',
          lockWarningQuestion: '¿Quieres continuar?',
          startAnyway: 'Iniciar De Todos Modos',
        },
      },

      schedules: {
        title: 'Horarios',
        description:
          'Reglas de bloqueo basadas en tiempo. Cada horario puede bloquear dominios específicos y palabras clave durante horarios designados.',
        addSchedule: 'Agregar Horario',
        emptyState: 'No hay horarios configurados',
        emptyStateDescription: 'Haz clic en "Agregar Horario" para crear uno.',

        card: {
          active: 'Activo',
          pause: 'Pausar',
          resume: 'Reanudar',
          delete: 'Eliminar',
          optionsAriaLabel: 'Opciones de horario',
        },

        rules: {
          domain: '{{count}} Dominio',
          domains: '{{count}} Dominios',
          urlKeyword: '{{count}} Palabra Clave de URL',
          urlKeywords: '{{count}} Palabras Clave de URL',
          contentKeyword: '{{count}} Palabra Clave de Contenido',
          contentKeywords: '{{count}} Palabras Clave de Contenido',
          blockedDomains: 'Dominios Bloqueados',
          urlKeywordsLabel: 'Palabras Clave de URL',
          contentKeywordsLabel: 'Palabras Clave de Contenido',
        },

        deleteDialog: {
          title: 'Eliminar Horario',
          description:
            '¿Estás seguro de que quieres eliminar este horario? Esta acción no se puede deshacer.',
          cancel: 'Cancelar',
          delete: 'Eliminar',
        },

        edit: {
          titleEdit: 'Editar Horario',
          titleCreate: 'Crear Horario',
          descriptionEdit: 'Modificar tu horario de bloqueo existente',
          descriptionCreate: 'Configurar un nuevo horario de bloqueo basado en tiempo',

          name: {
            label: 'Nombre del Horario',
            placeholder: 'ej., Trabajo Concentrado',
          },

          icon: {
            label: 'Icono (Opcional)',
          },

          days: {
            label: 'Días',
            all: 'Todos',
            weekdays: 'Días laborables',
            weekend: 'Fin de semana',
            clear: 'Limpiar',
            sun: 'Dom',
            mon: 'Lun',
            tue: 'Mar',
            wed: 'Mié',
            thu: 'Jue',
            fri: 'Vie',
            sat: 'Sáb',
          },

          timePeriods: {
            label: 'Períodos de Tiempo Activos',
            hint: 'El horario estará activo durante estos tiempos. Agrega múltiples períodos para pausas (ej., pausar para el almuerzo).',
            warning:
              '⚠ No hay más tiempo disponible en el día. Los períodos deben permanecer dentro de 00:00 - 23:59.',
            addPeriod: 'Agregar Período',
            periodLabel: 'Período {{index}}',
            overlap: '⚠ Este período se superpone con otra ventana de tiempo',
            overlapError: '⚠ Los períodos de tiempo no pueden superponerse',
            overlapErrorDescription:
              'Por favor, ajusta los horarios para que los períodos no entren en conflicto.',
          },

          whatToBlock: 'Qué Bloquear',

          blockedDomains: {
            label: 'Dominios Bloqueados',
            placeholder: 'ejemplo.com',
            empty: 'No se agregaron dominios',
            error: '⚠ {{error}}',
          },

          urlKeywords: {
            label: 'Palabras Clave de URL',
            placeholder: 'ej., tendencia, viral',
            hint: 'Bloquear páginas con estas palabras clave en la URL',
            empty: 'No se agregaron palabras clave de URL',
          },

          contentKeywords: {
            label: 'Palabras Clave de Contenido',
            placeholder: 'ej., noticias de última hora, celebridad',
            hint: 'Bloquear elementos que contengan estas palabras clave.',
            empty: 'No se agregaron palabras clave de contenido',
          },

          validation: {
            nameRequired: 'El nombre del horario es obligatorio',
            daysRequired: 'Se debe seleccionar al menos un día',
            timePeriodsRequired: 'Se requiere al menos un período de tiempo',
            timePeriodsOverlap:
              'Los períodos de tiempo no pueden superponerse. Por favor, ajusta los horarios para que los períodos no entren en conflicto.',
            rulesRequired:
              'Se requiere al menos una regla de bloqueo (dominio, palabra clave de URL o palabra clave de contenido)',
          },

          buttons: {
            cancel: 'Cancelar',
            save: 'Guardar Horario',
          },
        },

        templates: {
          title: 'PLANTILLAS DE HORARIOS',
          description: 'Plantillas de inicio rápido para patrones de bloqueo comunes',
          useTemplate: 'Usar Plantilla',
        },
      },
    },

    lockMode: {
      title: 'Modo de Bloqueo',
      description: 'Evita cambios impulsivos bloqueando tu configuración por un período definido',

      locked: {
        title: 'Configuración bloqueada',
        unlocksAt: 'Se desbloquea a las {{time}}',
        message:
          'Mantén el enfoque. Tu compromiso te ayuda a evitar cambios impulsivos y mantener la productividad.',
        extendLabel: 'Extender Bloqueo (opcional)',
        extendButton: 'Extender Bloqueo',
        extending: 'Extendiendo...',
        extendHint: 'Puedes agregar más tiempo, pero no puedes acortar o cancelar el bloqueo',
      },

      unlocked: {
        title: 'Modo de Bloqueo',
        description:
          'Evita cambios de configuración por un período definido para comprometerte con tu configuración y permanecer enfocado.',
        durationLabel: 'Duración del Bloqueo',
        durationPlaceholder: 'Duración',
        durationHint: 'Ejemplos: 30 minutos, 2 horas o 1 día (mínimo: 1 minuto, máximo: 365 días)',
        activateButton: 'Activar Modo de Bloqueo',
        activating: 'Activando...',
      },

      units: {
        minutes: 'Minutos',
        hours: 'Horas',
        days: 'Días',
      },
    },

    manageSettings: {
      title: 'Gestionar Configuración',
      description: 'Importar, exportar o restablecer la configuración de la extensión',

      importExport: {
        title: 'Importar y Exportar',
        description:
          'Guarda tu configuración en un archivo o cárgala desde una exportación anterior',
        exportButton: 'Exportar Configuración',
        importButton: 'Importar Configuración',
      },

      reset: {
        title: 'Restablecer a Valores Predeterminados',
        description:
          'Restaura toda la configuración a sus valores predeterminados originales. Esta acción no se puede deshacer.',
        button: 'Restablecer a Valores Predeterminados',
      },

      appearance: {
        title: 'Apariencia',
        description: 'Elige entre tema claro y oscuro',
      },

      language: {
        title: 'Idioma',
        description: 'Selecciona tu idioma preferido',
      },

      resetDialog: {
        title: '¿Restablecer Toda la Configuración?',
        description:
          'Esto restablecerá toda la configuración a sus valores predeterminados. Todos los elementos de la interfaz de YouTube se ocultarán por defecto (modo minimalista). Esta acción no se puede deshacer.',
        cancel: 'Cancelar',
        reset: 'Restablecer a Valores Predeterminados',
      },
    },

    about: {
      title: 'Acerca de Fockey',
      subtitle: 'Experiencia minimalista y sin distracciones en YouTube',
      version: 'Versión',

      whatIs: {
        title: '¿Qué es Fockey?',
        description:
          'Fockey es una extensión de Chrome enfocada en la productividad, diseñada para transformar sitios web complejos y ruidosos en experiencias minimalistas orientadas a la intención. La extensión te permite eliminar distracciones cognitivas e interactuar con el contenido solo cuando eliges explícitamente.',
      },

      philosophy: {
        title: 'Filosofía Central',
        quote: 'Minimalista por defecto. Todo lo demás es opcional.',
        description:
          'Fockey impone una experiencia predeterminada limpia y sin distracciones, preservando el control total del usuario a través de configuraciones configurables.',
      },
    },
  },

  toasts: {
    settingsSaved: 'Configuración guardada con éxito',
    settingsReset: 'Toda la configuración se ha restablecido a los valores predeterminados',
    settingsExported:
      'Configuración exportada (YouTube, canales bloqueados, horarios, config de Bloqueo Rápido, tema)',
    settingsImported:
      'Configuración importada (YouTube, canales bloqueados, horarios, config de Bloqueo Rápido, tema)',

    channelBlocked: '{{name}} ha sido bloqueado',
    channelUnblocked: '{{name}} ha sido desbloqueado',

    lockModeActivated: 'Configuración bloqueada por {{duration}}',
    lockExtended: 'Bloqueo extendido por {{duration}}',

    quickBlockStarted: 'Sesión de enfoque iniciada por {{duration}}',
    quickBlockStartedIndefinite: 'Sesión de enfoque iniciada sin límite de tiempo',
    quickBlockStopped: 'La sesión de enfoque se ha detenido',
    sessionExtended: 'Agregado {{duration}} a tu sesión de enfoque',

    scheduleCreated: 'Tu horario se ha creado con éxito',
    scheduleUpdated: 'Tu horario se ha actualizado con éxito',
    scheduleDeleted: 'El horario se ha eliminado con éxito',
    scheduleEnabled: 'El horario está activo ahora',
    scheduleDisabled: 'El horario se ha desactivado',

    invalidDuration: 'Duración Inválida',
    invalidDurationMessage: 'Ingresa un tiempo válido mayor que 0',
    invalidFile: 'Archivo JSON inválido. Verifica el formato del archivo',
    selectValidFile: 'Selecciona un archivo JSON válido',

    scheduleLocked: 'No se pueden modificar horarios mientras el Modo de Bloqueo está activo',
    scheduleDeleteLocked: 'No se pueden eliminar horarios mientras el Modo de Bloqueo está activo',
    settingsLocked: 'No se puede detener el Bloqueo Rápido mientras el Modo de Bloqueo está activo',

    noItemsConfigured:
      'Agrega al menos un dominio, palabra clave de URL o palabra clave de contenido',
    cannotRemoveActive:
      'Los elementos no se pueden eliminar mientras el Bloqueo Rápido está activo',
    alreadyExists: 'Esta palabra clave ya está en la lista',
    invalidInput: 'Ingresa una palabra clave de URL',
    cannotExtend: 'Esta sesión no tiene límite de tiempo',

    failedToLoadSettings: 'Error al cargar la configuración. Actualiza la página.',
    failedToResetSettings: 'Error al restablecer la configuración. Inténtalo de nuevo.',
    failedToBlockChannel: 'Error al bloquear canal. Inténtalo de nuevo.',
    failedToUnblockChannel: 'Error al desbloquear canal. Inténtalo de nuevo.',
    failedToExportSettings: 'Error al exportar la configuración. Inténtalo de nuevo.',
    failedToImportSettings: 'Error al importar la configuración. Verifica el formato del archivo.',
    failedToReadFile: 'Error al leer el archivo. Inténtalo de nuevo.',
    failedToLoadSchedules: 'Error al cargar horarios',

    activationFailed: 'Activación Fallida',
    extensionFailed: 'Extensión Fallida',
  },

  errors: {
    generic: 'Ocurrió un error. Inténtalo de nuevo.',
    loadSettings: 'Error al cargar la configuración',
    saveSettings: 'Error al guardar la configuración',
    networkError: 'Error de red. Verifica tu conexión.',
  },
} as const;
