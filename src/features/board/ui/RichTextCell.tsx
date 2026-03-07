import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
]
  .map((selector) => `${selector}:not([aria-hidden="true"])`)
  .join(',');

interface RichTextCellProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (nextValue: string) => void;
  autoFocus?: boolean;
}

const TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline'],
  [{ list: 'bullet' }, { list: 'ordered' }],
  ['clean'],
];

const FORMATS = ['bold', 'italic', 'underline', 'list', 'bullet'];

export function RichTextCell({
  id,
  label,
  value,
  placeholder,
  onChange,
  autoFocus = false,
}: RichTextCellProps) {
  const quillRef = useRef<ReactQuill | null>(null);

  const moveFocusOutsideEditor = useCallback((direction: 1 | -1) => {
    const quillEditorRoot = quillRef.current?.getEditor()?.root;
    const editorWrapper = quillEditorRoot?.closest(
      '.rich-text-editor',
    ) as HTMLElement | null;

    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((element) => {
      const style = window.getComputedStyle(element);
      return (
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        !element.hasAttribute('disabled')
      );
    });

    const outsideEditorElements = editorWrapper
      ? focusableElements.filter((element) => !editorWrapper.contains(element))
      : focusableElements;

    if (direction === 1) {
      const nextElement = outsideEditorElements.find((element) => {
        if (!editorWrapper) {
          return false;
        }
        return Boolean(
          editorWrapper.compareDocumentPosition(element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        );
      });

      if (nextElement) {
        nextElement.focus();
        return true;
      }

      return false;
    }

    for (let index = outsideEditorElements.length - 1; index >= 0; index -= 1) {
      const element = outsideEditorElements[index];

      if (
        editorWrapper &&
        editorWrapper.compareDocumentPosition(element) &
          Node.DOCUMENT_POSITION_PRECEDING
      ) {
        element.focus();
        return true;
      }
    }

    return false;
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR_OPTIONS,
      keyboard: {
        bindings: {
          tab: {
            key: 9,
            handler: () => !moveFocusOutsideEditor(1),
          },
          shiftTab: {
            key: 9,
            shiftKey: true,
            handler: () => !moveFocusOutsideEditor(-1),
          },
        },
      },
    }),
    [moveFocusOutsideEditor],
  );

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      quillRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [autoFocus]);

  return (
    <div className='rich-text-editor' id={id} aria-label={label}>
      <ReactQuill
        ref={quillRef}
        theme='snow'
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={FORMATS}
      />
    </div>
  );
}
