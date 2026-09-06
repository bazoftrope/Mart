import { useEffect, useRef } from 'react';
import type Quill from 'quill';
import styles from './RichTextEditor.module.css';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  [{ align: [] }],
  ['clean'],
];

export default function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Введите текст...',
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let quillInstance: Quill | null = null;

    import('quill').then((module) => {
      const QuillClass = module.default || module;
      if (cancelled) return;

      quillInstance = new QuillClass(container, {
        theme: 'snow',
        modules: { toolbar: TOOLBAR },
        placeholder,
      });

      if (value) {
        quillInstance.clipboard.dangerouslyPasteHTML(0, value);
      }

      quillInstance.on('text-change', () => {
        onChangeRef.current(quillInstance?.root.innerHTML || '');
      });

      if (disabled) {
        quillInstance.disable();
      }

      quillRef.current = quillInstance;
    });

    return () => {
      cancelled = true;
      container.innerHTML = '';
      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    if (disabled) {
      quill.disable();
    } else {
      quill.enable();
    }

    if (quill.root.innerHTML !== value) {
      quill.clipboard.dangerouslyPasteHTML(0, value || '');
    }
  }, [value, disabled]);

  return <div ref={containerRef} className={styles.editor} />;
}
