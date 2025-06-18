import React, { useRef, useEffect } from 'react';

interface AnnotatedTextProps {
    text: string;
    onTextChange: (text: string) => void;
    onCursorPositionChange: (position: number) => void;
}

export const AnnotatedText: React.FC<AnnotatedTextProps> = ({
    text,
    onTextChange,
    onCursorPositionChange
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            const cursorPosition = textarea.selectionStart;
            onCursorPositionChange(cursorPosition);
        }
    }, [text, onCursorPositionChange]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onTextChange(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const newText = text.substring(0, start) + '    ' + text.substring(end);
            onTextChange(newText);
            
            // Встановлюємо курсор після табуляції
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = start + 4;
                    textareaRef.current.selectionEnd = start + 4;
                }
            }, 0);
        }
        if (e.ctrlKey && e.key === 'Backspace') {
            const cursor = e.currentTarget.selectionStart;
            // Регулярка для пошуку анотації у форматі [ТЕКСТ]
            const annotationRegex = /\[[^\]]+\]/g;
            let match;
            let found = false;
            while ((match = annotationRegex.exec(text)) !== null) {
                const start = match.index;
                const end = start + match[0].length;
                if (cursor > start && cursor <= end) {
                    // Видаляємо анотацію
                    const newText = text.slice(0, start) + text.slice(end);
                    onTextChange(newText);
                    // Встановлюємо курсор на місце видаленої анотації
                    setTimeout(() => {
                        if (textareaRef.current) {
                            textareaRef.current.selectionStart = start;
                            textareaRef.current.selectionEnd = start;
                        }
                    }, 0);
                    found = true;
                    break;
                }
            }
            if (found) {
                e.preventDefault();
            }
        }
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        onCursorPositionChange(textarea.selectionStart);
    };

    return (
        <div className="annotated-text">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onSelect={handleSelect}
                placeholder="Введіть або вставте текст тут..."
            />

            <style jsx>{`
                .annotated-text {
                    width: 100%;
                    height: 100%;
                    min-height: 300px;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                textarea {
                    width: 100%;
                    height: 100%;
                    min-height: 300px;
                    padding: 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                    line-height: 1.5;
                    resize: vertical;
                    font-family: 'Courier New', monospace;
                }

                textarea:focus {
                    outline: none;
                    border-color: #4CAF50;
                    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
                }

                textarea::placeholder {
                    color: #999;
                }

                /* Стилі для анотацій */
                .annotation-breathing {
                    color: #8884d8;
                    font-weight: bold;
                }

                .annotation-pause {
                    color: #ff8042;
                    font-weight: bold;
                }

                .annotation-emotion {
                    color: #ffc658;
                    font-weight: bold;
                }

                .annotation-non-verbal {
                    color: #82ca9d;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
}; 