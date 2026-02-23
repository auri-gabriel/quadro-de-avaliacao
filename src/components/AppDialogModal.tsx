import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { AppDialogOption } from '../hooks/useAppDialog';

interface AppDialogModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  options: AppDialogOption[];
  onSelect: (value: string) => void;
}

export function AppDialogModal({
  isOpen,
  title,
  message,
  options,
  onSelect,
}: AppDialogModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    lastFocusedElementRef.current =
      document.activeElement as HTMLElement | null;

    const frame = window.requestAnimationFrame(() => {
      firstActionRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      lastFocusedElementRef.current?.focus();
    };
  }, [isOpen]);

  const handleModalKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onSelect('cancel');
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements || focusableElements.length === 0) {
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        ref={modalRef}
        className='modal fade show'
        style={{ display: 'block' }}
        tabIndex={-1}
        role='dialog'
        aria-modal='true'
        aria-labelledby='app-dialog-title'
        aria-describedby='app-dialog-message'
        onKeyDown={handleModalKeyDown}
      >
        <div className='modal-dialog modal-dialog-centered' role='document'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title' id='app-dialog-title'>
                {title}
              </h5>
              <button
                type='button'
                className='btn-close'
                aria-label='Fechar'
                onClick={() => onSelect('cancel')}
              />
            </div>
            <div className='modal-body'>
              <p className='mb-0' id='app-dialog-message'>
                {message}
              </p>
            </div>
            <div className='modal-footer'>
              {options.map((option, index) => (
                <button
                  key={option.value}
                  type='button'
                  className={`btn ${option.buttonClassName}`}
                  onClick={() => onSelect(option.value)}
                  ref={index === 0 ? firstActionRef : undefined}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className='modal-backdrop fade show' />
    </>
  );
}
