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
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className='modal fade show'
        style={{ display: 'block' }}
        tabIndex={-1}
        role='dialog'
        aria-modal='true'
      >
        <div className='modal-dialog modal-dialog-centered' role='document'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title'>{title}</h5>
              <button
                type='button'
                className='btn-close'
                aria-label='Fechar'
                onClick={() => onSelect('cancel')}
              />
            </div>
            <div className='modal-body'>
              <p className='mb-0'>{message}</p>
            </div>
            <div className='modal-footer'>
              {options.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  className={`btn ${option.buttonClassName}`}
                  onClick={() => onSelect(option.value)}
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
