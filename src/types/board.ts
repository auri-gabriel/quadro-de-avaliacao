export type LayerId = 'informal' | 'formal' | 'technical';
export type ColumnId = 'stakeholders' | 'issues' | 'ideas';
export type LayerLabel = 'Informal' | 'Formal' | 'Técnico';
export type PostItColor =
  | 'yellow'
  | 'pink'
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple';

export const DEFAULT_POST_IT_COLOR: PostItColor = 'yellow';

export interface BoardCard {
  id: string;
  content: string;
  color: PostItColor;
}

export interface EvaluationRow {
  layerId: LayerId;
  layerLabel: LayerLabel;
  stakeholders: BoardCard[];
  issues: BoardCard[];
  ideas: BoardCard[];
}

export type ColumnCardOrder = Record<ColumnId, string[]>;
export type CardOrderMap = Record<LayerId, ColumnCardOrder>;

export interface EvaluationProject {
  id: string;
  name: string;
  focalProblem: string;
  author: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  rows: EvaluationRow[];
}

export interface EvaluationWorkspace {
  activeProjectId: string;
  projects: EvaluationProject[];
}

export const INITIAL_EVALUATION_ROWS: EvaluationRow[] = [
  {
    layerId: 'informal',
    layerLabel: 'Informal',
    stakeholders: [],
    issues: [],
    ideas: [],
  },
  {
    layerId: 'formal',
    layerLabel: 'Formal',
    stakeholders: [],
    issues: [],
    ideas: [],
  },
  {
    layerId: 'technical',
    layerLabel: 'Técnico',
    stakeholders: [],
    issues: [],
    ideas: [],
  },
];
