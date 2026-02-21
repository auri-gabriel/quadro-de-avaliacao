import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextCellProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (nextValue: string) => void;
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
}: RichTextCellProps) {
  return (
    <div className='rich-text-editor' id={id} aria-label={label}>
      <ReactQuill
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
