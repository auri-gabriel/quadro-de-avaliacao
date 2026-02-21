import { useEffect, useState } from 'react';
import { RichTextCell } from './components/RichTextCell';
import { createInitialBoard, loadBoard, saveBoard } from './lib/boardStorage';
import {
  DEFAULT_POST_IT_COLOR,
  type ColumnId,
  type EvaluationRow,
  type PostItColor,
} from './types/board';

interface ComposerState {
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

function App() {
  const [rows, setRows] = useState<EvaluationRow[]>(() => loadBoard());
  const [composer, setComposer] = useState<ComposerState | null>(null);

  useEffect(() => {
    saveBoard(rows);
  }, [rows]);

  const handleOpenComposer = (rowIndex: number, columnId: ColumnId) => {
    setComposer({ rowIndex, columnId, value: '' });
  };

  const handleSaveCard = () => {
    if (!composer || !hasMeaningfulContent(composer.value)) {
      return;
    }

    setRows((currentRows) =>
      currentRows.map((row, index) =>
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
    );

    setComposer(null);
  };

  const handleDeleteCard = (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [columnId]: row[columnId].filter((card) => card.id !== cardId),
            }
          : row,
      ),
    );
  };

  const handleMoveCard = (
    rowIndex: number,
    fromColumnId: ColumnId,
    toColumnId: ColumnId,
    cardId: string,
  ) => {
    if (fromColumnId === toColumnId) {
      return;
    }

    setRows((currentRows) =>
      currentRows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const card = row[fromColumnId].find((item) => item.id === cardId);
        if (!card) {
          return row;
        }

        return {
          ...row,
          [fromColumnId]: row[fromColumnId].filter(
            (item) => item.id !== cardId,
          ),
          [toColumnId]: [...row[toColumnId], card],
        };
      }),
    );
  };

  const handleChangeCardColor = (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
    color: PostItColor,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [columnId]: row[columnId].map((card) =>
                card.id === cardId ? { ...card, color } : card,
              ),
            }
          : row,
      ),
    );
  };

  const handleResetBoard = () => {
    setRows(createInitialBoard());
    setComposer(null);
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
  }).format(new Date());

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
            <div>
              <h1 className='mb-2 fw-semibold'>Análise: Quadro de Avaliação</h1>
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
        </div>
      </section>

      <main className='container-fluid board-layout py-4 py-md-5'>
        <section className='board-panel'>
          <div className='table-responsive board-table-wrapper'>
            <table className='table table-bordered align-middle mb-0 board-table'>
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '29.33%' }} />
                <col style={{ width: '29.33%' }} />
                <col style={{ width: '29.33%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th scope='col'>Camadas</th>
                  {COLUMN_ORDER.map((columnId) => (
                    <th scope='col' key={columnId}>
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
                          <div className='kanban-cell'>
                            {cards.map((card) => {
                              const columnIndex =
                                COLUMN_ORDER.indexOf(columnId);
                              const previousColumn =
                                columnIndex > 0
                                  ? COLUMN_ORDER[columnIndex - 1]
                                  : null;
                              const nextColumn =
                                columnIndex < COLUMN_ORDER.length - 1
                                  ? COLUMN_ORDER[columnIndex + 1]
                                  : null;

                              return (
                                <article
                                  className='kanban-card'
                                  key={card.id}
                                  data-post-it-color={card.color}
                                >
                                  <div
                                    className='kanban-card-content'
                                    dangerouslySetInnerHTML={{
                                      __html: card.content,
                                    }}
                                  />
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
                                    {previousColumn && (
                                      <button
                                        type='button'
                                        className='btn btn-sm btn-outline-secondary'
                                        onClick={() =>
                                          handleMoveCard(
                                            rowIndex,
                                            columnId,
                                            previousColumn,
                                            card.id,
                                          )
                                        }
                                        aria-label='Mover cartão para a coluna anterior'
                                      >
                                        ←
                                      </button>
                                    )}
                                    {nextColumn && (
                                      <button
                                        type='button'
                                        className='btn btn-sm btn-outline-secondary'
                                        onClick={() =>
                                          handleMoveCard(
                                            rowIndex,
                                            columnId,
                                            nextColumn,
                                            card.id,
                                          )
                                        }
                                        aria-label='Mover cartão para a próxima coluna'
                                      >
                                        →
                                      </button>
                                    )}
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
              Dica: use as setas dos cartões para mover entre colunas.
            </small>
            <button
              type='button'
              className='btn btn-outline-secondary'
              onClick={handleResetBoard}
            >
              Limpar quadro
            </button>
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
