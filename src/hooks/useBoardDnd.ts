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

interface UseBoardDndParams {
  updateActiveProject: UpdateActiveProject;
}

function moveCardToTarget(
  currentRows: EvaluationRow[],
  payload: DragCardPayload,
  toRowIndex: number,
  toColumnId: ColumnId,
): EvaluationRow[] {
  const sourceRow = currentRows[payload.fromRowIndex];
  if (!sourceRow) {
    return currentRows;
  }

  const cardToMove = sourceRow[payload.fromColumnId].find(
    (card) => card.id === payload.cardId,
  );
  if (!cardToMove) {
    return currentRows;
  }

  if (
    payload.fromRowIndex === toRowIndex &&
    payload.fromColumnId === toColumnId
  ) {
    return currentRows;
  }

  return currentRows.map((row, rowIndex) => {
    const nextRow = { ...row };

    if (rowIndex === payload.fromRowIndex) {
      nextRow[payload.fromColumnId] = row[payload.fromColumnId].filter(
        (card) => card.id !== payload.cardId,
      );
    }

    if (rowIndex === toRowIndex) {
      nextRow[toColumnId] = [...nextRow[toColumnId], cardToMove];
    }

    return nextRow;
  });
}

export function useBoardDnd({ updateActiveProject }: UseBoardDndParams) {
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(
    null,
  );

  const clearDragState = () => {
    setDragOverTarget(null);
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
    }
  };

  return {
    dragOverTarget,
    clearDragState,
    handleCardDragStart,
    handleCardDragEnd,
    handleCellDragOver,
    handleCellDrop,
    handleCellDragLeave,
  };
}
