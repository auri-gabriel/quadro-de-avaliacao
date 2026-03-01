import { useState } from 'react';
import { createInitialBoard } from '../lib/boardStorage';
import {
  DEFAULT_POST_IT_COLOR,
  type BoardTemplate,
  type ColumnId,
  type PostItColor,
} from '../types/board';
import type { UpdateActiveProject } from './useBoardWorkspace';

export interface ComposerState {
  rowIndex: number;
  columnId: ColumnId;
  value: string;
}

export interface EditingCardState {
  cardId: string;
  rowIndex: number;
  columnId: ColumnId;
  value: string;
}

interface UseBoardCardsParams {
  updateActiveProject: UpdateActiveProject;
  activeTemplate?: BoardTemplate;
}

function createCardId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function hasMeaningfulContent(value: string): boolean {
  const plain = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  return plain.length > 0;
}

export function useBoardCards({
  updateActiveProject,
  activeTemplate,
}: UseBoardCardsParams) {
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [editingCard, setEditingCard] = useState<EditingCardState | null>(null);

  const clearCardUiState = () => {
    setComposer(null);
    setEditingCard(null);
  };

  const handleOpenComposer = (rowIndex: number, columnId: ColumnId) => {
    setComposer({ rowIndex, columnId, value: '' });
  };

  const handleSaveCard = () => {
    if (!composer || !hasMeaningfulContent(composer.value)) {
      return;
    }

    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: currentProject.rows.map((row, index) =>
        index === composer.rowIndex
          ? {
              ...row,
              cards: {
                ...row.cards,
                [composer.columnId]: [
                  ...(row.cards[composer.columnId] ?? []),
                  {
                    id: createCardId(),
                    content: composer.value,
                    color: DEFAULT_POST_IT_COLOR,
                  },
                ],
              },
            }
          : row,
      ),
    }));

    setComposer(null);
  };

  const handleDeleteCard = (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
  ) => {
    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: currentProject.rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              cards: {
                ...row.cards,
                [columnId]: (row.cards[columnId] ?? []).filter(
                  (card) => card.id !== cardId,
                ),
              },
            }
          : row,
      ),
    }));
  };

  const handleStartEditingCard = (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
    value: string,
  ) => {
    setEditingCard({ rowIndex, columnId, cardId, value });
    setComposer(null);
  };

  const handleSaveEditedCard = () => {
    if (!editingCard || !hasMeaningfulContent(editingCard.value)) {
      return;
    }

    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: currentProject.rows.map((row, index) =>
        index === editingCard.rowIndex
          ? {
              ...row,
              cards: {
                ...row.cards,
                [editingCard.columnId]: (
                  row.cards[editingCard.columnId] ?? []
                ).map((card) =>
                  card.id === editingCard.cardId
                    ? { ...card, content: editingCard.value }
                    : card,
                ),
              },
            }
          : row,
      ),
    }));

    setEditingCard(null);
  };

  const handleChangeCardColor = (
    rowIndex: number,
    columnId: ColumnId,
    cardId: string,
    color: PostItColor,
  ) => {
    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: currentProject.rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              cards: {
                ...row.cards,
                [columnId]: (row.cards[columnId] ?? []).map((card) =>
                  card.id === cardId ? { ...card, color } : card,
                ),
              },
            }
          : row,
      ),
    }));
  };

  const handleResetBoard = () => {
    if (!activeTemplate) {
      return;
    }

    updateActiveProject((currentProject) => ({
      ...currentProject,
      rows: createInitialBoard(activeTemplate),
    }));
    clearCardUiState();
  };

  return {
    composer,
    editingCard,
    setComposer,
    setEditingCard,
    clearCardUiState,
    handleOpenComposer,
    handleSaveCard,
    handleDeleteCard,
    handleStartEditingCard,
    handleSaveEditedCard,
    handleChangeCardColor,
    handleResetBoard,
    hasMeaningfulContent,
  };
}
