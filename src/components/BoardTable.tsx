import { RichTextCell } from './RichTextCell';
import type {
  BoardCard,
  ColumnId,
  EvaluationRow,
  PostItColor,
} from '../types/board';
import type { ComposerState, EditingCardState } from '../hooks/useBoardCards';
import type { DropIndicatorTarget } from '../hooks/useBoardDnd';

interface DragOverTarget {
  rowIndex: number;
  columnId: ColumnId;
}

interface PaletteColor {
  id: PostItColor;
  label: string;
}

interface BoardTableProps {
  rows: EvaluationRow[];
  columnOrder: ColumnId[];
  columnLabels: Record<ColumnId, string>;
  postItPalette: PaletteColor[];
  composer: ComposerState | null;
  editingCard: EditingCardState | null;
  dragOverTarget: DragOverTarget | null;
  dropIndicatorTarget: DropIndicatorTarget | null;
  getColumnCardCount: (columnId: ColumnId) => number;
  hasMeaningfulContent: (value: string) => boolean;
  onCellDragOver: (
    event: React.DragEvent<HTMLDivElement>,
    rowIndex: number,
    columnId: ColumnId,
  ) => void;
  onCellDrop: (
    event: React.DragEvent<HTMLDivElement>,
    rowIndex: number,
    columnId: ColumnId,
  ) => void;
  onCellDragLeave: (
    event: React.DragEvent<HTMLDivElement>,
    rowIndex: number,
    columnId: ColumnId,
  ) => void;
  onCardDragStart: (
    event: React.DragEvent<HTMLElement>,
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
  ) => void;
  onCardDragEnd: () => void;
  onCardDragOver: (
    event: React.DragEvent<HTMLElement>,
    rowIndex: number,
    columnId: ColumnId,
    targetCardId: string,
  ) => void;
  onCardDrop: (
    event: React.DragEvent<HTMLElement>,
    rowIndex: number,
    columnId: ColumnId,
    targetCardId: string,
  ) => void;
  onCardDragLeave: (
    event: React.DragEvent<HTMLElement>,
    rowIndex: number,
    columnId: ColumnId,
  ) => void;
  onCardValueChange: (nextValue: string) => void;
  onSaveEditedCard: () => void;
  onCancelEditingCard: () => void;
  onChangeCardColor: (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
    color: PostItColor,
  ) => void;
  onStartEditingCard: (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
    value: string,
  ) => void;
  onDeleteCard: (rowIndex: number, columnId: ColumnId, cardId: string) => void;
  onComposerValueChange: (nextValue: string) => void;
  onSaveCard: () => void;
  onCancelComposer: () => void;
  onOpenComposer: (rowIndex: number, columnId: ColumnId) => void;
}

function isEditingCard(
  editingCard: EditingCardState | null,
  card: BoardCard,
  rowIndex: number,
  columnId: ColumnId,
): boolean {
  return (
    editingCard?.cardId === card.id &&
    editingCard.rowIndex === rowIndex &&
    editingCard.columnId === columnId
  );
}

export function BoardTable({
  rows,
  columnOrder,
  columnLabels,
  postItPalette,
  composer,
  editingCard,
  dragOverTarget,
  dropIndicatorTarget,
  getColumnCardCount,
  hasMeaningfulContent,
  onCellDragOver,
  onCellDrop,
  onCellDragLeave,
  onCardDragStart,
  onCardDragEnd,
  onCardDragOver,
  onCardDrop,
  onCardDragLeave,
  onCardValueChange,
  onSaveEditedCard,
  onCancelEditingCard,
  onChangeCardColor,
  onStartEditingCard,
  onDeleteCard,
  onComposerValueChange,
  onSaveCard,
  onCancelComposer,
  onOpenComposer,
}: BoardTableProps) {
  return (
    <section className='board-panel'>
      <div className='board-table-wrapper'>
        <table className='table table-bordered align-middle mb-0 board-table'>
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '29.33%' }} />
            <col style={{ width: '29.33%' }} />
            <col style={{ width: '29.33%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className='sticky-top' scope='col'>
                Camadas
              </th>
              {columnOrder.map((columnId) => (
                <th className='sticky-top' scope='col' key={columnId}>
                  <div className='board-column-head'>
                    <span>{columnLabels[columnId]}</span>
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
                {columnOrder.map((columnId) => {
                  const cards = row[columnId];

                  return (
                    <td
                      key={`${row.layerId}-${columnId}`}
                      data-layer-label={row.layerLabel}
                    >
                      <div
                        className='kanban-cell'
                        onDragOver={(event) =>
                          onCellDragOver(event, rowIndex, columnId)
                        }
                        onDrop={(event) =>
                          onCellDrop(event, rowIndex, columnId)
                        }
                        onDragLeave={(event) =>
                          onCellDragLeave(event, rowIndex, columnId)
                        }
                        data-drop-target={
                          dragOverTarget?.rowIndex === rowIndex &&
                          dragOverTarget?.columnId === columnId
                            ? 'true'
                            : 'false'
                        }
                      >
                        {cards.map((card) => {
                          const editingCurrentCard = isEditingCard(
                            editingCard,
                            card,
                            rowIndex,
                            columnId,
                          );
                          const editingValue = editingCard?.value ?? '';
                          const isDropIndicatorTarget =
                            dropIndicatorTarget?.rowIndex === rowIndex &&
                            dropIndicatorTarget.columnId === columnId &&
                            dropIndicatorTarget.cardId === card.id;

                          return (
                            <article
                              className='kanban-card'
                              key={card.id}
                              data-card-id={card.id}
                              data-post-it-color={card.color}
                              data-drop-indicator={
                                isDropIndicatorTarget ? 'true' : 'false'
                              }
                              data-drop-placement={
                                isDropIndicatorTarget
                                  ? dropIndicatorTarget?.placement
                                  : undefined
                              }
                              draggable={!editingCurrentCard}
                              onDragStart={(event) =>
                                onCardDragStart(
                                  event,
                                  rowIndex,
                                  columnId,
                                  card.id,
                                )
                              }
                              onDragEnd={onCardDragEnd}
                              onDragOver={(event) =>
                                onCardDragOver(
                                  event,
                                  rowIndex,
                                  columnId,
                                  card.id,
                                )
                              }
                              onDrop={(event) =>
                                onCardDrop(event, rowIndex, columnId, card.id)
                              }
                              onDragLeave={(event) =>
                                onCardDragLeave(event, rowIndex, columnId)
                              }
                            >
                              {editingCurrentCard ? (
                                <div className='kanban-card-editor'>
                                  <RichTextCell
                                    id={`edit-${card.id}`}
                                    label='Editar cartão'
                                    value={editingValue}
                                    onChange={onCardValueChange}
                                    placeholder='Edite o conteúdo do cartão'
                                  />
                                  <div className='kanban-card-editor-actions'>
                                    <button
                                      type='button'
                                      className='btn btn-sm btn-primary'
                                      onClick={onSaveEditedCard}
                                      disabled={
                                        !hasMeaningfulContent(editingValue)
                                      }
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      type='button'
                                      className='btn btn-sm btn-outline-secondary'
                                      onClick={onCancelEditingCard}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className='kanban-card-content'
                                  dangerouslySetInnerHTML={{
                                    __html: card.content,
                                  }}
                                />
                              )}
                              <div className='kanban-card-actions'>
                                <div className='kanban-card-action-secondary'>
                                  <button
                                    type='button'
                                    className='btn btn-sm btn-outline-secondary'
                                    onClick={() =>
                                      onStartEditingCard(
                                        rowIndex,
                                        columnId,
                                        card.id,
                                        card.content,
                                      )
                                    }
                                    disabled={editingCurrentCard}
                                  >
                                    <i
                                      className='bi bi-pencil-square me-1'
                                      aria-hidden='true'
                                    />
                                    Editar
                                  </button>
                                  <div
                                    className='kanban-color-palette'
                                    role='group'
                                    aria-label='Selecionar cor do post-it'
                                  >
                                    {postItPalette.map((paletteColor) => (
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
                                          onChangeCardColor(
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
                                  <button
                                    type='button'
                                    className='btn btn-sm btn-outline-danger'
                                    onClick={() =>
                                      onDeleteCard(rowIndex, columnId, card.id)
                                    }
                                    aria-label='Remover cartão'
                                  >
                                    <i
                                      className='bi bi-trash'
                                      aria-hidden='true'
                                    />
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}

                        {composer?.rowIndex === rowIndex &&
                          composer?.columnId === columnId && (
                            <div className='kanban-composer'>
                              <RichTextCell
                                id={`composer-${row.layerId}-${columnId}`}
                                label={`Novo cartão em ${columnLabels[columnId]} para ${row.layerLabel}`}
                                value={composer.value}
                                onChange={onComposerValueChange}
                                placeholder='Descreva o cartão'
                              />
                              <div className='kanban-composer-actions'>
                                <button
                                  type='button'
                                  className='btn btn-sm btn-primary'
                                  onClick={onSaveCard}
                                  disabled={
                                    !hasMeaningfulContent(composer.value)
                                  }
                                >
                                  Adicionar
                                </button>
                                <button
                                  type='button'
                                  className='btn btn-sm btn-outline-secondary'
                                  onClick={onCancelComposer}
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
                            className='btn btn-sm btn-primary kanban-add-btn'
                            onClick={() => onOpenComposer(rowIndex, columnId)}
                          >
                            <i
                              className='bi bi-plus-circle me-1'
                              aria-hidden='true'
                            />
                            Novo cartão
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
          <i className='bi bi-arrows-move me-1' aria-hidden='true' />
          Dica: arraste e solte os cartões entre qualquer linha e coluna.
        </small>
      </div>
    </section>
  );
}
