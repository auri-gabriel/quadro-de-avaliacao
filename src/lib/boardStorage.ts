import {
  DEFAULT_POST_IT_COLOR,
  type BoardCard,
  type ColumnId,
  INITIAL_EVALUATION_ROWS,
  type EvaluationRow,
  type LayerId,
  type PostItColor,
} from '../types/board';

const STORAGE_KEY = 'evaluation-board-v1';

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

function isPostItColor(value: unknown): value is PostItColor {
  return POST_IT_COLORS.includes(value as PostItColor);
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

function normalizeRow(row: EvaluationRow): EvaluationRow {
  return {
    ...row,
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

export function loadBoard(): EvaluationRow[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialBoard();
  }

  try {
    const parsed = JSON.parse(raw);
    const normalizedRows = parseBoardRows(parsed);
    return normalizedRows ?? createInitialBoard();
  } catch {
    return createInitialBoard();
  }
}

export function saveBoard(rows: EvaluationRow[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}
