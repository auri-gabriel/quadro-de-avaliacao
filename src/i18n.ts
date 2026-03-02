import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_STORAGE_KEY = 'app-language';

const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)?.trim();

void i18n.use(initReactI18next).init({
  lng: savedLanguage || 'pt-BR',
  fallbackLng: 'pt-BR',
  supportedLngs: ['pt-BR', 'en'],
  interpolation: {
    escapeValue: false,
  },
  resources: {
    'pt-BR': {
      translation: {
        app: {
          title: 'Quadro de Avaliação',
          backToTop: 'Voltar ao topo',
          customTemplate: 'Modelo personalizado',
          firstColumnFallback: 'Primeira coluna',
        },
        topbar: {
          brandTitle: 'Quadro de Avaliação desenvolvido pelo grupo TRAMAS',
          updatedAt: 'Atualizado em {{date}}',
          language: 'Idioma',
          portuguese: 'Português',
          english: 'English',
        },
        footer: {
          rights: '© {{year}} TRAMAS. Todos os direitos reservados.',
        },
        boardHeader: {
          overline: 'Painel colaborativo',
          subtitle:
            'Organize partes interessadas, problemas e soluções com cartões no estilo post-it.',
          activeProject: 'Projeto ativo',
          noProjectSelected: 'Sem projeto selecionado',
          version: 'Versão v{{version}}',
          authorUnknown: 'Autoria não informada',
          focalProblemPrefix: 'Problema focal: {{value}}',
          focalProblemHint:
            'Defina o problema focal para guiar a análise das camadas.',
          kpiCards: 'Cartões',
          kpiCardsHint: 'Itens registrados no quadro',
          kpiActiveLayers: 'Camadas ativas',
          kpiActiveLayersHint: 'Níveis com conteúdo preenchido',
          kpiBaseLayerHint: 'Registros na camada base',
          projectManagement: 'Gestão do projeto',
          openFile: 'Abrir arquivo',
          exportJson: 'Exportar JSON',
          project: 'Projeto',
          newProject: 'Novo projeto',
          newVersion: 'Nova versão',
          boardTemplate: 'Modelo do quadro',
          name: 'Nome',
          namePlaceholder: 'Nome do projeto',
          author: 'Autoria',
          authorPlaceholder: 'Nome do autor',
          focalProblem: 'Problema Focal',
          focalProblemPlaceholder: 'Descreva o problema focal',
          dirtyState: 'Existem alterações não salvas nos dados do projeto.',
          syncedState: 'Dados do projeto sincronizados.',
          undo: 'Desfazer',
          redo: 'Refazer',
          cancelChanges: 'Cancelar alterações',
          saveData: 'Salvar dados',
          destructiveActions: 'Ações destrutivas',
          clearBoard: 'Limpar quadro',
          deleteProject: 'Excluir projeto',
        },
        boardTable: {
          layers: 'Camadas',
          addLayer: 'Adicionar camada',
          addColumn: 'Adicionar coluna',
          columnName: 'Nome da coluna',
          removeColumn: 'Remover coluna',
          removeColumnNamed: 'Remover coluna {{name}}',
          layerTitle: 'Título da camada',
          removeLayer: 'Remover camada',
          removeLayerNamed: 'Remover camada {{name}}',
          layerDescription: 'Descrição da camada',
          cardsArea: 'Área de cartões: {{name}}',
          cardInCell: 'Cartão em {{name}}',
          editCard: 'Editar cartão',
          editCardPlaceholder: 'Edite o conteúdo do cartão',
          save: 'Salvar',
          cancel: 'Cancelar',
          edit: 'Editar',
          colorPalette: 'Selecionar cor do post-it',
          color: 'Cor {{name}}',
          removeCard: 'Remover cartão',
          emptyCell: 'Nenhum cartão nesta célula ainda.',
          newCardLabel: 'Novo cartão em {{column}} para {{layer}}',
          newCardPlaceholder: 'Descreva o cartão',
          add: 'Adicionar',
          addCard: 'Adicionar cartão',
          newCard: 'Novo cartão',
          addCardInCell: 'Adicionar cartão em {{column}} para {{layer}}',
          openCardHint: 'Dica: use Enter ou Espaço para abrir um novo cartão.',
          exitEditMode: 'Sair da edição',
          editStructure: 'Editar estrutura',
          structureEditHint:
            'Personalize colunas e camadas diretamente no cabeçalho da tabela.',
          fixedBoardHint:
            'Quadro fixo: selecione “Modelo personalizado” para editar a estrutura.',
          editableHint:
            'Use “Editar estrutura” para alterar títulos, descrições e colunas.',
          noCardsHint:
            'Para editar a estrutura, deixe este projeto sem cartões.',
          dragHint:
            'Dica: arraste e solte os cartões entre qualquer linha e coluna.',
          keyboardHint:
            'Atalho: com a célula em foco, pressione Enter ou Espaço para criar um cartão.',
        },
        colors: {
          yellow: 'Amarelo',
          pink: 'Rosa',
          blue: 'Azul',
          green: 'Verde',
          orange: 'Laranja',
          purple: 'Roxo',
        },
        templates: {
          'classic-3x3': {
            name: 'Quadro clássico (3x3)',
            columns: {
              stakeholders: 'Partes Interessadas',
              issues: 'Questões / Problemas',
              ideas: 'Ideias / Soluções',
            },
            layers: {
              informal: {
                label: 'Informal',
                description:
                  'Influencia ou sofre impacto, direta ou indiretamente, das demais camadas.',
              },
              formal: {
                label: 'Formal',
                description:
                  'Quem opera o sistema técnico, fornece ou necessita de informações.',
              },
              technical: {
                label: 'Técnico',
                description: 'Quem produz e/ou mantém o sistema técnico.',
              },
            },
          },
        },
      },
    },
    en: {
      translation: {
        app: {
          title: 'Evaluation Board',
          backToTop: 'Back to top',
          customTemplate: 'Custom template',
          firstColumnFallback: 'First column',
        },
        topbar: {
          brandTitle: 'Evaluation Board developed by TRAMAS group',
          updatedAt: 'Updated at {{date}}',
          language: 'Language',
          portuguese: 'Português',
          english: 'English',
        },
        footer: {
          rights: '© {{year}} TRAMAS. All rights reserved.',
        },
        boardHeader: {
          overline: 'Collaborative board',
          subtitle:
            'Organize stakeholders, problems, and solutions with post-it style cards.',
          activeProject: 'Active project',
          noProjectSelected: 'No project selected',
          version: 'Version v{{version}}',
          authorUnknown: 'Author not provided',
          focalProblemPrefix: 'Focal problem: {{value}}',
          focalProblemHint: 'Define the focal problem to guide layer analysis.',
          kpiCards: 'Cards',
          kpiCardsHint: 'Items registered on the board',
          kpiActiveLayers: 'Active layers',
          kpiActiveLayersHint: 'Levels with filled content',
          kpiBaseLayerHint: 'Records in the base layer',
          projectManagement: 'Project management',
          openFile: 'Open file',
          exportJson: 'Export JSON',
          project: 'Project',
          newProject: 'New project',
          newVersion: 'New version',
          boardTemplate: 'Board template',
          name: 'Name',
          namePlaceholder: 'Project name',
          author: 'Author',
          authorPlaceholder: 'Author name',
          focalProblem: 'Focal Problem',
          focalProblemPlaceholder: 'Describe the focal problem',
          dirtyState: 'There are unsaved changes in project data.',
          syncedState: 'Project data is synchronized.',
          undo: 'Undo',
          redo: 'Redo',
          cancelChanges: 'Cancel changes',
          saveData: 'Save data',
          destructiveActions: 'Destructive actions',
          clearBoard: 'Clear board',
          deleteProject: 'Delete project',
        },
        boardTable: {
          layers: 'Layers',
          addLayer: 'Add layer',
          addColumn: 'Add column',
          columnName: 'Column name',
          removeColumn: 'Remove column',
          removeColumnNamed: 'Remove column {{name}}',
          layerTitle: 'Layer title',
          removeLayer: 'Remove layer',
          removeLayerNamed: 'Remove layer {{name}}',
          layerDescription: 'Layer description',
          cardsArea: 'Cards area: {{name}}',
          cardInCell: 'Card in {{name}}',
          editCard: 'Edit card',
          editCardPlaceholder: 'Edit card content',
          save: 'Save',
          cancel: 'Cancel',
          edit: 'Edit',
          colorPalette: 'Select post-it color',
          color: 'Color {{name}}',
          removeCard: 'Remove card',
          emptyCell: 'No cards in this cell yet.',
          newCardLabel: 'New card in {{column}} for {{layer}}',
          newCardPlaceholder: 'Describe the card',
          add: 'Add',
          addCard: 'Add card',
          newCard: 'New card',
          addCardInCell: 'Add card in {{column}} for {{layer}}',
          openCardHint: 'Tip: use Enter or Space to open a new card.',
          exitEditMode: 'Exit editing',
          editStructure: 'Edit structure',
          structureEditHint:
            'Customize columns and layers directly in the table header.',
          fixedBoardHint:
            'Fixed board: select “Custom template” to edit the structure.',
          editableHint:
            'Use “Edit structure” to change titles, descriptions, and columns.',
          noCardsHint: 'To edit structure, leave this project without cards.',
          dragHint: 'Tip: drag and drop cards between any row and column.',
          keyboardHint:
            'Shortcut: with a focused cell, press Enter or Space to create a card.',
        },
        colors: {
          yellow: 'Yellow',
          pink: 'Pink',
          blue: 'Blue',
          green: 'Green',
          orange: 'Orange',
          purple: 'Purple',
        },
        templates: {
          'classic-3x3': {
            name: 'Classic board (3x3)',
            columns: {
              stakeholders: 'Stakeholders',
              issues: 'Issues / Problems',
              ideas: 'Ideas / Solutions',
            },
            layers: {
              informal: {
                label: 'Informal',
                description:
                  'Influences or is impacted, directly or indirectly, by other layers.',
              },
              formal: {
                label: 'Formal',
                description:
                  'Those who operate the technical system, provide, or need information.',
              },
              technical: {
                label: 'Technical',
                description:
                  'Those who produce and/or maintain the technical system.',
              },
            },
          },
        },
      },
    },
  },
});

export { LANGUAGE_STORAGE_KEY };
export default i18n;
