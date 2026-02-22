import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppTopbar } from './components/AppTopbar';
import { AppDialogModal } from './components/AppDialogModal';
import { BoardHeader } from './components/BoardHeader';
import { BoardTable } from './components/BoardTable';
import { useAppDialog } from './hooks/useAppDialog';
import { parseBoardRows } from './lib/boardStorage';
import { useBoardCards } from './hooks/useBoardCards';
import { useBoardDnd } from './hooks/useBoardDnd';
import {
  useBoardWorkspace,
  type UpdateActiveProject,
} from './hooks/useBoardWorkspace';
import {
  type ColumnId,
  type EvaluationProject,
  type PostItColor,
} from './types/board';

const COLUMN_ORDER: ColumnId[] = ['stakeholders', 'issues', 'ideas'];

const COLUMN_LABELS: Record<ColumnId, string> = {
  stakeholders: 'Partes Interessadas',
  issues: 'Questões / Problemas',
  ideas: 'Ideias / Soluções',
};

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
  rows?: unknown;
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
  const isTimeTravelingRef = useRef(false);

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
  } = useBoardCards({ updateActiveProject: updateActiveProjectWithHistory });
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
  }, [activeProject?.id]);

  const isProjectDraftDirty =
    projectDraft.name !== activeProjectMetadata.name ||
    projectDraft.focalProblem !== activeProjectMetadata.focalProblem ||
    projectDraft.author !== activeProjectMetadata.author;

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
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      projectId: exportProject.id,
      projectName: exportProject.name,
      focalProblem: exportProject.focalProblem,
      author: exportProject.author,
      projectVersion: exportProject.version,
      rows: exportProject.rows,
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

      const normalizedRows = parseBoardRows(candidateRows);
      if (!normalizedRows) {
        await showInfoDialog(
          'Importação inválida',
          'Arquivo inválido. Selecione um JSON exportado do quadro.',
        );
        return;
      }

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
          rows: normalizedRows,
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
        rows: normalizedRows,
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

  const getColumnCardCount = (columnId: ColumnId): number =>
    rows.reduce((total, row) => total + row[columnId].length, 0);

  const totalCards = COLUMN_ORDER.reduce(
    (total, columnId) => total + getColumnCardCount(columnId),
    0,
  );

  const activeLayers = rows.filter(
    (row) => row.stakeholders.length + row.issues.length + row.ideas.length > 0,
  ).length;

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

  return (
    <div className='app-shell'>
      <AppTopbar lastUpdated={lastUpdated} />
      <BoardHeader
        totalCards={totalCards}
        activeLayers={activeLayers}
        stakeholdersCount={getColumnCardCount('stakeholders')}
        workspace={workspace}
        activeProject={activeProject}
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

      <main className='container-fluid board-layout py-4 py-md-5'>
        <BoardTable
          rows={rows}
          columnOrder={COLUMN_ORDER}
          columnLabels={COLUMN_LABELS}
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
        />

        <footer className='app-footer'>
          <div className='app-footer-meta'>
            <span className='app-footer-kicker'>Quadro digital</span>
            <strong className='app-footer-title'>
              {activeProject?.name ?? 'Projeto sem nome'}
            </strong>
          </div>
          <small className='app-footer-note text-body-secondary'>
            Quadro MVP para análise colaborativa • v
            {activeProject?.version ?? 1}
          </small>
        </footer>
      </main>

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
