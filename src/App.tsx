import { type ChangeEvent, useRef } from 'react';
import { AppTopbar } from './components/AppTopbar';
import { BoardHeader } from './components/BoardHeader';
import { BoardTable } from './components/BoardTable';
import { parseBoardRows } from './lib/boardStorage';
import { useBoardCards } from './hooks/useBoardCards';
import { useBoardDnd } from './hooks/useBoardDnd';
import { useBoardWorkspace } from './hooks/useBoardWorkspace';
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

function App() {
  const {
    workspace,
    activeProject,
    rows,
    updateActiveProject,
    selectProject,
    createNewProject,
    createNewVersion,
    updateActiveProjectField,
  } = useBoardWorkspace();
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
  } = useBoardCards({ updateActiveProject });
  const {
    dragOverTarget,
    clearDragState,
    handleCardDragStart,
    handleCardDragEnd,
    handleCellDragOver,
    handleCellDrop,
    handleCellDragLeave,
  } = useBoardDnd({ updateActiveProject });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectProject = (event: ChangeEvent<HTMLSelectElement>) => {
    selectProject(event);
    clearCardUiState();
    clearDragState();
  };

  const handleCreateProject = () => {
    createNewProject();
    clearCardUiState();
    clearDragState();
  };

  const handleCreateProjectVersion = () => {
    createNewVersion();
    clearCardUiState();
    clearDragState();
  };

  const handleUpdateActiveProjectField = (
    field: 'name' | 'focalProblem' | 'author',
    value: string,
  ) => {
    updateActiveProjectField(field, value);
  };

  const handleExportBoard = () => {
    if (!activeProject) {
      return;
    }

    const payload = {
      app: 'quadro-de-avaliacao',
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      projectId: activeProject.id,
      projectName: activeProject.name,
      focalProblem: activeProject.focalProblem,
      author: activeProject.author,
      projectVersion: activeProject.version,
      rows: activeProject.rows,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = createExportFileName(activeProject);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImportBoard = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as unknown;

      const importedProjectPayload = getImportedProjectPayload(parsed);
      const candidateRows = importedProjectPayload?.rows ?? parsed;

      const normalizedRows = parseBoardRows(candidateRows);
      if (!normalizedRows) {
        window.alert(
          'Arquivo inválido. Selecione um JSON exportado do quadro.',
        );
        return;
      }

      updateActiveProject((currentProject) => ({
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
      window.alert(
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
        onExportBoard={handleExportBoard}
        onResetBoard={handleResetBoard}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onCreateProjectVersion={handleCreateProjectVersion}
        onUpdateProjectField={handleUpdateActiveProjectField}
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
          getColumnCardCount={getColumnCardCount}
          hasMeaningfulContent={hasMeaningfulContent}
          onCellDragOver={handleCellDragOver}
          onCellDrop={handleCellDrop}
          onCellDragLeave={handleCellDragLeave}
          onCardDragStart={handleCardDragStart}
          onCardDragEnd={handleCardDragEnd}
          onCardValueChange={handleEditingCardValueChange}
          onSaveEditedCard={handleSaveEditedCard}
          onCancelEditingCard={() => setEditingCard(null)}
          onChangeCardColor={handleChangeCardColor}
          onStartEditingCard={handleStartEditingCard}
          onDeleteCard={handleDeleteCard}
          onComposerValueChange={handleComposerValueChange}
          onSaveCard={handleSaveCard}
          onCancelComposer={() => setComposer(null)}
          onOpenComposer={handleOpenComposer}
        />

        <footer className='app-footer'>
          <small className='text-body-secondary'>
            Quadro digital • MVP Kanban para análise colaborativa
          </small>
        </footer>
      </main>
    </div>
  );
}

export default App;
