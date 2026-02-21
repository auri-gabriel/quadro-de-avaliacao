import { useEffect, useState } from 'react';
import { RichTextCell } from './components/RichTextCell';
import { createInitialBoard, loadBoard, saveBoard } from './lib/boardStorage';
import type { ColumnId, EvaluationRow } from './types/board';

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
                { id: createCardId(), content: composer.value },
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

  const handleResetBoard = () => {
    setRows(createInitialBoard());
    setComposer(null);
  };

  const getColumnCardCount = (columnId: ColumnId): number =>
    rows.reduce((total, row) => total + row[columnId].length, 0);

  return (
    <div className='app-shell'>
      <header className='board-header'>
        <div className='container-fluid board-layout py-4'>
          <h1 className='mb-0 fw-semibold'>Análise: Quadro de Avaliação</h1>
        </div>
      </header>

      <main className='container-fluid board-layout py-4 py-md-5'>
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
                            const columnIndex = COLUMN_ORDER.indexOf(columnId);
                            const previousColumn =
                              columnIndex > 0
                                ? COLUMN_ORDER[columnIndex - 1]
                                : null;
                            const nextColumn =
                              columnIndex < COLUMN_ORDER.length - 1
                                ? COLUMN_ORDER[columnIndex + 1]
                                : null;

                            return (
                              <article className='kanban-card' key={card.id}>
                                <div
                                  className='kanban-card-content'
                                  dangerouslySetInnerHTML={{
                                    __html: card.content,
                                  }}
                                />
                                <div className='kanban-card-actions'>
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

        <div className='mt-3'>
          <button
            type='button'
            className='btn btn-outline-secondary'
            onClick={handleResetBoard}
          >
            Limpar quadro
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
