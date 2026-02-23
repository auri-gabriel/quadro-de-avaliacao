import {
  DEFAULT_POST_IT_COLOR,
  type CardOrderMap,
  type BoardCard,
  type ColumnId,
  type EvaluationProject,
  INITIAL_EVALUATION_ROWS,
  type EvaluationRow,
  type EvaluationWorkspace,
  type LayerId,
  type LayerLabel,
  type PostItColor,
} from '../types/board';

const LEGACY_STORAGE_KEY = 'evaluation-board-v1';
const WORKSPACE_STORAGE_KEY = 'evaluation-board-projects-v1';

const LAYERS: LayerId[] = ['informal', 'formal', 'technical'];
const COLUMNS: ColumnId[] = ['stakeholders', 'issues', 'ideas'];
const POST_IT_COLORS: PostItColor[] = [
  'yellow',
  'pink',
  'blue',
  'green',
  'orange',
  'purple',
];

const LAYER_LABELS: Record<LayerId, LayerLabel> = {
  informal: 'Informal',
  formal: 'Formal',
  technical: 'Técnico',
};

function isPostItColor(value: unknown): value is PostItColor {
  return POST_IT_COLORS.includes(value as PostItColor);
}

function createId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isBoardCard(value: unknown): value is BoardCard {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.content === 'string' &&
    (candidate.color === undefined || isPostItColor(candidate.color))
  );
}

function normalizeCard(card: BoardCard): BoardCard {
  return {
    ...card,
    color: isPostItColor(card.color) ? card.color : DEFAULT_POST_IT_COLOR,
  };
}

function normalizeLayerLabel(layerId: LayerId): LayerLabel {
  return LAYER_LABELS[layerId];
}

function normalizeRow(row: EvaluationRow): EvaluationRow {
  return {
    ...row,
    layerLabel: normalizeLayerLabel(row.layerId),
    stakeholders: row.stakeholders.map(normalizeCard),
    issues: row.issues.map(normalizeCard),
    ideas: row.ideas.map(normalizeCard),
  };
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isCardOrderMap(value: unknown): value is CardOrderMap {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return LAYERS.every((layerId) => {
    const layer = candidate[layerId];

    if (!layer || typeof layer !== 'object') {
      return false;
    }

    const layerRecord = layer as Record<string, unknown>;
    return COLUMNS.every((columnId) => isStringArray(layerRecord[columnId]));
  });
}

function normalizeOrderedIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  ids.forEach((id) => {
    if (!seen.has(id)) {
      seen.add(id);
      normalized.push(id);
    }
  });

  return normalized;
}

function orderCardsByIds(
  cards: BoardCard[],
  orderedIds: string[],
): BoardCard[] {
  const indexById = new Map<string, number>();
  normalizeOrderedIds(orderedIds).forEach((id, index) => {
    indexById.set(id, index);
  });

  return [...cards].sort((firstCard, secondCard) => {
    const firstIndex = indexById.get(firstCard.id);
    const secondIndex = indexById.get(secondCard.id);

    if (firstIndex === undefined && secondIndex === undefined) {
      return 0;
    }

    if (firstIndex === undefined) {
      return 1;
    }

    if (secondIndex === undefined) {
      return -1;
    }

    return firstIndex - secondIndex;
  });
}

function isEvaluationRow(value: unknown): value is EvaluationRow {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    LAYERS.includes(candidate.layerId as LayerId) &&
    typeof candidate.layerLabel === 'string' &&
    COLUMNS.every(
      (column) =>
        Array.isArray(candidate[column]) &&
        (candidate[column] as unknown[]).every(isBoardCard),
    )
  );
}

export function parseBoardRows(value: unknown): EvaluationRow[] | null {
  if (
    !Array.isArray(value) ||
    value.length !== INITIAL_EVALUATION_ROWS.length
  ) {
    return null;
  }

  if (!value.every(isEvaluationRow)) {
    return null;
  }

  return value.map((row) => normalizeRow(row as EvaluationRow));
}

export function createInitialBoard(): EvaluationRow[] {
  return INITIAL_EVALUATION_ROWS.map((row) =>
    normalizeRow({
      ...row,
      stakeholders: [...row.stakeholders],
      issues: [...row.issues],
      ideas: [...row.ideas],
    }),
  );
}

export function buildCardOrder(rows: EvaluationRow[]): CardOrderMap {
  return {
    informal: {
      stakeholders: rows[0]?.stakeholders.map((card) => card.id) ?? [],
      issues: rows[0]?.issues.map((card) => card.id) ?? [],
      ideas: rows[0]?.ideas.map((card) => card.id) ?? [],
    },
    formal: {
      stakeholders: rows[1]?.stakeholders.map((card) => card.id) ?? [],
      issues: rows[1]?.issues.map((card) => card.id) ?? [],
      ideas: rows[1]?.ideas.map((card) => card.id) ?? [],
    },
    technical: {
      stakeholders: rows[2]?.stakeholders.map((card) => card.id) ?? [],
      issues: rows[2]?.issues.map((card) => card.id) ?? [],
      ideas: rows[2]?.ideas.map((card) => card.id) ?? [],
    },
  };
}

export function applyCardOrder(
  rows: EvaluationRow[],
  cardOrder: unknown,
): EvaluationRow[] {
  if (!isCardOrderMap(cardOrder)) {
    return rows;
  }

  return rows.map((row) => ({
    ...row,
    stakeholders: orderCardsByIds(
      row.stakeholders,
      cardOrder[row.layerId].stakeholders,
    ),
    issues: orderCardsByIds(row.issues, cardOrder[row.layerId].issues),
    ideas: orderCardsByIds(row.ideas, cardOrder[row.layerId].ideas),
  }));
}

function normalizeProject(project: EvaluationProject): EvaluationProject {
  const safeVersion =
    Number.isInteger(project.version) && project.version > 0
      ? project.version
      : 1;

  return {
    ...project,
    name: project.name.trim() || 'Projeto sem nome',
    focalProblem: project.focalProblem ?? '',
    author: project.author ?? '',
    version: safeVersion,
    rows: parseBoardRows(project.rows) ?? createInitialBoard(),
  };
}

function isProject(value: unknown): value is EvaluationProject {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.focalProblem === 'string' &&
    typeof candidate.author === 'string' &&
    typeof candidate.version === 'number' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    Array.isArray(candidate.rows)
  );
}

function parseWorkspace(value: unknown): EvaluationWorkspace | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.activeProjectId !== 'string' ||
    !Array.isArray(candidate.projects)
  ) {
    return null;
  }

  if (!candidate.projects.every(isProject)) {
    return null;
  }

  const projects = (candidate.projects as EvaluationProject[]).map(
    normalizeProject,
  );
  if (projects.length === 0) {
    return null;
  }

  const hasActiveProject = projects.some(
    (project) => project.id === candidate.activeProjectId,
  );

  return {
    activeProjectId: hasActiveProject
      ? candidate.activeProjectId
      : projects[0].id,
    projects,
  };
}

export function createProject(
  name = 'Projeto sem nome',
  options?: {
    focalProblem?: string;
    author?: string;
    version?: number;
    rows?: EvaluationRow[];
  },
): EvaluationProject {
  const now = new Date().toISOString();
  return normalizeProject({
    id: createId(),
    name,
    focalProblem: options?.focalProblem ?? '',
    author: options?.author ?? '',
    version: options?.version ?? 1,
    createdAt: now,
    updatedAt: now,
    rows: options?.rows ?? createInitialBoard(),
  });
}

export function duplicateProjectVersion(
  sourceProject: EvaluationProject,
): EvaluationProject {
  return createProject(sourceProject.name, {
    focalProblem: sourceProject.focalProblem,
    author: sourceProject.author,
    version: sourceProject.version + 1,
    rows: sourceProject.rows,
  });
}

export function createInitialWorkspace(): EvaluationWorkspace {
  const project = createProject('Projeto 1');
  return {
    activeProjectId: project.id,
    projects: [project],
  };
}

export function loadWorkspace(): EvaluationWorkspace {
  const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (!raw) {
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) {
      return createInitialWorkspace();
    }

    try {
      const legacyParsed = JSON.parse(legacyRaw);
      const legacyRows = parseBoardRows(legacyParsed);
      if (!legacyRows) {
        return createInitialWorkspace();
      }

      const migratedProject = createProject('Projeto migrado', {
        rows: legacyRows,
      });

      return {
        activeProjectId: migratedProject.id,
        projects: [migratedProject],
      };
    } catch {
      return createInitialWorkspace();
    }
  }

  try {
    const parsed = JSON.parse(raw);
    return parseWorkspace(parsed) ?? createInitialWorkspace();
  } catch {
    return createInitialWorkspace();
  }
}

export function saveWorkspace(workspace: EvaluationWorkspace): void {
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
}
