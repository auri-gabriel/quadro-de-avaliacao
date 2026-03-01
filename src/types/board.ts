export type LayerId = string;
export type ColumnId = string;
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

export interface BoardColumn {
  id: ColumnId;
  label: string;
}

export interface BoardLayer {
  id: LayerId;
  label: string;
  description: string;
}

export interface BoardTemplate {
  id: string;
  name: string;
  columns: BoardColumn[];
  layers: BoardLayer[];
}

export interface EvaluationRow {
  layerId: LayerId;
  layerLabel: string;
  layerDescription: string;
  cards: Record<ColumnId, BoardCard[]>;
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
  templateId: string;
  template: BoardTemplate;
  rows: EvaluationRow[];
}

export interface EvaluationWorkspace {
  activeProjectId: string;
  projects: EvaluationProject[];
}

export const CLASSIC_BOARD_TEMPLATE_ID = 'classic-3x3';

export const CLASSIC_BOARD_TEMPLATE: BoardTemplate = {
  id: CLASSIC_BOARD_TEMPLATE_ID,
  name: 'Quadro clássico (3x3)',
  columns: [
    { id: 'stakeholders', label: 'Partes Interessadas' },
    { id: 'issues', label: 'Questões / Problemas' },
    { id: 'ideas', label: 'Ideias / Soluções' },
  ],
  layers: [
    {
      id: 'informal',
      label: 'Informal',
      description:
        'Influencia ou sofre impacto, direta ou indiretamente, das demais camadas.',
    },
    {
      id: 'formal',
      label: 'Formal',
      description:
        'Quem opera o sistema técnico, fornece ou necessita de informações.',
    },
    {
      id: 'technical',
      label: 'Técnico',
      description: 'Quem produz e/ou mantém o sistema técnico.',
    },
  ],
};

export const BUILTIN_BOARD_TEMPLATES: BoardTemplate[] = [
  CLASSIC_BOARD_TEMPLATE,
];
