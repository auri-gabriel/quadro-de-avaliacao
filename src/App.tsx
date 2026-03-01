import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppTopbar } from './components/AppTopbar';
import { AppFooter } from './components/AppFooter';
import { AppDialogModal } from './components/AppDialogModal';
import { BoardHeader } from './components/BoardHeader';
import { BoardTable } from './components/BoardTable';
import { useAppDialog } from './hooks/useAppDialog';
import {
  applyCardOrder,
  buildCardOrder,
  createCustomTemplate,
  createInitialBoard,
  getBuiltInTemplates,
  parseBoardRows,
} from './lib/boardStorage';
import { useBoardCards } from './hooks/useBoardCards';
import { useBoardDnd } from './hooks/useBoardDnd';
import {
  useBoardWorkspace,
  type UpdateActiveProject,
} from './hooks/useBoardWorkspace';
import {
  CLASSIC_BOARD_TEMPLATE,
  type BoardTemplate,
  type ColumnId,
  type EvaluationProject,
  type PostItColor,
} from './types/board';

const BUILTIN_TEMPLATES: BoardTemplate[] = getBuiltInTemplates();
const CUSTOM_TEMPLATE_SELECTOR_ID = 'custom';

const POST_IT_PALETTE: Array<{ id: PostItColor; label: string }> = [
  { id: 'yellow', label: 'Amarelo' },
  { id: 'pink', label: 'Rosa' },
  { id: 'blue', label: 'Azul' },
  { id: 'green', label: 'Verde' },
  { id: 'orange', label: 'Laranja' },
  { id: 'purple', label: 'Roxo' },
];

interface ImportedProjectPayload {
  projectName?: unknown;
  focalProblem?: unknown;
  author?: unknown;
  projectVersion?: unknown;
  templateId?: unknown;
  template?: unknown;
  rows?: unknown;
  cardOrder?: unknown;
}

interface ProjectMetadataDraft {
  name: string;
  focalProblem: string;
  author: string;
}

function createExportFileName(project: EvaluationProject): string {
  const projectSlug = project.name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  const formattedDate = new Date().toISOString().slice(0, 10);
  const paddedVersion = String(project.version).padStart(3, '0');

  return `quadro-avaliacao-${projectSlug || 'projeto'}-v${paddedVersion}-${formattedDate}.json`;
}

function getImportedProjectPayload(
  parsed: unknown,
): ImportedProjectPayload | null {
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  if (!('rows' in candidate)) {
    return null;
  }

  return candidate as ImportedProjectPayload;
}

function cloneProjectSnapshot(project: EvaluationProject): EvaluationProject {
  if (typeof structuredClone === 'function') {
    return structuredClone(project);
  }

  return JSON.parse(JSON.stringify(project)) as EvaluationProject;
}

function getBuiltInTemplateById(templateId: string): BoardTemplate | undefined {
  return BUILTIN_TEMPLATES.find((template) => template.id === templateId);
}

function isBuiltInTemplateId(templateId: string): boolean {
  return Boolean(getBuiltInTemplateById(templateId));
}

function countProjectCards(project?: EvaluationProject): number {
  if (!project) {
    return 0;
  }

  return project.rows.reduce(
    (total, row) =>
      total +
      Object.values(row.cards).reduce(
        (columnTotal, cards) => columnTotal + cards.length,
        0,
      ),
    0,
  );
}

function toEditableCustomTemplate(
  currentTemplate: BoardTemplate,
  nextColumnLabels: string[],
  nextLayerDefinitions: Array<{ label: string; description: string }>,
): BoardTemplate | null {
  return createCustomTemplate({
    name: currentTemplate.name || 'Modelo personalizado',
    columns: nextColumnLabels,
    layers: nextLayerDefinitions,
  });
}

function App() {
  const {
    workspace,
    activeProject,
    rows,
    updateActiveProject,
    selectProject,
    createNewProject,
    createNewVersion,
    deleteActiveProject,
    importProjectAsNew,
  } = useBoardWorkspace();
  const [undoStack, setUndoStack] = useState<EvaluationProject[]>([]);
  const [redoStack, setRedoStack] = useState<EvaluationProject[]>([]);
  const [isStructureEditMode, setStructureEditMode] = useState(false);
  const [showBackToTopButton, setShowBackToTopButton] = useState(false);
  const isTimeTravelingRef = useRef(false);
  const activeTemplate = activeProject?.template ?? CLASSIC_BOARD_TEMPLATE;

  const updateActiveProjectWithHistory: UpdateActiveProject = useCallback(
    (updater) => {
      updateActiveProject((currentProject) => {
        const nextProject = updater(currentProject);

        if (!isTimeTravelingRef.current) {
          setUndoStack((currentUndoStack) => [
            ...currentUndoStack,
            cloneProjectSnapshot(currentProject),
          ]);
          setRedoStack([]);
        }

        return nextProject;
      });
    },
    [updateActiveProject],
  );
  const {
    composer,
    editingCard,
    setComposer,
    setEditingCard,
    clearCardUiState,
    handleOpenComposer,
    handleSaveCard,
    handleDeleteCard,
    handleStartEditingCard,
    handleSaveEditedCard,
    handleChangeCardColor,
    handleResetBoard,
    hasMeaningfulContent,
  } = useBoardCards({
    updateActiveProject: updateActiveProjectWithHistory,
    activeTemplate,
  });
  const {
    dragOverTarget,
    dropIndicatorTarget,
    clearDragState,
    handleCardDragStart,
    handleCardDragEnd,
    handleCardDragOver,
    handleCardDrop,
    handleCardDragLeave,
    handleCellDragOver,
    handleCellDrop,
    handleCellDragLeave,
  } = useBoardDnd({ updateActiveProject: updateActiveProjectWithHistory });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { modalState, openDialog, closeDialog, showInfoDialog } =
    useAppDialog();

  const activeProjectMetadata = useMemo<ProjectMetadataDraft>(
    () => ({
      name: activeProject?.name ?? '',
      focalProblem: activeProject?.focalProblem ?? '',
      author: activeProject?.author ?? '',
    }),
    [activeProject?.author, activeProject?.focalProblem, activeProject?.name],
  );

  const [projectDraft, setProjectDraft] = useState<ProjectMetadataDraft>(
    activeProjectMetadata,
  );

  useEffect(() => {
    setProjectDraft(activeProjectMetadata);
  }, [activeProjectMetadata]);

  useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
    setStructureEditMode(false);
  }, [activeProject?.id]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTopButton(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isProjectDraftDirty =
    projectDraft.name !== activeProjectMetadata.name ||
    projectDraft.focalProblem !== activeProjectMetadata.focalProblem ||
    projectDraft.author !== activeProjectMetadata.author;
  const activeProjectCardCount = countProjectCards(activeProject);
  const canChangeTemplate = activeProjectCardCount === 0;

  useEffect(() => {
    if (!canChangeTemplate && isStructureEditMode) {
      setStructureEditMode(false);
    }
  }, [canChangeTemplate, isStructureEditMode]);

  const saveProjectDraft = () => {
    if (!activeProject) {
      return;
    }

    updateActiveProjectWithHistory((currentProject) => ({
      ...currentProject,
      name: projectDraft.name,
      focalProblem: projectDraft.focalProblem,
      author: projectDraft.author,
    }));
  };

  const cancelProjectDraft = () => {
    setProjectDraft(activeProjectMetadata);
  };

  const resolveProjectDraftBeforeContinue = async (): Promise<
    'clean' | 'saved' | 'discarded' | 'cancel'
  > => {
    if (!isProjectDraftDirty) {
      return 'clean';
    }

    const choice = await openDialog(
      'Alterações não salvas',
      'Você alterou os dados do projeto. Deseja salvar antes de continuar?',
      [
        {
          value: 'save',
          label: 'Salvar e continuar',
          buttonClassName: 'btn-primary',
        },
        {
          value: 'discard',
          label: 'Descartar alterações',
          buttonClassName: 'btn-outline-secondary',
        },
        {
          value: 'cancel',
          label: 'Cancelar',
          buttonClassName: 'btn-outline-secondary',
        },
      ],
    );

    if (choice === 'save') {
      saveProjectDraft();
      return 'saved';
    }

    if (choice === 'discard') {
      cancelProjectDraft();
      return 'discarded';
    }

    return 'cancel';
  };

  const handleSelectProject = async (projectId: string) => {
    if (!activeProject || activeProject.id === projectId) {
      return;
    }

    const resolution = await resolveProjectDraftBeforeContinue();
    if (resolution === 'cancel') {
      return;
    }

    selectProject(projectId);
    clearCardUiState();
    clearDragState();
  };

  const handleCreateProject = async () => {
    const resolution = await resolveProjectDraftBeforeContinue();
    if (resolution === 'cancel') {
      return;
    }

    createNewProject();
    clearCardUiState();
    clearDragState();
  };

  const handleCreateProjectVersion = async () => {
    const resolution = await resolveProjectDraftBeforeContinue();
    if (resolution === 'cancel') {
      return;
    }

    createNewVersion();
    clearCardUiState();
    clearDragState();
  };

  const handleChangeTemplate = async (templateId: string) => {
    if (!activeProject) {
      return;
    }

    if (!canChangeTemplate) {
      await showInfoDialog(
        'Troca de modelo bloqueada',
        'Remova os cartões do projeto para poder trocar o modelo do quadro.',
      );
      return;
    }

    if (templateId === CUSTOM_TEMPLATE_SELECTOR_ID) {
      const customTemplate = toEditableCustomTemplate(
        activeTemplate,
        activeTemplate.columns.map((column) => column.label),
        activeTemplate.layers.map((layer) => ({
          label: layer.label,
          description: layer.description,
        })),
      );

      if (!customTemplate) {
        return;
      }

      updateActiveProjectWithHistory((currentProject) => ({
        ...currentProject,
        templateId: customTemplate.id,
        template: customTemplate,
        rows: createInitialBoard(customTemplate),
      }));
      clearCardUiState();
      clearDragState();
      return;
    }

    const nextTemplate = getBuiltInTemplateById(templateId);
    if (!nextTemplate || nextTemplate.id === activeTemplate.id) {
      return;
    }

    updateActiveProjectWithHistory((currentProject) => ({
      ...currentProject,
      templateId: nextTemplate.id,
      template: nextTemplate,
      rows: createInitialBoard(nextTemplate),
    }));
    clearCardUiState();
    clearDragState();
  };

  const applyTemplateStructureChange = async (
    nextColumnLabels: string[],
    nextLayerDefinitions: Array<{ label: string; description: string }>,
  ) => {
    if (!activeProject) {
      return;
    }

    if (!canChangeTemplate) {
      await showInfoDialog(
        'Edição de estrutura bloqueada',
        'Remova os cartões do projeto para editar colunas e camadas.',
      );
      return;
    }

    const customTemplate = toEditableCustomTemplate(
      activeTemplate,
      nextColumnLabels,
      nextLayerDefinitions,
    );

    if (!customTemplate) {
      await showInfoDialog(
        'Estrutura inválida',
        'Mantenha ao menos uma coluna e uma camada com nome válido.',
      );
      return;
    }

    updateActiveProjectWithHistory((currentProject) => ({
      ...currentProject,
      templateId: customTemplate.id,
      template: customTemplate,
      rows: createInitialBoard(customTemplate),
    }));
    clearCardUiState();
    clearDragState();
  };

  const handleRenameColumn = (columnId: ColumnId, label: string) => {
    const nextLabel = label.trim();
    if (!nextLabel) {
      return;
    }

    const nextColumnLabels = activeTemplate.columns.map((column) =>
      column.id === columnId ? nextLabel : column.label,
    );
    const nextLayerDefinitions = activeTemplate.layers.map((layer) => ({
      label: layer.label,
      description: layer.description,
    }));
    void applyTemplateStructureChange(nextColumnLabels, nextLayerDefinitions);
  };

  const handleRenameLayer = (
    rowIndex: number,
    field: 'title' | 'description',
    value: string,
  ) => {
    const nextValue = value.trim();
    if (rowIndex < 0 || rowIndex >= activeTemplate.layers.length) {
      return;
    }

    if (field === 'title' && !nextValue) {
      return;
    }

    const nextColumnLabels = activeTemplate.columns.map(
      (column) => column.label,
    );
    const nextLayerDefinitions = activeTemplate.layers.map((layer, index) =>
      index === rowIndex
        ? {
            label: field === 'title' ? nextValue : layer.label,
            description:
              field === 'description' ? nextValue : layer.description,
          }
        : {
            label: layer.label,
            description: layer.description,
          },
    );
    void applyTemplateStructureChange(nextColumnLabels, nextLayerDefinitions);
  };

  const handleAddColumn = () => {
    const nextColumnLabels = [
      ...activeTemplate.columns.map((column) => column.label),
      `Nova coluna ${activeTemplate.columns.length + 1}`,
    ];
    const nextLayerDefinitions = activeTemplate.layers.map((layer) => ({
      label: layer.label,
      description: layer.description,
    }));
    void applyTemplateStructureChange(nextColumnLabels, nextLayerDefinitions);
  };

  const handleRemoveColumn = (columnId: ColumnId) => {
    const nextColumnLabels = activeTemplate.columns
      .filter((column) => column.id !== columnId)
      .map((column) => column.label);

    const nextLayerDefinitions = activeTemplate.layers.map((layer) => ({
      label: layer.label,
      description: layer.description,
    }));
    void applyTemplateStructureChange(nextColumnLabels, nextLayerDefinitions);
  };

  const handleAddLayer = () => {
    const nextColumnLabels = activeTemplate.columns.map(
      (column) => column.label,
    );
    const nextLayerDefinitions = [
      ...activeTemplate.layers.map((layer) => ({
        label: layer.label,
        description: layer.description,
      })),
      {
        label: `Nova camada ${activeTemplate.layers.length + 1}`,
        description: 'Descreva esta camada.',
      },
    ];
    void applyTemplateStructureChange(nextColumnLabels, nextLayerDefinitions);
  };

  const handleRemoveLayer = (rowIndex: number) => {
    const nextColumnLabels = activeTemplate.columns.map(
      (column) => column.label,
    );
    const nextLayerDefinitions = activeTemplate.layers
      .filter((_, index) => index !== rowIndex)
      .map((layer) => ({
        label: layer.label,
        description: layer.description,
      }));
    void applyTemplateStructureChange(nextColumnLabels, nextLayerDefinitions);
  };

  const handleToggleStructureEditMode = async () => {
    if (isStructureEditMode) {
      setStructureEditMode(false);
      return;
    }

    if (!canChangeTemplate) {
      await showInfoDialog(
        'Edição de estrutura bloqueada',
        'Remova os cartões do projeto para editar colunas e camadas.',
      );
      return;
    }

    setStructureEditMode(true);
  };

  const handleRequestDeleteProject = async () => {
    if (!activeProject) {
      return;
    }

    const resolution = await resolveProjectDraftBeforeContinue();
    if (resolution === 'cancel') {
      return;
    }

    if (workspace.projects.length <= 1) {
      await showInfoDialog(
        'Operação indisponível',
        'É necessário manter ao menos um projeto no workspace.',
      );
      return;
    }

    const deleteChoice = await openDialog(
      'Excluir projeto',
      `Tem certeza que deseja excluir o projeto "${activeProject.name}"? Esta ação não pode ser desfeita.`,
      [
        {
          value: 'confirm',
          label: 'Excluir',
          buttonClassName: 'btn-danger',
        },
        {
          value: 'cancel',
          label: 'Cancelar',
          buttonClassName: 'btn-outline-secondary',
        },
      ],
    );

    if (deleteChoice !== 'confirm') {
      return;
    }

    deleteActiveProject();
    clearCardUiState();
    clearDragState();
  };

  const handleRequestResetBoard = async () => {
    const resetChoice = await openDialog(
      'Limpar quadro',
      'Tem certeza que deseja limpar todo o quadro do projeto atual?',
      [
        {
          value: 'confirm',
          label: 'Limpar',
          buttonClassName: 'btn-danger',
        },
        {
          value: 'cancel',
          label: 'Cancelar',
          buttonClassName: 'btn-outline-secondary',
        },
      ],
    );

    if (resetChoice !== 'confirm') {
      return;
    }

    handleResetBoard();
    clearDragState();
  };

  const handleRequestDeleteCard = async (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
  ) => {
    const deleteChoice = await openDialog(
      'Excluir cartão',
      'Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.',
      [
        {
          value: 'confirm',
          label: 'Excluir',
          buttonClassName: 'btn-danger',
        },
        {
          value: 'cancel',
          label: 'Cancelar',
          buttonClassName: 'btn-outline-secondary',
        },
      ],
    );

    if (deleteChoice !== 'confirm') {
      return;
    }

    handleDeleteCard(rowIndex, columnId, cardId);
  };

  const handleExportBoard = async () => {
    if (!activeProject) {
      return;
    }

    const resolution = await resolveProjectDraftBeforeContinue();
    if (resolution === 'cancel') {
      return;
    }

    const exportProject =
      resolution === 'saved'
        ? {
            ...activeProject,
            name: projectDraft.name,
            focalProblem: projectDraft.focalProblem,
            author: projectDraft.author,
          }
        : activeProject;

    const payload = {
      app: 'quadro-de-avaliacao',
      schemaVersion: 4,
      exportedAt: new Date().toISOString(),
      projectId: exportProject.id,
      projectName: exportProject.name,
      focalProblem: exportProject.focalProblem,
      author: exportProject.author,
      projectVersion: exportProject.version,
      templateId: exportProject.templateId,
      template: exportProject.template,
      rows: exportProject.rows,
      cardOrder: buildCardOrder(exportProject.rows),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = createExportFileName(exportProject);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleUndo = () => {
    if (!activeProject || undoStack.length === 0) {
      return;
    }

    const previousSnapshot = undoStack[undoStack.length - 1];
    if (!previousSnapshot) {
      return;
    }

    setUndoStack((currentUndoStack) => currentUndoStack.slice(0, -1));
    setRedoStack((currentRedoStack) => [
      ...currentRedoStack,
      cloneProjectSnapshot(activeProject),
    ]);

    isTimeTravelingRef.current = true;
    updateActiveProject(() => cloneProjectSnapshot(previousSnapshot));
    isTimeTravelingRef.current = false;

    clearCardUiState();
    clearDragState();
  };

  const handleRedo = () => {
    if (!activeProject || redoStack.length === 0) {
      return;
    }

    const nextSnapshot = redoStack[redoStack.length - 1];
    if (!nextSnapshot) {
      return;
    }

    setRedoStack((currentRedoStack) => currentRedoStack.slice(0, -1));
    setUndoStack((currentUndoStack) => [
      ...currentUndoStack,
      cloneProjectSnapshot(activeProject),
    ]);

    isTimeTravelingRef.current = true;
    updateActiveProject(() => cloneProjectSnapshot(nextSnapshot));
    isTimeTravelingRef.current = false;

    clearCardUiState();
    clearDragState();
  };

  const handleImportBoard = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const resolution = await resolveProjectDraftBeforeContinue();
      if (resolution === 'cancel') {
        return;
      }

      const content = await file.text();
      const parsed = JSON.parse(content) as unknown;

      const importedProjectPayload = getImportedProjectPayload(parsed);
      const candidateRows = importedProjectPayload?.rows ?? parsed;

      let importedTemplate = CLASSIC_BOARD_TEMPLATE;

      if (typeof importedProjectPayload?.templateId === 'string') {
        importedTemplate =
          getBuiltInTemplateById(importedProjectPayload.templateId) ??
          importedTemplate;
      }

      if (
        importedProjectPayload?.template &&
        typeof importedProjectPayload.template === 'object'
      ) {
        const templateCandidate = importedProjectPayload.template as Record<
          string,
          unknown
        >;

        const candidateColumns = Array.isArray(templateCandidate.columns)
          ? templateCandidate.columns
              .map((column) => {
                if (!column || typeof column !== 'object') {
                  return null;
                }

                const columnCandidate = column as Record<string, unknown>;
                return typeof columnCandidate.label === 'string'
                  ? columnCandidate.label
                  : null;
              })
              .filter((label): label is string => Boolean(label))
          : [];

        const candidateLayers = Array.isArray(templateCandidate.layers)
          ? templateCandidate.layers
              .map((layer) => {
                if (!layer || typeof layer !== 'object') {
                  return null;
                }

                const layerCandidate = layer as Record<string, unknown>;
                return typeof layerCandidate.label === 'string'
                  ? layerCandidate.label
                  : null;
              })
              .filter((label): label is string => Boolean(label))
          : [];

        const maybeCustomTemplate = createCustomTemplate({
          name:
            typeof templateCandidate.name === 'string'
              ? templateCandidate.name
              : 'Modelo importado',
          columns: candidateColumns,
          layers: candidateLayers.map((label) => ({
            label,
            description: '',
          })),
        });

        if (maybeCustomTemplate) {
          importedTemplate = maybeCustomTemplate;
        }
      }

      const normalizedRows =
        parseBoardRows(candidateRows, importedTemplate) ??
        parseBoardRows(candidateRows, CLASSIC_BOARD_TEMPLATE);
      if (!normalizedRows) {
        await showInfoDialog(
          'Importação inválida',
          'Arquivo inválido. Selecione um JSON exportado do quadro.',
        );
        return;
      }

      const rowsWithImportedOrder = applyCardOrder(
        normalizedRows,
        importedProjectPayload?.cardOrder,
      );

      const importChoice = await openDialog(
        'Importar arquivo',
        'Deseja importar como novo projeto ou sobrescrever o projeto atual?',
        [
          {
            value: 'new-project',
            label: 'Novo projeto',
            buttonClassName: 'btn-primary',
          },
          {
            value: 'overwrite',
            label: 'Sobrescrever atual',
            buttonClassName: 'btn-outline-danger',
          },
          {
            value: 'cancel',
            label: 'Cancelar',
            buttonClassName: 'btn-outline-secondary',
          },
        ],
      );

      if (importChoice === 'cancel') {
        return;
      }

      if (importChoice === 'new-project') {
        importProjectAsNew({
          name:
            typeof importedProjectPayload?.projectName === 'string'
              ? importedProjectPayload.projectName
              : undefined,
          focalProblem:
            typeof importedProjectPayload?.focalProblem === 'string'
              ? importedProjectPayload.focalProblem
              : '',
          author:
            typeof importedProjectPayload?.author === 'string'
              ? importedProjectPayload.author
              : '',
          version:
            typeof importedProjectPayload?.projectVersion === 'number'
              ? importedProjectPayload.projectVersion
              : 1,
          template: importedTemplate,
          rows: rowsWithImportedOrder,
        });
        clearCardUiState();
        clearDragState();
        return;
      }

      updateActiveProjectWithHistory((currentProject) => ({
        ...currentProject,
        name:
          typeof importedProjectPayload?.projectName === 'string'
            ? importedProjectPayload.projectName
            : currentProject.name,
        focalProblem:
          typeof importedProjectPayload?.focalProblem === 'string'
            ? importedProjectPayload.focalProblem
            : currentProject.focalProblem,
        author:
          typeof importedProjectPayload?.author === 'string'
            ? importedProjectPayload.author
            : currentProject.author,
        version:
          typeof importedProjectPayload?.projectVersion === 'number' &&
          importedProjectPayload.projectVersion > 0
            ? Math.floor(importedProjectPayload.projectVersion)
            : currentProject.version,
        templateId: importedTemplate.id,
        template: importedTemplate,
        rows: rowsWithImportedOrder,
      }));
      clearCardUiState();
      clearDragState();
    } catch {
      await showInfoDialog(
        'Falha ao abrir arquivo',
        'Não foi possível abrir este arquivo. Verifique o formato JSON.',
      );
    } finally {
      event.target.value = '';
    }
  };

  const columnOrder = activeTemplate.columns.map((column) => column.id);
  const columnLabels = activeTemplate.columns.reduce<Record<ColumnId, string>>(
    (accumulator, column) => {
      accumulator[column.id] = column.label;
      return accumulator;
    },
    {},
  );

  const getColumnCardCount = (columnId: ColumnId): number =>
    rows.reduce((total, row) => total + (row.cards[columnId]?.length ?? 0), 0);

  const totalCards = columnOrder.reduce(
    (total, columnId) => total + getColumnCardCount(columnId),
    0,
  );

  const activeLayers = rows.filter((row) =>
    Object.values(row.cards).some((cards) => cards.length > 0),
  ).length;

  const primaryColumn = activeTemplate.columns[0];

  const lastUpdated = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(activeProject ? new Date(activeProject.updatedAt) : new Date());

  const handleEditingCardValueChange = (nextValue: string) => {
    setEditingCard((currentEditingCard) =>
      currentEditingCard
        ? {
            ...currentEditingCard,
            value: nextValue,
          }
        : currentEditingCard,
    );
  };

  const handleComposerValueChange = (nextValue: string) => {
    setComposer((currentComposer) =>
      currentComposer
        ? {
            ...currentComposer,
            value: nextValue,
          }
        : currentComposer,
    );
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className='app-shell min-vh-100 d-flex flex-column'>
      <AppTopbar lastUpdated={lastUpdated} />
      <BoardHeader
        totalCards={totalCards}
        activeLayers={activeLayers}
        totalLayers={activeTemplate.layers.length}
        primaryColumnLabel={primaryColumn?.label ?? 'Primeira coluna'}
        primaryColumnCount={
          primaryColumn ? getColumnCardCount(primaryColumn.id) : 0
        }
        workspace={workspace}
        activeProject={activeProject}
        templateOptions={[
          ...BUILTIN_TEMPLATES.map((template) => ({
            id: template.id,
            name: template.name,
          })),
          { id: CUSTOM_TEMPLATE_SELECTOR_ID, name: 'Modelo personalizado' },
        ]}
        selectedTemplateId={
          isBuiltInTemplateId(activeTemplate.id)
            ? activeTemplate.id
            : CUSTOM_TEMPLATE_SELECTOR_ID
        }
        canChangeTemplate={canChangeTemplate}
        onChangeTemplate={(templateId) => {
          void handleChangeTemplate(templateId);
        }}
        fileInputRef={fileInputRef}
        onImportBoard={handleImportBoard}
        onOpenFilePicker={handleOpenFilePicker}
        onExportBoard={() => {
          void handleExportBoard();
        }}
        onResetBoard={() => {
          void handleRequestResetBoard();
        }}
        onSelectProject={(projectId) => {
          void handleSelectProject(projectId);
        }}
        onCreateProject={() => {
          void handleCreateProject();
        }}
        onCreateProjectVersion={() => {
          void handleCreateProjectVersion();
        }}
        onDeleteProject={() => {
          void handleRequestDeleteProject();
        }}
        canDeleteProject={workspace.projects.length > 1}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        projectDraft={projectDraft}
        isProjectDraftDirty={isProjectDraftDirty}
        onChangeProjectDraftField={(field, value) => {
          setProjectDraft((currentDraft) => ({
            ...currentDraft,
            [field]: value,
          }));
        }}
        onSaveProjectDraft={saveProjectDraft}
        onCancelProjectDraft={cancelProjectDraft}
      />

      <main className='container-fluid board-layout py-4 py-md-5 flex-grow-1'>
        <BoardTable
          rows={rows}
          columnOrder={columnOrder}
          columnLabels={columnLabels}
          canEnterStructureEditMode={canChangeTemplate}
          isStructureEditMode={isStructureEditMode}
          postItPalette={POST_IT_PALETTE}
          composer={composer}
          editingCard={editingCard}
          dragOverTarget={dragOverTarget}
          dropIndicatorTarget={dropIndicatorTarget}
          getColumnCardCount={getColumnCardCount}
          hasMeaningfulContent={hasMeaningfulContent}
          onCellDragOver={handleCellDragOver}
          onCellDrop={handleCellDrop}
          onCellDragLeave={handleCellDragLeave}
          onCardDragStart={handleCardDragStart}
          onCardDragEnd={handleCardDragEnd}
          onCardDragOver={handleCardDragOver}
          onCardDrop={handleCardDrop}
          onCardDragLeave={handleCardDragLeave}
          onCardValueChange={handleEditingCardValueChange}
          onSaveEditedCard={handleSaveEditedCard}
          onCancelEditingCard={() => setEditingCard(null)}
          onChangeCardColor={handleChangeCardColor}
          onStartEditingCard={handleStartEditingCard}
          onDeleteCard={(rowIndex, columnId, cardId) => {
            void handleRequestDeleteCard(rowIndex, columnId, cardId);
          }}
          onComposerValueChange={handleComposerValueChange}
          onSaveCard={handleSaveCard}
          onCancelComposer={() => setComposer(null)}
          onOpenComposer={handleOpenComposer}
          onRenameColumn={handleRenameColumn}
          onRenameLayer={handleRenameLayer}
          onAddColumn={handleAddColumn}
          onRemoveColumn={handleRemoveColumn}
          onAddLayer={handleAddLayer}
          onRemoveLayer={handleRemoveLayer}
          onToggleStructureEditMode={() => {
            void handleToggleStructureEditMode();
          }}
        />
      </main>

      <AppFooter />

      {showBackToTopButton ? (
        <button
          type='button'
          className='back-to-top-button btn btn-primary'
          onClick={handleBackToTop}
          aria-label='Voltar ao topo'
          title='Voltar ao topo'
        >
          <i className='bi bi-arrow-up' aria-hidden='true' />
        </button>
      ) : null}

      <AppDialogModal
        isOpen={Boolean(modalState)}
        title={modalState?.title ?? ''}
        message={modalState?.message ?? ''}
        options={modalState?.options ?? []}
        onSelect={closeDialog}
      />
    </div>
  );
}

export default App;
