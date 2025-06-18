import React from 'react';
import { AnnotationType } from '../types/annotations';

interface AnnotationQuickButtonsProps {
    onAnnotationAdd: (type: AnnotationType) => void;
    disabled?: boolean;
}

const BUTTON_CONFIG = {
    [AnnotationType.BREATHING]: {
        label: '🫁 Дихання',
        color: '#8884d8'
    },
    [AnnotationType.PAUSE]: {
        label: '⏸️ Пауза',
        color: '#ff8042'
    },
    [AnnotationType.EMOTION]: {
        label: '😊 Емоція',
        color: '#ffc658'
    },
    [AnnotationType.NON_VERBAL]: {
        label: '🔊 Невербальний звук',
        color: '#82ca9d'
    }
};

export const AnnotationQuickButtons: React.FC<AnnotationQuickButtonsProps> = ({
    onAnnotationAdd,
    disabled = false
}) => {
    return (
        <div className="annotation-quick-buttons">
            {Object.entries(BUTTON_CONFIG).map(([type, config]) => (
                <button
                    key={type}
                    onClick={() => onAnnotationAdd(type as AnnotationType)}
                    disabled={disabled}
                    style={{ backgroundColor: config.color }}
                >
                    {config.label}
                </button>
            ))}

            <style jsx>{`
                .annotation-quick-buttons {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f5f5f5;
                    border-radius: 8px;
                    flex-wrap: wrap;
                }

                button {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 4px;
                    color: white;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: transform 0.2s, opacity 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                button:hover {
                    transform: translateY(-2px);
                    opacity: 0.9;
                }

                button:active {
                    transform: translateY(0);
                }

                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
            `}</style>
        </div>
    );
}; 