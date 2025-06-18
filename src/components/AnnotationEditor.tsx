import React, { useState, useEffect } from 'react';
import {
    Annotation,
    AnnotationType,
    BreathingType,
    NonVerbalType,
    EmotionType,
    PauseType
} from '../types/annotations';

interface AnnotationEditorProps {
    annotation: Annotation | null;
    onSave: (annotation: Annotation) => void;
    onClose: () => void;
}

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
    annotation,
    onSave,
    onClose
}) => {
    const [editedAnnotation, setEditedAnnotation] = useState<Annotation | null>(null);

    useEffect(() => {
        setEditedAnnotation(annotation);
    }, [annotation]);

    if (!editedAnnotation) return null;

    const handleChange = (field: string, value: any) => {
        setEditedAnnotation(prev => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    };

    const renderTypeSpecificFields = () => {
        switch (editedAnnotation.type) {
            case AnnotationType.BREATHING:
                return (
                    <>
                        <select
                            value={editedAnnotation.breathingType}
                            onChange={e => handleChange('breathingType', e.target.value)}
                        >
                            {Object.values(BreathingType).map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={editedAnnotation.intensity}
                            onChange={e => handleChange('intensity', parseFloat(e.target.value))}
                        />
                    </>
                );

            case AnnotationType.NON_VERBAL:
                return (
                    <>
                        <select
                            value={editedAnnotation.soundType}
                            onChange={e => handleChange('soundType', e.target.value)}
                        >
                            {Object.values(NonVerbalType).map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                        {editedAnnotation.soundType === NonVerbalType.OTHER && (
                            <input
                                type="text"
                                value={editedAnnotation.customLabel || ''}
                                onChange={e => handleChange('customLabel', e.target.value)}
                                placeholder="Опис звуку"
                            />
                        )}
                    </>
                );

            case AnnotationType.EMOTION:
                return (
                    <>
                        <select
                            value={editedAnnotation.emotionType}
                            onChange={e => handleChange('emotionType', e.target.value)}
                        >
                            {Object.values(EmotionType).map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                        <div>
                            <label>Інтенсивність:</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={editedAnnotation.intensity}
                                onChange={e => handleChange('intensity', parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <label>Валентність:</label>
                            <input
                                type="range"
                                min="-1"
                                max="1"
                                step="0.1"
                                value={editedAnnotation.valence}
                                onChange={e => handleChange('valence', parseFloat(e.target.value))}
                            />
                        </div>
                    </>
                );

            case AnnotationType.PAUSE:
                return (
                    <>
                        <select
                            value={editedAnnotation.pauseType}
                            onChange={e => handleChange('pauseType', e.target.value)}
                        >
                            {Object.values(PauseType).map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                        <div>
                            <label>Тривалість (сек):</label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={editedAnnotation.duration}
                                onChange={e => handleChange('duration', parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={editedAnnotation.isFilledPause}
                                    onChange={e => handleChange('isFilledPause', e.target.checked)}
                                />
                                Заповнена пауза (um, uh, etc.)
                            </label>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="annotation-editor">
            <h3>Редагування анотації</h3>
            <div className="editor-form">
                <div>
                    <label>Початок (сек):</label>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={editedAnnotation.startTime}
                        onChange={e => handleChange('startTime', parseFloat(e.target.value))}
                    />
                </div>
                <div>
                    <label>Кінець (сек):</label>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={editedAnnotation.endTime}
                        onChange={e => handleChange('endTime', parseFloat(e.target.value))}
                    />
                </div>
                <div>
                    <label>Впевненість:</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={editedAnnotation.confidence}
                        onChange={e => handleChange('confidence', parseFloat(e.target.value))}
                    />
                </div>
                {renderTypeSpecificFields()}
                <div>
                    <label>Нотатки:</label>
                    <textarea
                        value={editedAnnotation.notes || ''}
                        onChange={e => handleChange('notes', e.target.value)}
                    />
                </div>
                <div className="button-group">
                    <button onClick={() => onSave(editedAnnotation)}>Зберегти</button>
                    <button onClick={onClose}>Скасувати</button>
                </div>
            </div>

            <style jsx>{`
                .annotation-editor {
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .editor-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #444;
                }

                input[type="number"],
                input[type="text"],
                select,
                textarea {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }

                input[type="range"] {
                    width: 100%;
                }

                textarea {
                    min-height: 100px;
                    resize: vertical;
                }

                .button-group {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }

                button {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                button:first-child {
                    background: #4CAF50;
                    color: white;
                }

                button:last-child {
                    background: #f44336;
                    color: white;
                }
            `}</style>
        </div>
    );
}; 