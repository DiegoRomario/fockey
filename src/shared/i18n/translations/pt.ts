/**
 * Portuguese (pt-BR) translations
 * Complete translation file for Fockey Chrome Extension
 */

export const pt = {
  common: {
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    confirm: 'Confirmar',
    close: 'Fechar',
    add: 'Adicionar',
    edit: 'Editar',
    remove: 'Remover',
    loading: 'Carregando...',
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Aviso',
    retry: 'Tentar novamente',
    configure: 'Configurar',
    proceed: 'Prosseguir',
    minutes: 'Minutos',
    hours: 'Horas',
    days: 'Dias',
  },

  popup: {
    title: 'FOCKEY',
    version: 'v{{version}}',
    settings: 'Abrir Configurações',
    settingsAriaLabel: 'Abrir Configurações',
    settingsTooltip: 'Abrir Configurações',
    languageTooltip: 'Alterar Idioma',
    loadingSettings: 'Carregando configurações...',
    failedToLoad: 'Falha ao carregar configurações',
    failedToSave: 'Falha ao salvar configurações. Por favor, tente novamente.',

    lockMode: {
      settingsLocked: 'Configurações bloqueadas por {{time}}',
      unlocksAt: 'Desbloqueia às {{time}}',
      locked: 'Bloqueado',
    },

    channel: {
      currentChannel: 'Canal Atual',
      blockChannel: 'Bloquear Canal',
      unblock: 'Desbloquear',
      processing: 'Processando...',
      blocked: '{{count}} bloqueado(s)',
      blockedChannels: 'Canais Bloqueados do YouTube',
      noBlockedChannels: 'Nenhum canal bloqueado',
    },

    quickBlock: {
      title: 'Bloqueio Rápido',
      description: 'Iniciar uma sessão de foco',
      active: 'Bloqueio Rápido Ativo',
      noTimeLimit: 'Sem Limite de Tempo',
      untilManuallyStopped: 'Até parar manualmente',
      endsAt: 'Termina às {{time}}',
      extend: 'Estender',
      stop: 'Parar',
      viewDetails: 'Ver detalhes →',
      configure: 'Configurar',
      configureQuickBlock: 'Configurar Bloqueio Rápido',
      noRulesConfigured: 'Nenhuma regra de bloqueio configurada',
      noRulesConfiguredMessage: 'Nenhuma regra de bloqueio configurada',

      durations: {
        '25min': '25 min',
        '1hr': '1 hora',
        '8hrs': '8 horas',
        '24hrs': '24 horas',
      },

      dialogs: {
        extendTitle: 'Estender Bloqueio Rápido',
        extendDescription: 'Adicionar mais tempo à sua sessão de foco',
        stopTitle: 'Parar Bloqueio Rápido?',
        stopDescription:
          'Tem certeza de que deseja parar esta sessão de foco? Seus itens configurados serão salvos para sessões futuras.',
        stopButton: 'Parar Sessão',
        lockModeWarningTitle: 'Iniciar Bloqueio Rápido com Modo de Bloqueio Ativo',
        lockModeWarningDescriptionTimed:
          'O Modo de Bloqueio está ativo no momento. Se você iniciar o Bloqueio Rápido agora, ele será executado até o cronômetro expirar e você não poderá pará-lo manualmente enquanto o Modo de Bloqueio estiver ativo.',
        lockModeWarningDescriptionIndefinite:
          'O Modo de Bloqueio está ativo no momento. Se você iniciar o Bloqueio Rápido agora, não poderá pará-lo até que o Modo de Bloqueio expire.',
        lockModeWarningQuestion: 'Deseja prosseguir?',
        startAnyway: 'Iniciar Mesmo Assim',
      },

      errors: {
        noRules: 'Nenhuma regra de bloqueio configurada',
        cannotStopLocked:
          'Não é possível parar o Bloqueio Rápido enquanto o Modo de Bloqueio está ativo',
        failedToStart: 'Falha ao iniciar Bloqueio Rápido',
        failedToStop: 'Falha ao parar sessão',
        failedToExtend: 'Falha ao estender sessão',
        noTimeLimit: 'Esta sessão não tem limite de tempo',
      },
    },

    schedules: {
      title: 'Agendamentos',
      description: 'Bloqueio baseado em tempo',
      noSchedulesConfigured: '⚠ Nenhum agendamento configurado',
      add: 'Adicionar',
      createSchedule: 'Criar Agendamento',
      viewDetails: 'Ver detalhes →',
      pause: 'Pausar',
      resume: 'Retomar',
      delete: 'Excluir',

      days: {
        everyDay: 'Todos os dias',
        weekdays: 'Dias úteis',
        weekends: 'Fins de semana',
        sun: 'Dom',
        mon: 'Seg',
        tue: 'Ter',
        wed: 'Qua',
        thu: 'Qui',
        fri: 'Sex',
        sat: 'Sáb',
      },

      time: {
        allDay: 'O dia todo',
        noTimeSet: 'Nenhum horário definido',
        periods: '{{count}} períodos',
      },

      rules: {
        domains: 'Domínios Bloqueados',
        urlKeywords: 'Palavras-chave de URL',
        contentKeywords: 'Palavras-chave de Conteúdo',
      },
    },

    youtube: {
      title: 'Módulo YouTube',
      description: 'Controlar experiência do YouTube',
      configure: 'Configurar',

      global: 'Global',
      search: 'Pesquisa',
      watch: 'Assistir',

      settings: {
        logo: {
          label: 'Logo do YouTube',
          tooltip: 'Exibir o logo do YouTube no canto superior esquerdo',
        },
        sidebar: {
          label: 'Barra Lateral',
          tooltip: 'Barra lateral de navegação e menu hambúrguer',
        },
        profile: {
          label: 'Perfil',
          tooltip: 'Foto de perfil da sua conta',
        },
        notifications: {
          label: 'Sino de Notificações',
          tooltip: 'Ícone de sino de notificações no cabeçalho',
        },
        hoverPreviews: {
          label: 'Visualizações ao Passar o Mouse',
          tooltip: 'Pré-visualização automática de vídeo ao passar o mouse',
        },
        shorts: {
          label: 'Shorts',
          tooltip:
            'Ativar YouTube Shorts globalmente. Quando desativado (padrão), todo o conteúdo de Shorts é bloqueado, incluindo URLs diretas, resultados de pesquisa e perfis de criadores.',
        },
        posts: {
          label: 'Posts',
          tooltip:
            'Ativar Posts do YouTube globalmente. Quando desativado (padrão), todo o conteúdo de Posts é bloqueado, incluindo URLs diretas, resultados de pesquisa e perfis de criadores.',
        },
        blurThumbnails: {
          label: 'Desfocar Miniaturas',
          tooltip:
            'Desfocar todas as miniaturas de vídeo em todas as páginas do YouTube. Quando ativado, as miniaturas nos resultados de pesquisa, vídeos relacionados e perfis de criadores são desfocadas para reduzir o estímulo visual.',
        },
        mixes: {
          label: 'Mixes/Playlists',
          tooltip: 'Mixes gerados automaticamente e playlists criadas por usuários',
        },
        searchSuggestions: {
          label: 'Sugestões de Pesquisa',
          tooltip:
            'Ativar sugestões de pesquisa (menu suspenso de autocompletar). Quando desativado (padrão), o menu de sugestões de pesquisa é ocultado para reduzir distrações e empurrões algorítmicos.',
        },
        likeDislike: {
          label: 'Curtir/Descurtir',
          tooltip: 'Botões de polegar para cima e para baixo',
        },
        subscriptionActions: {
          label: 'Ações de Inscrição',
          tooltip: 'Inscrever-se, Participar, Notificações, Ver Vantagens',
        },
        share: {
          label: 'Compartilhar',
          tooltip: 'Compartilhar vídeo por link ou mídia social',
        },
        comments: {
          label: 'Comentários',
          tooltip: 'Comentários de usuários abaixo do vídeo',
        },
        related: {
          label: 'Relacionados',
          tooltip: 'Vídeos recomendados e relacionados',
        },
        playlists: {
          label: 'Playlists',
          tooltip: 'Ao assistir um vídeo de uma playlist',
        },
        recommendedVideo: {
          label: 'Vídeo Recomendado',
          tooltip: 'Cartões de informação durante a reprodução',
        },
        moreActions: {
          label: 'Mais Ações',
          tooltip: 'Salvar, Baixar, Recortar, Agradecer, Denunciar, Perguntar à IA, Menu Overflow',
        },
      },
    },
  },

  options: {
    title: 'Configurações do Fockey',
    subtitle: 'YouTube sem distrações',

    tabs: {
      youtube: 'YouTube',
      general: 'Geral',
      lockMode: 'Modo de Bloqueio',
      manageSettings: 'Gerenciar Configurações',
      about: 'Sobre',
    },

    saveStatus: {
      saving: 'Salvando alterações...',
      saved: 'Todas as alterações salvas',
      ready: 'Pronto',
    },

    youtube: {
      title: 'Configurações do YouTube',
      description: 'Personalize sua experiência minimalista no YouTube',

      tabs: {
        elements: 'Configurações de Elementos',
        blockedChannels: 'Canais Bloqueados',
      },

      globalNavigation: {
        title: 'Elementos de Navegação Global',
        description:
          'Essas configurações se aplicam a **todas as páginas do YouTube** (Início, Pesquisa, Assistir). Controle elementos persistentes de cabeçalho e barra lateral que aparecem consistentemente em todas as páginas.',
      },

      searchPage: {
        title: 'Configurações da Página de Pesquisa',
        description:
          'Controle qual conteúdo aparece nos resultados de pesquisa do YouTube. Por padrão, apenas vídeos de formato longo são exibidos. Use **Elementos de Navegação Global** acima para controlar cabeçalho, barra lateral, Shorts e visibilidade de Posts.',
      },

      watchPage: {
        title: 'Configurações da Página de Assistir',
        description:
          'Controle quais botões e elementos são visíveis ao assistir vídeos. Os controles do player de vídeo são sempre preservados.',
      },

      blockedChannels: {
        title: 'Canais Bloqueados do YouTube',
        description:
          'Bloqueie canais específicos do YouTube para impedir o acesso ao conteúdo deles em todas as páginas. Você pode bloquear por identificador do canal (@usuário), URL do canal ou nome do canal.',
        inputPlaceholder: 'Digite o identificador, URL ou nome do canal',
        blockButton: 'Bloquear',
        blocking: 'Bloqueando...',
        emptyState: 'Ainda não há canais bloqueados',
        emptyStateDescription: 'Adicione um canal acima para começar',
        count: 'Canais Bloqueados ({{count}})',
        unblock: 'Desbloquear',
      },
    },

    general: {
      title: 'Bloqueio Geral',
      description:
        'Bloqueie sites e conteúdo na internet com regras de bloqueio permanentes e temporárias.',
      schedulesTitle: 'Agendamentos Baseados em Tempo',

      quickBlock: {
        title: 'Bloqueio Rápido',
        description:
          'Bloqueio temporário rápido para sessões de foco imediatas. Projetado para funcionar com o Modo de Bloqueio.',

        configureRules: 'Configurar Regras de Bloqueio',
        startQuickBlock: 'Iniciar Bloqueio Rápido',
        active: 'Bloqueio Rápido Ativo',
        endsAt: 'Termina às {{time}}',
        noTimeLimit: 'Sem Limite de Tempo',
        untilStopped: 'A sessão continuará até ser parada manualmente',

        tabs: {
          domains: 'Domínios',
          urlKeywords: 'Palavras-chave de URL',
          contentKeywords: 'Palavras-chave de Conteúdo',
        },

        domains: {
          placeholder: 'exemplo.com ou *.exemplo.com',
          error:
            'Digite um domínio válido (por exemplo, exemplo.com ou *.exemplo.com para curingas)',
          hint: 'Exemplos: reddit.com, twitter.com, *.facebook.com',
          empty: 'Nenhum domínio configurado ainda',
        },

        urlKeywords: {
          placeholder: 'watch?v= ou /shorts/ ou playlist',
          hint: 'Bloquear qualquer URL contendo esta palavra-chave (não diferencia maiúsculas de minúsculas)',
          empty: 'Nenhuma palavra-chave de URL configurada ainda',
        },

        contentKeywords: {
          placeholder: 'tendência ou celebridade ou fofoca',
          hint: 'Bloquear elementos contendo esta palavra-chave.',
          empty: 'Nenhuma palavra-chave de conteúdo configurada ainda',
        },

        durations: {
          chooseOrNoLimit: 'Escolha uma duração ou inicie sem limite de tempo',
          configureToStart: 'Configure pelo menos uma regra de bloqueio para iniciar',
          '25min': '25 min',
          '1hr': '1 h',
          '8hrs': '8 h',
          '24hrs': '24 h',
          custom: 'Personalizado',
          indefinite: 'Iniciar Bloqueio Rápido',
        },

        currentlyBlocking: 'Bloqueando Atualmente',
        canAddDuringSession: 'Você pode adicionar novos itens durante uma sessão ativa',

        buttons: {
          extendTime: 'Estender Tempo',
          stopSession: 'Parar Sessão',
        },

        dialogs: {
          customTitle: 'Duração Personalizada',
          customDescription: 'Defina uma duração personalizada para o Bloqueio Rápido',
          hoursLabel: 'horas',
          minutesLabel: 'minutos',
          start: 'Iniciar',

          extendTitle: 'Estender Bloqueio Rápido',
          extendDescription: 'Adicionar mais tempo à sua sessão de foco',
          addTime: 'Adicionar Tempo',
          extend: 'Estender',

          stopTitle: 'Parar Bloqueio Rápido?',
          stopDescription:
            'Tem certeza de que deseja parar esta sessão de foco? Seus itens configurados serão salvos para sessões futuras.',
          stopButton: 'Parar Sessão',

          lockWarningTitle: 'Iniciar Bloqueio Rápido com Modo de Bloqueio Ativo',
          lockWarningDescription:
            'O Modo de Bloqueio está ativo no momento. Se você iniciar o Bloqueio Rápido agora, ele será executado até o cronômetro expirar e você não poderá pará-lo manualmente enquanto o Modo de Bloqueio estiver ativo.',
          lockWarningDescriptionIndefinite:
            'O Modo de Bloqueio está ativo no momento. Se você iniciar o Bloqueio Rápido agora, não poderá pará-lo até que o Modo de Bloqueio expire.',
          lockWarningQuestion: 'Deseja prosseguir?',
          startAnyway: 'Iniciar Mesmo Assim',
        },
      },

      schedules: {
        title: 'Agendamentos',
        description:
          'Regras de bloqueio baseadas em tempo. Cada agendamento pode bloquear domínios específicos e palavras-chave durante horários designados.',
        addSchedule: 'Adicionar Agendamento',
        emptyState: 'Nenhum agendamento configurado',
        emptyStateDescription: 'Clique em "Adicionar Agendamento" para criar um.',

        card: {
          active: 'Ativo',
          pause: 'Pausar',
          resume: 'Retomar',
          delete: 'Excluir',
          optionsAriaLabel: 'Opções de agendamento',
        },

        rules: {
          domain: '{{count}} Domínio',
          domains: '{{count}} Domínios',
          urlKeyword: '{{count}} Palavra-chave de URL',
          urlKeywords: '{{count}} Palavras-chave de URL',
          contentKeyword: '{{count}} Palavra-chave de Conteúdo',
          contentKeywords: '{{count}} Palavras-chave de Conteúdo',
          blockedDomains: 'Domínios Bloqueados',
          urlKeywordsLabel: 'Palavras-chave de URL',
          contentKeywordsLabel: 'Palavras-chave de Conteúdo',
        },

        deleteDialog: {
          title: 'Excluir Agendamento',
          description:
            'Tem certeza de que deseja excluir este agendamento? Esta ação não pode ser desfeita.',
          cancel: 'Cancelar',
          delete: 'Excluir',
        },

        edit: {
          titleEdit: 'Editar Agendamento',
          titleCreate: 'Criar Agendamento',
          descriptionEdit: 'Modificar seu agendamento de bloqueio existente',
          descriptionCreate: 'Configurar um novo agendamento de bloqueio baseado em tempo',

          name: {
            label: 'Nome do Agendamento',
            placeholder: 'ex., Trabalho Focado',
          },

          icon: {
            label: 'Ícone (Opcional)',
          },

          days: {
            label: 'Dias',
            all: 'Todos',
            weekdays: 'Dias úteis',
            weekend: 'Fim de semana',
            clear: 'Limpar',
            sun: 'Dom',
            mon: 'Seg',
            tue: 'Ter',
            wed: 'Qua',
            thu: 'Qui',
            fri: 'Sex',
            sat: 'Sáb',
          },

          timePeriods: {
            label: 'Períodos de Tempo Ativos',
            hint: 'O agendamento estará ativo durante esses horários. Adicione vários períodos para intervalos (por exemplo, pausar para o almoço).',
            warning:
              '⚠ Não há mais tempo disponível no dia. Os períodos devem permanecer dentro de 00:00 - 23:59.',
            addPeriod: 'Adicionar Período',
            periodLabel: 'Período {{index}}',
            overlap: '⚠ Este período se sobrepõe a outra janela de tempo',
            overlapError: '⚠ Os períodos de tempo não podem se sobrepor',
            overlapErrorDescription:
              'Por favor, ajuste os horários para que os períodos não entrem em conflito.',
          },

          whatToBlock: 'O Que Bloquear',

          blockedDomains: {
            label: 'Domínios Bloqueados',
            placeholder: 'exemplo.com',
            empty: 'Nenhum domínio adicionado',
            error: '⚠ {{error}}',
          },

          urlKeywords: {
            label: 'Palavras-chave de URL',
            placeholder: 'ex., tendência, viral',
            hint: 'Bloquear páginas com essas palavras-chave na URL',
            empty: 'Nenhuma palavra-chave de URL adicionada',
          },

          contentKeywords: {
            label: 'Palavras-chave de Conteúdo',
            placeholder: 'ex., notícias de última hora, celebridade',
            hint: 'Bloquear elementos contendo essas palavras-chave.',
            empty: 'Nenhuma palavra-chave de conteúdo adicionada',
          },

          validation: {
            nameRequired: 'O nome do agendamento é obrigatório',
            daysRequired: 'Pelo menos um dia deve ser selecionado',
            timePeriodsRequired: 'Pelo menos um período de tempo é obrigatório',
            timePeriodsOverlap:
              'Os períodos de tempo não podem se sobrepor. Por favor, ajuste os horários para que os períodos não entrem em conflito.',
            rulesRequired:
              'Pelo menos uma regra de bloqueio é obrigatória (domínio, palavra-chave de URL ou palavra-chave de conteúdo)',
          },

          buttons: {
            cancel: 'Cancelar',
            save: 'Salvar Agendamento',
          },
        },

        templates: {
          title: 'MODELOS DE AGENDAMENTO',
          description: 'Modelos de início rápido para padrões de bloqueio comuns',
          useTemplate: 'Usar Modelo',
        },
      },
    },

    lockMode: {
      title: 'Modo de Bloqueio',
      description:
        'Evite mudanças impulsivas bloqueando suas configurações por um período definido',

      locked: {
        title: 'Configurações bloqueadas',
        unlocksAt: 'Desbloqueia às {{time}}',
        message:
          'Mantenha o foco. Seu compromisso ajuda você a evitar mudanças impulsivas e manter a produtividade.',
        extendLabel: 'Estender Bloqueio (opcional)',
        extendButton: 'Estender Bloqueio',
        extending: 'Estendendo...',
        extendHint: 'Você pode adicionar mais tempo, mas não pode encurtar ou cancelar o bloqueio',
      },

      unlocked: {
        title: 'Modo de Bloqueio',
        description:
          'Evite mudanças de configuração por um período definido para se comprometer com suas configurações e permanecer focado.',
        durationLabel: 'Duração do Bloqueio',
        durationPlaceholder: 'Duração',
        durationHint: 'Exemplos: 30 minutos, 2 horas ou 1 dia (mínimo: 1 minuto, máximo: 365 dias)',
        activateButton: 'Ativar Modo de Bloqueio',
        activating: 'Ativando...',
      },

      units: {
        minutes: 'Minutos',
        hours: 'Horas',
        days: 'Dias',
      },
    },

    manageSettings: {
      title: 'Gerenciar Configurações',
      description: 'Importar, exportar ou redefinir as configurações da extensão',

      importExport: {
        title: 'Importar e Exportar',
        description:
          'Salve suas configurações em um arquivo ou carregue de uma exportação anterior',
        exportButton: 'Exportar Configurações',
        importButton: 'Importar Configurações',
      },

      reset: {
        title: 'Redefinir para Padrões',
        description:
          'Restaure todas as configurações para seus valores padrão originais. Esta ação não pode ser desfeita.',
        button: 'Redefinir para Padrões',
      },

      appearance: {
        title: 'Aparência',
        description: 'Escolha entre tema claro e escuro',
      },

      language: {
        title: 'Idioma',
        description: 'Selecione seu idioma preferido',
      },

      resetDialog: {
        title: 'Redefinir Todas as Configurações?',
        description:
          'Isso redefinirá todas as configurações para seus valores padrão. Todos os elementos de interface do YouTube serão ocultados por padrão (modo minimalista). Esta ação não pode ser desfeita.',
        cancel: 'Cancelar',
        reset: 'Redefinir para Padrões',
      },
    },

    about: {
      title: 'Sobre o Fockey',
      subtitle: 'Experiência minimalista e sem distrações no YouTube',
      version: 'Versão',

      whatIs: {
        title: 'O que é Fockey?',
        description:
          'Fockey é uma extensão do Chrome focada em produtividade, projetada para transformar sites complexos e barulhentos em experiências minimalistas orientadas por intenção. A extensão permite que você remova distrações cognitivas e interaja com o conteúdo apenas quando escolher explicitamente.',
      },

      philosophy: {
        title: 'Filosofia Central',
        quote: 'Minimalista por padrão. Todo o resto é opcional.',
        description:
          'Fockey impõe uma experiência padrão limpa e sem distrações, preservando o controle total do usuário através de configurações configuráveis.',
      },
    },
  },

  toasts: {
    settingsSaved: 'Configurações salvas com sucesso',
    settingsReset: 'Todas as configurações foram redefinidas para os padrões',
    settingsExported:
      'Configurações exportadas (YouTube, canais bloqueados, agendamentos, config do Bloqueio Rápido, tema)',
    settingsImported:
      'Configurações importadas (YouTube, canais bloqueados, agendamentos, config do Bloqueio Rápido, tema)',

    channelBlocked: '{{name}} foi bloqueado',
    channelUnblocked: '{{name}} foi desbloqueado',

    lockModeActivated: 'Configurações bloqueadas por {{duration}}',
    lockExtended: 'Bloqueio estendido por {{duration}}',

    quickBlockStarted: 'Sessão de foco iniciada por {{duration}}',
    quickBlockStartedIndefinite: 'Sessão de foco iniciada sem limite de tempo',
    quickBlockStopped: 'A sessão de foco foi parada',
    sessionExtended: 'Adicionado {{duration}} à sua sessão de foco',

    scheduleCreated: 'Seu agendamento foi criado com sucesso',
    scheduleUpdated: 'Seu agendamento foi atualizado com sucesso',
    scheduleDeleted: 'O agendamento foi excluído com sucesso',
    scheduleEnabled: 'O agendamento está ativo agora',
    scheduleDisabled: 'O agendamento foi desativado',

    invalidDuration: 'Duração Inválida',
    invalidDurationMessage: 'Digite um tempo válido maior que 0',
    invalidFile: 'Arquivo JSON inválido. Verifique o formato do arquivo',
    selectValidFile: 'Selecione um arquivo JSON válido',

    scheduleLocked: 'Não é possível modificar agendamentos enquanto o Modo de Bloqueio está ativo',
    scheduleDeleteLocked:
      'Não é possível excluir agendamentos enquanto o Modo de Bloqueio está ativo',
    settingsLocked: 'Não é possível parar o Bloqueio Rápido enquanto o Modo de Bloqueio está ativo',

    noItemsConfigured:
      'Adicione pelo menos um domínio, palavra-chave de URL ou palavra-chave de conteúdo',
    cannotRemoveActive: 'Os itens não podem ser removidos enquanto o Bloqueio Rápido está ativo',
    alreadyExists: 'Esta palavra-chave já está na lista',
    invalidInput: 'Digite uma palavra-chave de URL',
    cannotExtend: 'Esta sessão não tem limite de tempo',

    failedToLoadSettings: 'Falha ao carregar configurações. Atualize a página.',
    failedToResetSettings: 'Falha ao redefinir configurações. Tente novamente.',
    failedToBlockChannel: 'Falha ao bloquear canal. Tente novamente.',
    failedToUnblockChannel: 'Falha ao desbloquear canal. Tente novamente.',
    failedToExportSettings: 'Falha ao exportar configurações. Tente novamente.',
    failedToImportSettings: 'Falha ao importar configurações. Verifique o formato do arquivo.',
    failedToReadFile: 'Falha ao ler arquivo. Tente novamente.',
    failedToLoadSchedules: 'Falha ao carregar agendamentos',

    activationFailed: 'Falha na Ativação',
    extensionFailed: 'Falha na Extensão',
  },

  errors: {
    generic: 'Ocorreu um erro. Tente novamente.',
    loadSettings: 'Falha ao carregar configurações',
    saveSettings: 'Falha ao salvar configurações',
    networkError: 'Erro de rede. Verifique sua conexão.',
  },
} as const;
