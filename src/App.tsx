import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RichTextCell } from './components/RichTextCell';
import {
  createInitialBoard,
  createProject,
  duplicateProjectVersion,
  loadWorkspace,
  parseBoardRows,
  saveWorkspace,
} from './lib/boardStorage';
import {
  DEFAULT_POST_IT_COLOR,
  type ColumnId,
  type EvaluationProject,
  type EvaluationWorkspace,
  type EvaluationRow,
  type PostItColor,
} from './types/board';

interface ComposerState {
  rowIndex: number;
  columnId: ColumnId;
  value: string;
}

interface DragCardPayload {
  cardId: string;
  fromRowIndex: number;
  fromColumnId: ColumnId;
}

interface EditingCardState {
  cardId: string;
  rowIndex: number;
  columnId: ColumnId;
  value: string;
}

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

function createCardId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hasMeaningfulContent(value: string): boolean {
  const plain = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return plain.length > 0;
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
  const [workspace, setWorkspace] = useState<EvaluationWorkspace>(() =>
    loadWorkspace(),
  );
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [editingCard, setEditingCard] = useState<EditingCardState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    rowIndex: number;
    columnId: ColumnId;
  } | null>(null);

  const activeProject = useMemo(() => {
    const byId = workspace.projects.find(
      (project) => project.id === workspace.activeProjectId,
    );

    return byId ?? workspace.projects[0];
  }, [workspace]);

  const rows = activeProject?.rows ?? createInitialBoard();

  const updateActiveProject = (
    updater: (currentProject: EvaluationProject) => EvaluationProject,
  ) => {
    setWorkspace((currentWorkspace) => {
      const activeProjectIndex = currentWorkspace.projects.findIndex(
        (project) => project.id === currentWorkspace.activeProjectId,
      );

      if (activeProjectIndex < 0) {
        return currentWorkspace;
      }

      const nextProjects = currentWorkspace.projects.map((project, index) => {
        if (index !== activeProjectIndex) {
          return project;
        }

        const nextProject = updater(project);
        return {
          ...nextProject,
          updatedAt: new Date().toISOString(),
        };
      });

      return {
        ...currentWorkspace,
        projects: nextProjects,
      };
    });
  };

  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  const handleOpenComposer = (rowIndex: number, columnId: ColumnId) => {
    setComposer({ rowIndex, columnId, value: '' });
  };

  const handleSaveCard = () => {
    if (!composer || !hasMeaningfulContent(composer.value)) {
      return;
    }

    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: currentProject.rows.map((row, index) =>
        index === composer.rowIndex
          ? {
              ...row,
              [composer.columnId]: [
                ...row[composer.columnId],
                {
                  id: createCardId(),
                  content: composer.value,
                  color: DEFAULT_POST_IT_COLOR,
                },
              ],
            }
          : row,
      ),
    }));

    setComposer(null);
  };

  const handleDeleteCard = (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
  ) => {
    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: currentProject.rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [columnId]: row[columnId].filter((card) => card.id !== cardId),
            }
          : row,
      ),
    }));
  };

  const handleStartEditingCard = (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
    value: string,
  ) => {
    setEditingCard({ rowIndex, columnId, cardId, value });
    setComposer(null);
  };

  const handleSaveEditedCard = () => {
    if (!editingCard || !hasMeaningfulContent(editingCard.value)) {
      return;
    }

    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: currentProject.rows.map((row, index) =>
        index === editingCard.rowIndex
          ? {
              ...row,
              [editingCard.columnId]: row[editingCard.columnId].map((card) =>
                card.id === editingCard.cardId
                  ? { ...card, content: editingCard.value }
                  : card,
              ),
            }
          : row,
      ),
    }));

    setEditingCard(null);
  };

  const handleCardDragStart = (
    event: DragEvent<HTMLElement>,
    fromRowIndex: number,
    fromColumnId: ColumnId,
    cardId: string,
  ) => {
    const payload: DragCardPayload = {
      cardId,
      fromRowIndex,
      fromColumnId,
    };

    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragEnd = () => {
    setDragOverTarget(null);
  };

  const handleCellDragOver = (
    event: DragEvent<HTMLDivElement>,
    rowIndex: number,
    columnId: ColumnId,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (
      !dragOverTarget ||
      dragOverTarget.rowIndex !== rowIndex ||
      dragOverTarget.columnId !== columnId
    ) {
      setDragOverTarget({ rowIndex, columnId });
    }
  };

  const moveCardToTarget = (
    currentRows: EvaluationRow[],
    payload: DragCardPayload,
    toRowIndex: number,
    toColumnId: ColumnId,
  ): EvaluationRow[] => {
    const sourceRow = currentRows[payload.fromRowIndex];
    if (!sourceRow) {
      return currentRows;
    }

    const cardToMove = sourceRow[payload.fromColumnId].find(
      (card) => card.id === payload.cardId,
    );
    if (!cardToMove) {
      return currentRows;
    }

    if (
      payload.fromRowIndex === toRowIndex &&
      payload.fromColumnId === toColumnId
    ) {
      return currentRows;
    }

    return currentRows.map((row, rowIndex) => {
      const nextRow = { ...row };

      if (rowIndex === payload.fromRowIndex) {
        nextRow[payload.fromColumnId] = row[payload.fromColumnId].filter(
          (card) => card.id !== payload.cardId,
        );
      }

      if (rowIndex === toRowIndex) {
        nextRow[toColumnId] = [...nextRow[toColumnId], cardToMove];
      }

      return nextRow;
    });
  };

  const handleCellDrop = (
    event: DragEvent<HTMLDivElement>,
    toRowIndex: number,
    toColumnId: ColumnId,
  ) => {
    event.preventDefault();

    try {
      const raw = event.dataTransfer.getData('application/json');
      if (!raw) {
        return;
      }

      const payload = JSON.parse(raw) as DragCardPayload;
      updateActiveProject((currentProject) => ({
        ...currentProject,
        rows: moveCardToTarget(
          currentProject.rows,
          payload,
          toRowIndex,
          toColumnId,
        ),
      }));
    } catch {
      // Ignore malformed drag payloads
    } finally {
      setDragOverTarget(null);
    }
  };

  const handleCellDragLeave = (
    event: DragEvent<HTMLDivElement>,
    rowIndex: number,
    columnId: ColumnId,
  ) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      if (
        dragOverTarget &&
        dragOverTarget.rowIndex === rowIndex &&
        dragOverTarget.columnId === columnId
      ) {
        setDragOverTarget(null);
      }
    }
  };

  const handleChangeCardColor = (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
    color: PostItColor,
  ) => {
    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: currentProject.rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [columnId]: row[columnId].map((card) =>
                card.id === cardId ? { ...card, color } : card,
              ),
            }
          : row,
      ),
    }));
  };

  const handleResetBoard = () => {
    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: createInitialBoard(),
    }));
    setComposer(null);
    setEditingCard(null);
  };

  const handleSelectProject = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextProjectId = event.target.value;
    if (!workspace.projects.some((project) => project.id === nextProjectId)) {
      return;
    }

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      activeProjectId: nextProjectId,
    }));
    setComposer(null);
    setEditingCard(null);
    setDragOverTarget(null);
  };

  const handleCreateProject = () => {
    const nextProjectNumber = workspace.projects.length + 1;
    const nextProject = createProject(`Projeto ${nextProjectNumber}`);

    setWorkspace((currentWorkspace) => ({
      activeProjectId: nextProject.id,
      projects: [...currentWorkspace.projects, nextProject],
    }));

    setComposer(null);
    setEditingCard(null);
    setDragOverTarget(null);
  };

  const handleCreateProjectVersion = () => {
    if (!activeProject) {
      return;
    }

    const versionedProject = duplicateProjectVersion(activeProject);
    setWorkspace((currentWorkspace) => ({
      activeProjectId: versionedProject.id,
      projects: [...currentWorkspace.projects, versionedProject],
    }));

    setComposer(null);
    setEditingCard(null);
    setDragOverTarget(null);
  };

  const handleUpdateActiveProjectField = (
    field: 'name' | 'focalProblem' | 'author',
    value: string,
  ) => {
    updateActiveProject((currentProject) => ({
      ...currentProject,
      [field]: value,
    }));
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
      setComposer(null);
      setEditingCard(null);
      setDragOverTarget(null);
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

  return (
    <div className='app-shell'>
      <header className='app-topbar'>
        <div className='container-fluid board-layout d-flex justify-content-between align-items-center py-2'>
          <div className='app-brand'>Quadro de Avaliação</div>
          <div className='app-topbar-meta'>Atualizado em {lastUpdated}</div>
        </div>
      </header>

      <section className='board-header'>
        <div className='container-fluid board-layout py-4 py-xl-5'>
          <div className='board-header-grid'>
            <div className='d-flex flex-column gap-3'>
              <div>
                <h1 className='mb-2 fw-semibold'>
                  Análise: Quadro de Avaliação
                </h1>
                <p className='board-subtitle mb-0'>
                  Organize stakeholders, problemas e soluções com cartões no
                  estilo post-it.
                </p>
              </div>

              <div className='board-kpis'>
                <article className='kpi-card'>
                  <span className='kpi-label'>Cartões</span>
                  <strong className='kpi-value'>{totalCards}</strong>
                </article>
                <article className='kpi-card'>
                  <span className='kpi-label'>Camadas ativas</span>
                  <strong className='kpi-value'>{activeLayers}/3</strong>
                </article>
                <article className='kpi-card'>
                  <span className='kpi-label'>Partes interessadas</span>
                  <strong className='kpi-value'>
                    {getColumnCardCount('stakeholders')}
                  </strong>
                </article>
              </div>
            </div>

            <div className='project-manager mt-0'>
              <div className='d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-2'>
                <h2 className='h6 mb-0 fw-semibold text-uppercase'>
                  Gestão do projeto
                </h2>

                <div className='board-file-actions'>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='.json,application/json'
                    className='d-none'
                    onChange={handleImportBoard}
                  />
                  <button
                    type='button'
                    className='btn btn-outline-secondary'
                    onClick={handleOpenFilePicker}
                  >
                    Abrir arquivo
                  </button>
                  <button
                    type='button'
                    className='btn btn-outline-secondary'
                    onClick={handleExportBoard}
                  >
                    Salvar arquivo
                  </button>
                  <button
                    type='button'
                    className='btn btn-outline-secondary'
                    onClick={handleResetBoard}
                  >
                    Limpar quadro
                  </button>
                </div>
              </div>

              <div className='project-manager-row mt-2'>
                <label className='form-label mb-1' htmlFor='project-select'>
                  Projeto
                </label>
                <div className='project-manager-actions'>
                  <select
                    id='project-select'
                    className='form-select form-select-sm'
                    value={activeProject?.id ?? ''}
                    onChange={handleSelectProject}
                  >
                    {workspace.projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} • v{project.version}
                      </option>
                    ))}
                  </select>
                  <button
                    type='button'
                    className='btn btn-sm btn-outline-secondary'
                    onClick={handleCreateProject}
                  >
                    Novo projeto
                  </button>
                  <button
                    type='button'
                    className='btn btn-sm btn-outline-secondary'
                    onClick={handleCreateProjectVersion}
                    disabled={!activeProject}
                  >
                    Nova versão
                  </button>
                </div>
              </div>

              <div className='project-manager-grid'>
                <div>
                  <label className='form-label mb-1' htmlFor='project-name'>
                    Nome
                  </label>
                  <input
                    id='project-name'
                    className='form-control form-control-sm'
                    value={activeProject?.name ?? ''}
                    onChange={(event) =>
                      handleUpdateActiveProjectField('name', event.target.value)
                    }
                    placeholder='Nome do projeto'
                  />
                </div>
                <div>
                  <label className='form-label mb-1' htmlFor='project-author'>
                    Autoria
                  </label>
                  <input
                    id='project-author'
                    className='form-control form-control-sm'
                    value={activeProject?.author ?? ''}
                    onChange={(event) =>
                      handleUpdateActiveProjectField(
                        'author',
                        event.target.value,
                      )
                    }
                    placeholder='Nome do autor'
                  />
                </div>
                <div className='project-manager-focal'>
                  <label className='form-label mb-1' htmlFor='project-focal'>
                    Problema Focal
                  </label>
                  <input
                    id='project-focal'
                    className='form-control form-control-sm'
                    value={activeProject?.focalProblem ?? ''}
                    onChange={(event) =>
                      handleUpdateActiveProjectField(
                        'focalProblem',
                        event.target.value,
                      )
                    }
                    placeholder='Descreva o problema focal'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className='container-fluid board-layout py-4 py-md-5'>
        <section className='board-panel'>
          <div className='board-table-wrapper'>
            <table className='table table-bordered align-middle mb-0 board-table'>
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '29.33%' }} />
                <col style={{ width: '29.33%' }} />
                <col style={{ width: '29.33%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className='sticky-top' scope='col'>
                    Camadas
                  </th>
                  {COLUMN_ORDER.map((columnId) => (
                    <th className='sticky-top' scope='col' key={columnId}>
                      <div className='board-column-head'>
                        <span>{COLUMN_LABELS[columnId]}</span>
                        <span className='badge text-bg-secondary'>
                          {getColumnCardCount(columnId)}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.layerId}>
                    <th scope='row' className='board-group-cell'>
                      {row.layerLabel}
                    </th>
                    {COLUMN_ORDER.map((columnId) => {
                      const cards = row[columnId];

                      return (
                        <td key={`${row.layerId}-${columnId}`}>
                          <div
                            className='kanban-cell'
                            onDragOver={(event) =>
                              handleCellDragOver(event, rowIndex, columnId)
                            }
                            onDrop={(event) =>
                              handleCellDrop(event, rowIndex, columnId)
                            }
                            onDragLeave={(event) =>
                              handleCellDragLeave(event, rowIndex, columnId)
                            }
                            data-drop-target={
                              dragOverTarget?.rowIndex === rowIndex &&
                              dragOverTarget?.columnId === columnId
                                ? 'true'
                                : 'false'
                            }
                          >
                            {cards.map((card) => {
                              const isEditingCurrentCard =
                                editingCard?.cardId === card.id &&
                                editingCard.rowIndex === rowIndex &&
                                editingCard.columnId === columnId;

                              return (
                                <article
                                  className='kanban-card'
                                  key={card.id}
                                  data-post-it-color={card.color}
                                  draggable={!isEditingCurrentCard}
                                  onDragStart={(event) =>
                                    handleCardDragStart(
                                      event,
                                      rowIndex,
                                      columnId,
                                      card.id,
                                    )
                                  }
                                  onDragEnd={handleCardDragEnd}
                                >
                                  {isEditingCurrentCard ? (
                                    <div className='kanban-card-editor'>
                                      <RichTextCell
                                        id={`edit-${card.id}`}
                                        label='Editar cartão'
                                        value={editingCard.value}
                                        onChange={(nextValue) =>
                                          setEditingCard(
                                            (currentEditingCard) =>
                                              currentEditingCard
                                                ? {
                                                    ...currentEditingCard,
                                                    value: nextValue,
                                                  }
                                                : currentEditingCard,
                                          )
                                        }
                                        placeholder='Edite o conteúdo do cartão'
                                      />
                                      <div className='kanban-card-editor-actions'>
                                        <button
                                          type='button'
                                          className='btn btn-sm btn-primary'
                                          onClick={handleSaveEditedCard}
                                          disabled={
                                            !hasMeaningfulContent(
                                              editingCard.value,
                                            )
                                          }
                                        >
                                          Salvar
                                        </button>
                                        <button
                                          type='button'
                                          className='btn btn-sm btn-outline-secondary'
                                          onClick={() => setEditingCard(null)}
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className='kanban-card-content'
                                      dangerouslySetInnerHTML={{
                                        __html: card.content,
                                      }}
                                    />
                                  )}
                                  <div className='kanban-card-actions'>
                                    <div
                                      className='kanban-color-palette'
                                      role='group'
                                      aria-label='Selecionar cor do post-it'
                                    >
                                      {POST_IT_PALETTE.map((paletteColor) => (
                                        <button
                                          key={`${card.id}-${paletteColor.id}`}
                                          type='button'
                                          className={`kanban-color-swatch ${
                                            card.color === paletteColor.id
                                              ? 'is-active'
                                              : ''
                                          }`}
                                          data-post-it-color={paletteColor.id}
                                          onClick={() =>
                                            handleChangeCardColor(
                                              rowIndex,
                                              columnId,
                                              card.id,
                                              paletteColor.id,
                                            )
                                          }
                                          aria-label={`Cor ${paletteColor.label}`}
                                          title={`Cor ${paletteColor.label}`}
                                        />
                                      ))}
                                    </div>
                                    <button
                                      type='button'
                                      className='btn btn-sm btn-outline-secondary'
                                      onClick={() =>
                                        handleStartEditingCard(
                                          rowIndex,
                                          columnId,
                                          card.id,
                                          card.content,
                                        )
                                      }
                                      disabled={isEditingCurrentCard}
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type='button'
                                      className='btn btn-sm btn-outline-danger'
                                      onClick={() =>
                                        handleDeleteCard(
                                          rowIndex,
                                          columnId,
                                          card.id,
                                        )
                                      }
                                      aria-label='Remover cartão'
                                    >
                                      ×
                                    </button>
                                  </div>
                                </article>
                              );
                            })}

                            {composer?.rowIndex === rowIndex &&
                              composer?.columnId === columnId && (
                                <div className='kanban-composer'>
                                  <RichTextCell
                                    id={`composer-${row.layerId}-${columnId}`}
                                    label={`Novo cartão em ${COLUMN_LABELS[columnId]} para ${row.layerLabel}`}
                                    value={composer.value}
                                    onChange={(nextValue) =>
                                      setComposer((currentComposer) =>
                                        currentComposer
                                          ? {
                                              ...currentComposer,
                                              value: nextValue,
                                            }
                                          : currentComposer,
                                      )
                                    }
                                    placeholder='Descreva o cartão'
                                  />
                                  <div className='kanban-composer-actions'>
                                    <button
                                      type='button'
                                      className='btn btn-sm btn-primary'
                                      onClick={handleSaveCard}
                                      disabled={
                                        !hasMeaningfulContent(composer.value)
                                      }
                                    >
                                      Adicionar
                                    </button>
                                    <button
                                      type='button'
                                      className='btn btn-sm btn-outline-secondary'
                                      onClick={() => setComposer(null)}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              )}

                            {!(
                              composer?.rowIndex === rowIndex &&
                              composer?.columnId === columnId
                            ) && (
                              <button
                                type='button'
                                className='btn btn-sm btn-outline-primary kanban-add-btn'
                                onClick={() =>
                                  handleOpenComposer(rowIndex, columnId)
                                }
                              >
                                + Novo cartão
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='board-panel-footer mt-3'>
            <small className='text-body-secondary'>
              Dica: arraste e solte os cartões entre qualquer linha e coluna.
            </small>
          </div>
        </section>

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
