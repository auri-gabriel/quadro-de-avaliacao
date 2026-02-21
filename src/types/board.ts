export type LayerId = 'informal' | 'formal' | 'technical';

export interface EvaluationRow {
  layerId: LayerId;
  layerLabel: 'Informal' | 'Formal' | 'Tecnico';
  stakeholders: string;
  issues: string;
  ideas: string;
}

export const INITIAL_EVALUATION_ROWS: EvaluationRow[] = [
  {
    layerId: 'informal',
    layerLabel: 'Informal',
    stakeholders: '',
    issues: '',
    ideas: '',
  },
  {
    layerId: 'formal',
    layerLabel: 'Formal',
    stakeholders: '',
    issues: '',
    ideas: '',
  },
  {
    layerId: 'technical',
    layerLabel: 'Tecnico',
    stakeholders: '',
    issues: '',
    ideas: '',
  },
];
