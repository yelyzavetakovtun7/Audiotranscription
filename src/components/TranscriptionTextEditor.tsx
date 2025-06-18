import React, { useEffect } from 'react';
import { isSegmentActive, formatTextWithHighlight, getFullTextWithHighlight } from '../utils/highlightUtils';
import { saveSelection, restoreSelection } from '../utils/cursorUtils';

interface TranscriptionTextEditorProps {
  editedSegments: any[];
  currentTime: number;
  isEditing: boolean;
  onInput?: (e: React.FormEvent<HTMLDivElement>) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

export const TranscriptionTextEditor: React.FC<TranscriptionTextEditorProps> = ({
  editedSegments,
  currentTime,
  isEditing,
  onInput,
  editorRef
}) => {
  useEffect(() => {
    if (!isEditing || !editorRef.current) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Тут можна додати обробку гарячих клавіш, якщо потрібно
    };
    const editor = editorRef.current;
    editor.addEventListener('keydown', handleKeyDown);
    return () => {
      editor.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, editorRef.current]);

  if (isEditing) {
    // Зберігаємо позицію курсора перед ререндером
    const savedSel = saveSelection(editorRef.current);
    // Формуємо HTML з підсвіткою
    const html = editedSegments.map((segment) => {
      const shouldHighlight = isSegmentActive(segment, currentTime);
      // Видаляємо стару підсвітку
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = segment.htmlContent || segment.text;
      const highlightSpans = tempDiv.querySelectorAll('.highlight-active');
      highlightSpans.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
      });
      // Додаємо нову підсвітку
      return formatTextWithHighlight(tempDiv.innerHTML, shouldHighlight);
    }).join(' ');
    // Відновлюємо позицію курсора після ререндеру
    setTimeout(() => restoreSelection(editorRef.current, savedSel), 0);
    return (
      <div
        ref={editorRef}
        contentEditable
        onInput={onInput}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } else {
    const html = getFullTextWithHighlight(editedSegments, currentTime);
    return (
      <div
        contentEditable={false}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
}; 