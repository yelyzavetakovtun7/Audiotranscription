import React, { useState, useEffect } from 'react';
import { AnnotationType } from '../types/annotations';

interface AnnotationQuickButtonsProps {
    onAnnotationAdd: (type: AnnotationType) => void;
    onUndo?: () => void;
    disabled?: boolean;
}

interface Action {
    type: 'annotation';
    annotationType: AnnotationType;
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
    onUndo,
    disabled = false
}) => {
    const [actionHistory, setActionHistory] = useState<Action[]>([]);

    const handleAnnotationAdd = (type: AnnotationType) => {
        onAnnotationAdd(type);
        setActionHistory(prev => [...prev, { type: 'annotation', annotationType: type }]);
    };

    const handleUndo = () => {
        if (actionHistory.length > 0 && onUndo) {
            onUndo();
            setActionHistory(prev => prev.slice(0, -1));
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !disabled) {
                e.preventDefault();
                handleUndo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actionHistory, disabled]);

    return (
        <div className="annotation-quick-buttons-container">
            <div className="annotation-quick-buttons">
                {Object.entries(BUTTON_CONFIG).map(([type, config]) => (
                    <button
                        key={type}
                        onClick={() => handleAnnotationAdd(type as AnnotationType)}
                        disabled={disabled}
                        style={{ backgroundColor: config.color }}
                    >
                        {config.label}
                    </button>
                ))}
                <button
                    onClick={handleUndo}
                    disabled={disabled || actionHistory.length === 0}
                    style={{ backgroundColor: '#666' }}
                    title="Відмінити останню дію (Ctrl+Z)"
                >
                    ↩️ Відмінити
                </button>
            </div>

            <style jsx>{`
                .annotation-quick-buttons-container {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                }

                .annotation-quick-buttons {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f5f5f5;
                    border-radius: 8px;
                    flex-wrap: wrap;
                    max-width: 1200px;
                    margin: 0 auto;
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

                @media (max-width: 768px) {
                    .annotation-quick-buttons {
                        padding: 0.5rem;
                        gap: 0.5rem;
                    }

                    button {
                        padding: 0.5rem 1rem;
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </div>
    );
}; 