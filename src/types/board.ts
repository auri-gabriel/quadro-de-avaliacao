export type LayerId = 'informal' | 'formal' | 'technical';
export type ColumnId = 'stakeholders' | 'issues' | 'ideas';

export interface BoardCard {
  id: string;
  content: string;
}

export interface EvaluationRow {
  layerId: LayerId;
  layerLabel: 'Informal' | 'Formal' | 'Tecnico';
  stakeholders: BoardCard[];
  issues: BoardCard[];
  ideas: BoardCard[];
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
    layerLabel: 'Tecnico',
    stakeholders: [],
    issues: [],
    ideas: [],
  },
];
