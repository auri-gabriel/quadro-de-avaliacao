import { useState } from 'react';

export interface AppDialogOption {
  value: string;
  label: string;
  buttonClassName: string;
}

interface AppDialogState {
  title: string;
  message: string;
  options: AppDialogOption[];
  resolve: (value: string) => void;
}

interface AppDialogRenderState {
  title: string;
  message: string;
  options: AppDialogOption[];
}

export function useAppDialog() {
  const [dialogState, setDialogState] = useState<AppDialogState | null>(null);

  const openDialog = (
    title: string,
    message: string,
    options: AppDialogOption[],
  ): Promise<string> =>
    new Promise((resolve) => {
      setDialogState({
        title,
        message,
        options,
        resolve,
      });
    });

  const closeDialog = (value: string) => {
    setDialogState((currentDialogState) => {
      if (!currentDialogState) {
        return currentDialogState;
      }

      currentDialogState.resolve(value);
      return null;
    });
  };

  const showInfoDialog = (title: string, message: string) =>
    openDialog(title, message, [
      {
        value: 'ok',
        label: 'OK',
        buttonClassName: 'btn-primary',
      },
    ]);

  const modalState: AppDialogRenderState | null = dialogState
    ? {
        title: dialogState.title,
        message: dialogState.message,
        options: dialogState.options,
      }
    : null;

  return {
    modalState,
    openDialog,
    closeDialog,
    showInfoDialog,
  };
}
