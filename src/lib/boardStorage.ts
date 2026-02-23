import {
  DEFAULT_POST_IT_COLOR,
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
