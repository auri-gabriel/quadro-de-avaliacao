import { type DragEvent, useState } from 'react';
import type { ColumnId, EvaluationRow } from '../types/board';
import type { UpdateActiveProject } from './useBoardWorkspace';

interface DragCardPayload {
  cardId: string;
  fromRowIndex: number;
  fromColumnId: ColumnId;
}

interface DragOverTarget {
  rowIndex: number;
  columnId: ColumnId;
}

export type DropPlacement = 'before' | 'after';

export interface DropIndicatorTarget {
  rowIndex: number;
  columnId: ColumnId;
  cardId: string;
  placement: DropPlacement;
}

interface UseBoardDndParams {
  updateActiveProject: UpdateActiveProject;
}

function moveCardToTarget(
  currentRows: EvaluationRow[],
  payload: DragCardPayload,
  toRowIndex: number,
  toColumnId: ColumnId,
  targetCardId?: string,
  placement: DropPlacement = 'before',
): EvaluationRow[] {
  const nextRows = currentRows.map((row) => ({
    ...row,
    cards: Object.entries(row.cards).reduce<EvaluationRow['cards']>(
      (accumulator, [columnId, cards]) => {
        accumulator[columnId] = [...cards];
        return accumulator;
      },
      {},
    ),
  }));

  const sourceRow = nextRows[payload.fromRowIndex];
  if (!sourceRow) {
    return currentRows;
  }

  const targetRow = nextRows[toRowIndex];
  if (!targetRow) {
    return currentRows;
  }

  const sourceCards = sourceRow.cards[payload.fromColumnId];
  if (!sourceCards) {
    return currentRows;
  }

  const sourceIndex = sourceCards.findIndex(
    (card) => card.id === payload.cardId,
  );
  if (sourceIndex < 0) {
    return currentRows;
  }

  const [cardToMove] = sourceCards.splice(sourceIndex, 1);
  if (!cardToMove) {
    return currentRows;
  }

  const targetCards = targetRow.cards[toColumnId];
  if (!targetCards) {
    return currentRows;
  }

  let insertionIndex = targetCards.length;

  if (targetCardId) {
    const targetIndex = targetCards.findIndex(
      (card) => card.id === targetCardId,
    );
    if (targetIndex >= 0) {
      insertionIndex = placement === 'after' ? targetIndex + 1 : targetIndex;
    }
  }

  const clampedIndex = Math.max(
    0,
    Math.min(insertionIndex, targetCards.length),
  );
  targetCards.splice(clampedIndex, 0, cardToMove);

  return nextRows;
}

function resolveCardDropPlacement(
  event: DragEvent<HTMLElement>,
): DropPlacement {
  const cardBounds = event.currentTarget.getBoundingClientRect();
  const cardMidY = cardBounds.top + cardBounds.height / 2;

  return event.clientY >= cardMidY ? 'after' : 'before';
}

export function useBoardDnd({ updateActiveProject }: UseBoardDndParams) {
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(
    null,
  );
  const [dropIndicatorTarget, setDropIndicatorTarget] =
    useState<DropIndicatorTarget | null>(null);

  const clearDragState = () => {
    setDragOverTarget(null);
    setDropIndicatorTarget(null);
  };

  const handleCardDragStart = (
    event: DragEvent<HTMLElement>,
    fromRowIndex: number,
    fromColumnId: ColumnId,
    cardId: string,
  ) => {
    const payload: DragCardPayload = {
      cardId,
      fromRowIndex,
      fromColumnId,
    };

    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragEnd = () => {
    setDragOverTarget(null);
    setDropIndicatorTarget(null);
  };

  const handleCellDragOver = (
    event: DragEvent<HTMLDivElement>,
    rowIndex: number,
    columnId: ColumnId,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (
      !dragOverTarget ||
      dragOverTarget.rowIndex !== rowIndex ||
      dragOverTarget.columnId !== columnId
    ) {
      setDragOverTarget({ rowIndex, columnId });
    }

    if (dropIndicatorTarget) {
      setDropIndicatorTarget(null);
    }
  };

  const handleCellDrop = (
    event: DragEvent<HTMLDivElement>,
    toRowIndex: number,
    toColumnId: ColumnId,
  ) => {
    event.preventDefault();

    try {
      const raw = event.dataTransfer.getData('application/json');
      if (!raw) {
        return;
      }

      const payload = JSON.parse(raw) as DragCardPayload;
      updateActiveProject((currentProject) => ({
        ...currentProject,
        rows: moveCardToTarget(
          currentProject.rows,
          payload,
          toRowIndex,
          toColumnId,
        ),
      }));
    } catch {
      // Ignore malformed drag payloads
    } finally {
      setDragOverTarget(null);
      setDropIndicatorTarget(null);
    }
  };

  const handleCellDragLeave = (
    event: DragEvent<HTMLDivElement>,
    rowIndex: number,
    columnId: ColumnId,
  ) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      if (
        dragOverTarget &&
        dragOverTarget.rowIndex === rowIndex &&
        dragOverTarget.columnId === columnId
      ) {
        setDragOverTarget(null);
      }

      if (dropIndicatorTarget) {
        setDropIndicatorTarget(null);
      }
    }
  };

  const handleCardDragOver = (
    event: DragEvent<HTMLElement>,
    rowIndex: number,
    columnId: ColumnId,
    targetCardId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';

    if (
      !dragOverTarget ||
      dragOverTarget.rowIndex !== rowIndex ||
      dragOverTarget.columnId !== columnId
    ) {
      setDragOverTarget({ rowIndex, columnId });
    }

    const placement = resolveCardDropPlacement(event);
    setDropIndicatorTarget((currentTarget) => {
      if (
        currentTarget?.rowIndex === rowIndex &&
        currentTarget.columnId === columnId &&
        currentTarget.cardId === targetCardId &&
        currentTarget.placement === placement
      ) {
        return currentTarget;
      }

      return {
        rowIndex,
        columnId,
        cardId: targetCardId,
        placement,
      };
    });
  };

  const handleCardDrop = (
    event: DragEvent<HTMLElement>,
    toRowIndex: number,
    toColumnId: ColumnId,
    targetCardId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const raw = event.dataTransfer.getData('application/json');
      if (!raw) {
        return;
      }

      const payload = JSON.parse(raw) as DragCardPayload;
      const placement = resolveCardDropPlacement(event);
      updateActiveProject((currentProject) => ({
        ...currentProject,
        rows: moveCardToTarget(
          currentProject.rows,
          payload,
          toRowIndex,
          toColumnId,
          targetCardId,
          placement,
        ),
      }));
    } catch {
      // Ignore malformed drag payloads
    } finally {
      setDragOverTarget(null);
      setDropIndicatorTarget(null);
    }
  };

  const handleCardDragLeave = (
    event: DragEvent<HTMLElement>,
    rowIndex: number,
    columnId: ColumnId,
  ) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      if (
        dragOverTarget &&
        dragOverTarget.rowIndex === rowIndex &&
        dragOverTarget.columnId === columnId
      ) {
        setDragOverTarget(null);
      }

      if (
        dropIndicatorTarget &&
        dropIndicatorTarget.rowIndex === rowIndex &&
        dropIndicatorTarget.columnId === columnId
      ) {
        setDropIndicatorTarget(null);
      }
    }
  };

  return {
    dragOverTarget,
    dropIndicatorTarget,
    clearDragState,
    handleCardDragStart,
    handleCardDragEnd,
    handleCellDragOver,
    handleCellDrop,
    handleCellDragLeave,
    handleCardDragOver,
    handleCardDrop,
    handleCardDragLeave,
  };
}
