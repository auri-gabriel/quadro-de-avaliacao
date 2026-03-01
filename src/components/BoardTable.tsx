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
  canEnterStructureEditMode: boolean;
  isFixedTemplate: boolean;
  isStructureEditMode: boolean;
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
  onRenameColumn: (columnId: ColumnId, label: string) => void;
  onRenameLayer: (
    rowIndex: number,
    field: 'title' | 'description',
    value: string,
  ) => void;
  onAddColumn: () => void;
  onRemoveColumn: (columnId: ColumnId) => void;
  onAddLayer: () => void;
  onRemoveLayer: (rowIndex: number) => void;
  onToggleStructureEditMode: () => void;
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
  canEnterStructureEditMode,
  isFixedTemplate,
  isStructureEditMode,
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
  onRenameColumn,
  onRenameLayer,
  onAddColumn,
  onRemoveColumn,
  onAddLayer,
  onRemoveLayer,
  onToggleStructureEditMode,
}: BoardTableProps) {
  const dataColumnWidth = `${88 / Math.max(1, columnOrder.length)}%`;

  return (
    <section className='board-panel'>
      <div className='board-table-wrapper'>
        <table className='table table-bordered align-middle mb-0 board-table'>
          <colgroup>
            <col style={{ width: '12%' }} />
            {columnOrder.map((columnId) => (
              <col key={columnId} style={{ width: dataColumnWidth }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className='sticky-top' scope='col'>
                <div className='d-flex align-items-center justify-content-between gap-2'>
                  <span>Camadas</span>
                  {isStructureEditMode ? (
                    <div className='d-inline-flex gap-1'>
                      <button
                        type='button'
                        className='btn btn-sm btn-outline-secondary'
                        onClick={onAddLayer}
                        aria-label='Adicionar camada'
                        title='Adicionar camada'
                      >
                        <i className='bi bi-plus' aria-hidden='true' />
                      </button>
                      <button
                        type='button'
                        className='btn btn-sm btn-outline-secondary'
                        onClick={onAddColumn}
                        aria-label='Adicionar coluna'
                        title='Adicionar coluna'
                      >
                        <i
                          className='bi bi-layout-three-columns'
                          aria-hidden='true'
                        />
                      </button>
                    </div>
                  ) : null}
                </div>
              </th>
              {columnOrder.map((columnId) => (
                <th className='sticky-top' scope='col' key={columnId}>
                  <div className='board-column-head'>
                    {isStructureEditMode ? (
                      <div className='d-flex align-items-center gap-1'>
                        <input
                          key={`${columnId}-${columnLabels[columnId]}`}
                          className='form-control form-control-sm'
                          defaultValue={columnLabels[columnId]}
                          onBlur={(event) =>
                            onRenameColumn(columnId, event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.currentTarget.blur();
                            }
                          }}
                          aria-label='Nome da coluna'
                        />
                        <button
                          type='button'
                          className='btn btn-sm btn-outline-danger'
                          onClick={() => onRemoveColumn(columnId)}
                          disabled={columnOrder.length <= 1}
                          aria-label={`Remover coluna ${columnLabels[columnId]}`}
                          title='Remover coluna'
                        >
                          <i className='bi bi-x-lg' aria-hidden='true' />
                        </button>
                      </div>
                    ) : (
                      <span>{columnLabels[columnId]}</span>
                    )}
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
                  {isStructureEditMode ? (
                    <div className='d-flex flex-column gap-1'>
                      <div className='d-flex align-items-center gap-1'>
                        <input
                          key={`${row.layerId}-${row.layerLabel}`}
                          className='form-control form-control-sm'
                          defaultValue={row.layerLabel}
                          onBlur={(event) =>
                            onRenameLayer(rowIndex, 'title', event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.currentTarget.blur();
                            }
                          }}
                          aria-label='Título da camada'
                        />
                        <button
                          type='button'
                          className='btn btn-sm btn-outline-danger'
                          onClick={() => onRemoveLayer(rowIndex)}
                          disabled={rows.length <= 1}
                          aria-label={`Remover camada ${row.layerLabel}`}
                          title='Remover camada'
                        >
                          <i className='bi bi-x-lg' aria-hidden='true' />
                        </button>
                      </div>
                      <input
                        key={`${row.layerId}-${row.layerDescription}`}
                        className='form-control form-control-sm'
                        defaultValue={row.layerDescription}
                        onBlur={(event) =>
                          onRenameLayer(
                            rowIndex,
                            'description',
                            event.target.value,
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.currentTarget.blur();
                          }
                        }}
                        aria-label='Descrição da camada'
                        placeholder='Descrição da camada'
                      />
                    </div>
                  ) : (
                    <div className='d-flex flex-column gap-1'>
                      <strong>{row.layerLabel}</strong>
                      {row.layerDescription ? (
                        <small className='text-body-secondary'>
                          {row.layerDescription}
                        </small>
                      ) : null}
                    </div>
                  )}
                </th>
                {columnOrder.map((columnId) => {
                  const cards = row.cards[columnId] ?? [];
                  const isComposerOpen =
                    composer?.rowIndex === rowIndex &&
                    composer?.columnId === columnId;
                  const hasCards = cards.length > 0;
                  const cellLabel = `${columnLabels[columnId]} • ${row.layerLabel}`;
                  const cellHintId = `cell-help-${row.layerId}-${columnId}`;

                  const handleOpenComposerFromCell = () => {
                    if (!isComposerOpen) {
                      onOpenComposer(rowIndex, columnId);
                    }
                  };

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
                        onDoubleClick={handleOpenComposerFromCell}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) {
                            return;
                          }

                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleOpenComposerFromCell();
                          }
                        }}
                        tabIndex={isComposerOpen ? -1 : 0}
                        role='region'
                        aria-label={`Área de cartões: ${cellLabel}`}
                        aria-describedby={cellHintId}
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
                              tabIndex={editingCurrentCard ? -1 : 0}
                              aria-label={`Cartão em ${cellLabel}`}
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

                        {!isComposerOpen && !hasCards && (
                          <p className='kanban-empty-state mb-0'>
                            Nenhum cartão nesta célula ainda.
                          </p>
                        )}

                        {isComposerOpen && (
                          <div className='kanban-composer'>
                            <RichTextCell
                              id={`composer-${row.layerId}-${columnId}`}
                              label={`Novo cartão em ${columnLabels[columnId]} para ${row.layerLabel}`}
                              value={composer.value}
                              onChange={onComposerValueChange}
                              placeholder='Descreva o cartão'
                              autoFocus
                            />
                            <div className='kanban-composer-actions'>
                              <button
                                type='button'
                                className='btn btn-sm btn-primary'
                                onClick={onSaveCard}
                                disabled={!hasMeaningfulContent(composer.value)}
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

                        {!isComposerOpen && (
                          <button
                            type='button'
                            className={`btn btn-sm kanban-add-btn ${
                              hasCards
                                ? 'btn-outline-secondary is-subtle'
                                : 'btn-primary'
                            }`}
                            onClick={() => onOpenComposer(rowIndex, columnId)}
                            aria-label={`Adicionar cartão em ${columnLabels[columnId]} para ${row.layerLabel}`}
                          >
                            <i
                              className='bi bi-plus-circle me-1'
                              aria-hidden='true'
                            />
                            {hasCards ? 'Adicionar cartão' : 'Novo cartão'}
                          </button>
                        )}

                        <span className='visually-hidden' id={cellHintId}>
                          Dica: use Enter ou Espaço para abrir um novo cartão.
                        </span>
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
        <button
          type='button'
          className='btn btn-sm btn-outline-secondary'
          onClick={onToggleStructureEditMode}
          aria-pressed={isStructureEditMode}
          disabled={!canEnterStructureEditMode}
        >
          <i
            className={`bi ${
              isStructureEditMode ? 'bi-check2-square' : 'bi-pencil-square'
            } me-1`}
            aria-hidden='true'
          />
          {isStructureEditMode ? 'Sair da edição' : 'Editar estrutura'}
        </button>
        {isStructureEditMode ? (
          <small className='text-body-secondary'>
            <i className='bi bi-grid me-1' aria-hidden='true' />
            Personalize colunas e camadas diretamente no cabeçalho da tabela.
          </small>
        ) : isFixedTemplate ? (
          <small className='text-body-secondary'>
            <i className='bi bi-lock me-1' aria-hidden='true' />
            Quadro fixo: selecione “Modelo personalizado” para editar a
            estrutura.
          </small>
        ) : canEnterStructureEditMode ? (
          <small className='text-body-secondary'>
            <i className='bi bi-pencil me-1' aria-hidden='true' />
            Use “Editar estrutura” para alterar títulos, descrições e colunas.
          </small>
        ) : (
          <small className='text-body-secondary'>
            <i className='bi bi-lock me-1' aria-hidden='true' />
            Para editar a estrutura, deixe este projeto sem cartões.
          </small>
        )}
        <small className='text-body-secondary'>
          <i className='bi bi-arrows-move me-1' aria-hidden='true' />
          Dica: arraste e solte os cartões entre qualquer linha e coluna.
        </small>
        <small className='text-body-secondary'>
          <i className='bi bi-keyboard me-1' aria-hidden='true' />
          Atalho: com a célula em foco, pressione Enter ou Espaço para criar um
          cartão.
        </small>
      </div>
    </section>
  );
}
