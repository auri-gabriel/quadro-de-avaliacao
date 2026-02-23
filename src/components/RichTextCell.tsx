import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextCellProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (nextValue: string) => void;
  autoFocus?: boolean;
}

const TOOLBAR_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'bullet' }, { list: 'ordered' }],
    ['clean'],
  ],
};

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
        modules={TOOLBAR_MODULES}
        formats={FORMATS}
      />
    </div>
  );
}
