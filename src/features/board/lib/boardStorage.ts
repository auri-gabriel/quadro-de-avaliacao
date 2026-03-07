import {
  BUILTIN_BOARD_TEMPLATES,
  CLASSIC_BOARD_TEMPLATE,
  CLASSIC_BOARD_TEMPLATE_ID,
  DEFAULT_POST_IT_COLOR,
  type BoardCard,
  type BoardTemplate,
  type CardOrderMap,
  type ColumnCardOrder,
  type ColumnId,
  type EvaluationProject,
  type EvaluationRow,
  type EvaluationWorkspace,
  type PostItColor,
} from '../types/board';

const LEGACY_STORAGE_KEY = 'evaluation-board-v1';
const WORKSPACE_STORAGE_KEY = 'evaluation-board-projects-v1';

const POST_IT_COLORS: PostItColor[] = [
  'yellow',
  'pink',
  'blue',
  'green',
  'orange',
  'purple',
];

const LEGACY_LAYER_LABELS: Record<string, string> = {
  informal: 'Informal',
  formal: 'Formal',
  technical: 'Técnico',
};

const LEGACY_COLUMNS: ColumnId[] = ['stakeholders', 'issues', 'ideas'];

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

function slugify(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

function cloneTemplate(template: BoardTemplate): BoardTemplate {
  return {
    ...template,
    columns: template.columns.map((column) => ({ ...column })),
    layers: template.layers.map((layer) => ({ ...layer })),
  };
}

function normalizeTemplate(template: unknown): BoardTemplate | null {
  if (!template || typeof template !== 'object') {
    return null;
  }

  const candidate = template as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    !Array.isArray(candidate.columns) ||
    !Array.isArray(candidate.layers)
  ) {
    return null;
  }

  const normalizedColumns = candidate.columns
    .map((column, index) => {
      if (!column || typeof column !== 'object') {
        return null;
      }

      const columnCandidate = column as Record<string, unknown>;
      const label =
        typeof columnCandidate.label === 'string'
          ? columnCandidate.label.trim()
          : '';

      const fallbackId = `column-${index + 1}`;
      const id =
        typeof columnCandidate.id === 'string'
          ? slugify(columnCandidate.id, fallbackId)
          : slugify(label, fallbackId);

      if (!label) {
        return null;
      }

      return { id, label };
    })
    .filter((column): column is { id: string; label: string } =>
      Boolean(column),
    );

  const normalizedLayers = candidate.layers
    .map((layer, index) => {
      if (!layer || typeof layer !== 'object') {
        return null;
      }

      const layerCandidate = layer as Record<string, unknown>;
      const label =
        typeof layerCandidate.label === 'string'
          ? layerCandidate.label.trim()
          : '';
      const description =
        typeof layerCandidate.description === 'string'
          ? layerCandidate.description.trim()
          : '';

      const fallbackId = `layer-${index + 1}`;
      const id =
        typeof layerCandidate.id === 'string'
          ? slugify(layerCandidate.id, fallbackId)
          : slugify(label, fallbackId);

      if (!label) {
        return null;
      }

      return { id, label, description };
    })
    .filter(
      (layer): layer is { id: string; label: string; description: string } =>
        Boolean(layer),
    );

  if (normalizedColumns.length === 0 || normalizedLayers.length === 0) {
    return null;
  }

  const uniqueColumns = new Set<string>();
  const dedupedColumns = normalizedColumns.filter((column) => {
    if (uniqueColumns.has(column.id)) {
      return false;
    }

    uniqueColumns.add(column.id);
    return true;
  });

  const uniqueLayers = new Set<string>();
  const dedupedLayers = normalizedLayers.filter((layer) => {
    if (uniqueLayers.has(layer.id)) {
      return false;
    }

    uniqueLayers.add(layer.id);
    return true;
  });

  if (dedupedColumns.length === 0 || dedupedLayers.length === 0) {
    return null;
  }

  const templateId = slugify(candidate.id, CLASSIC_BOARD_TEMPLATE_ID);

  return {
    id: templateId,
    name: candidate.name.trim() || 'Modelo personalizado',
    columns: dedupedColumns,
    layers: dedupedLayers,
  };
}

export function getBuiltInTemplates(): BoardTemplate[] {
  return BUILTIN_BOARD_TEMPLATES.map(cloneTemplate);
}

export function createCustomTemplate(options: {
  name: string;
  columns: string[];
  layers: Array<{ label: string; description?: string }>;
}): BoardTemplate | null {
  const normalizedColumns = options.columns
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label, index) => ({
      id: slugify(label, `column-${index + 1}`),
      label,
    }));

  const normalizedLayers = options.layers
    .map((layer) => ({
      label: layer.label.trim(),
      description: layer.description?.trim() ?? '',
    }))
    .filter((layer) => layer.label.length > 0)
    .map((layer, index) => ({
      id: slugify(layer.label, `layer-${index + 1}`),
      label: layer.label,
      description: layer.description,
    }));

  const candidate = normalizeTemplate({
    id: `custom-${createId()}`,
    name: options.name.trim() || 'Modelo personalizado',
    columns: normalizedColumns,
    layers: normalizedLayers,
  });

  return candidate ? cloneTemplate(candidate) : null;
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

function normalizeRow(
  row: EvaluationRow,
  template: BoardTemplate,
): EvaluationRow {
  const cards: Record<ColumnId, BoardCard[]> = {};

  template.columns.forEach((column) => {
    const sourceCards = Array.isArray(row.cards?.[column.id])
      ? row.cards[column.id]
      : [];

    cards[column.id] = sourceCards.filter(isBoardCard).map(normalizeCard);
  });

  const layer = template.layers.find((current) => current.id === row.layerId);

  return {
    layerId: row.layerId,
    layerLabel: layer?.label ?? row.layerLabel,
    layerDescription: layer?.description ?? row.layerDescription ?? '',
    cards,
  };
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isColumnCardOrder(value: unknown): value is ColumnCardOrder {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every((item) => isStringArray(item));
}

function isCardOrderMap(value: unknown): value is CardOrderMap {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every((item) => isColumnCardOrder(item));
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

function parseTemplateAwareRows(
  value: unknown,
  template: BoardTemplate,
): EvaluationRow[] | null {
  if (!Array.isArray(value) || value.length !== template.layers.length) {
    return null;
  }

  const layerMap = new Map(template.layers.map((layer) => [layer.id, layer]));

  const rows = value
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }

      const candidate = row as Record<string, unknown>;
      if (typeof candidate.layerId !== 'string') {
        return null;
      }

      const layer = layerMap.get(candidate.layerId);
      if (!layer) {
        return null;
      }

      if (!candidate.cards || typeof candidate.cards !== 'object') {
        return null;
      }

      const cardsRecord = candidate.cards as Record<string, unknown>;
      const cards: Record<ColumnId, BoardCard[]> = {};

      for (const column of template.columns) {
        const columnCards = cardsRecord[column.id];
        if (!Array.isArray(columnCards) || !columnCards.every(isBoardCard)) {
          return null;
        }

        cards[column.id] = columnCards.map((card) => normalizeCard(card));
      }

      return {
        layerId: layer.id,
        layerLabel: layer.label,
        layerDescription:
          typeof candidate.layerDescription === 'string'
            ? candidate.layerDescription
            : layer.description,
        cards,
      } satisfies EvaluationRow;
    })
    .filter((row): row is EvaluationRow => Boolean(row));

  return rows.length === template.layers.length ? rows : null;
}

function parseLegacyRows(value: unknown): EvaluationRow[] | null {
  if (
    !Array.isArray(value) ||
    value.length !== CLASSIC_BOARD_TEMPLATE.layers.length
  ) {
    return null;
  }

  const rows = value
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }

      const candidate = row as Record<string, unknown>;
      if (typeof candidate.layerId !== 'string') {
        return null;
      }

      const layerLabel =
        typeof candidate.layerLabel === 'string'
          ? candidate.layerLabel
          : (LEGACY_LAYER_LABELS[candidate.layerId] ?? candidate.layerId);

      const cards: Record<ColumnId, BoardCard[]> = {};
      for (const columnId of LEGACY_COLUMNS) {
        const columnCards = candidate[columnId];
        if (!Array.isArray(columnCards) || !columnCards.every(isBoardCard)) {
          return null;
        }

        cards[columnId] = columnCards.map((card) => normalizeCard(card));
      }

      return {
        layerId: candidate.layerId,
        layerLabel,
        layerDescription: '',
        cards,
      } satisfies EvaluationRow;
    })
    .filter((row): row is EvaluationRow => Boolean(row));

  return rows.length === CLASSIC_BOARD_TEMPLATE.layers.length ? rows : null;
}

export function parseBoardRows(
  value: unknown,
  template: BoardTemplate,
): EvaluationRow[] | null {
  return (
    parseTemplateAwareRows(value, template) ??
    (template.id === CLASSIC_BOARD_TEMPLATE_ID ? parseLegacyRows(value) : null)
  );
}

export function createInitialBoard(template: BoardTemplate): EvaluationRow[] {
  const safeTemplate = cloneTemplate(template);

  return safeTemplate.layers.map((layer) => ({
    layerId: layer.id,
    layerLabel: layer.label,
    layerDescription: layer.description,
    cards: safeTemplate.columns.reduce<Record<ColumnId, BoardCard[]>>(
      (accumulator, column) => {
        accumulator[column.id] = [];
        return accumulator;
      },
      {},
    ),
  }));
}

export function buildCardOrder(rows: EvaluationRow[]): CardOrderMap {
  return rows.reduce<CardOrderMap>((accumulator, row) => {
    const columnOrder = Object.entries(row.cards).reduce<ColumnCardOrder>(
      (columnAccumulator, [columnId, cards]) => {
        columnAccumulator[columnId] = cards.map((card) => card.id);
        return columnAccumulator;
      },
      {},
    );

    accumulator[row.layerId] = columnOrder;
    return accumulator;
  }, {});
}

export function applyCardOrder(
  rows: EvaluationRow[],
  cardOrder: unknown,
): EvaluationRow[] {
  if (!isCardOrderMap(cardOrder)) {
    return rows;
  }

  return rows.map((row) => {
    const layerOrder = cardOrder[row.layerId];
    if (!layerOrder) {
      return row;
    }

    const cards = Object.entries(row.cards).reduce<
      Record<ColumnId, BoardCard[]>
    >((accumulator, [columnId, columnCards]) => {
      accumulator[columnId] = orderCardsByIds(
        columnCards,
        layerOrder[columnId] ?? [],
      );
      return accumulator;
    }, {});

    return {
      ...row,
      cards,
    };
  });
}

function normalizeProject(project: EvaluationProject): EvaluationProject {
  const safeVersion =
    Number.isInteger(project.version) && project.version > 0
      ? project.version
      : 1;

  const normalizedTemplate =
    normalizeTemplate(project.template) ??
    cloneTemplate(CLASSIC_BOARD_TEMPLATE);

  const normalizedRows =
    parseBoardRows(project.rows, normalizedTemplate) ??
    createInitialBoard(normalizedTemplate);

  return {
    ...project,
    name: project.name.trim() || 'Projeto sem nome',
    focalProblem: project.focalProblem ?? '',
    author: project.author ?? '',
    version: safeVersion,
    templateId: normalizedTemplate.id,
    template: normalizedTemplate,
    rows: normalizedRows.map((row) => normalizeRow(row, normalizedTemplate)),
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
    template?: BoardTemplate;
  },
): EvaluationProject {
  const now = new Date().toISOString();
  const template =
    normalizeTemplate(options?.template) ??
    cloneTemplate(CLASSIC_BOARD_TEMPLATE);

  return normalizeProject({
    id: createId(),
    name,
    focalProblem: options?.focalProblem ?? '',
    author: options?.author ?? '',
    version: options?.version ?? 1,
    createdAt: now,
    updatedAt: now,
    templateId: template.id,
    template,
    rows: options?.rows ?? createInitialBoard(template),
  });
}

export function duplicateProjectVersion(
  sourceProject: EvaluationProject,
): EvaluationProject {
  return createProject(sourceProject.name, {
    focalProblem: sourceProject.focalProblem,
    author: sourceProject.author,
    version: sourceProject.version + 1,
    template: sourceProject.template,
    rows: sourceProject.rows,
  });
}

export function createInitialWorkspace(): EvaluationWorkspace {
  const project = createProject('Projeto 1', {
    template: CLASSIC_BOARD_TEMPLATE,
  });
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
      const legacyRows =
        parseBoardRows(legacyParsed, CLASSIC_BOARD_TEMPLATE) ??
        (legacyParsed &&
        typeof legacyParsed === 'object' &&
        'rows' in (legacyParsed as Record<string, unknown>)
          ? parseBoardRows(
              (legacyParsed as Record<string, unknown>).rows,
              CLASSIC_BOARD_TEMPLATE,
            )
          : null);

      if (!legacyRows) {
        return createInitialWorkspace();
      }

      const migratedProject = createProject('Projeto migrado', {
        template: CLASSIC_BOARD_TEMPLATE,
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
