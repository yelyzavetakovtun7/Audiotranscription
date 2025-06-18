import React, { useState, useCallback } from 'react';
import { AnnotationType, Annotation } from '../types/annotations';
import { AnnotationTimeline } from './AnnotationTimeline';
import { AnnotationLayerManager } from './AnnotationLayerManager';
import { AnnotationEditor } from './AnnotationEditor';
import { AnnotationQuickButtons } from './AnnotationQuickButtons';
import { AnnotationService } from '../services/AnnotationService';

interface AnnotationSystemProps {
    audioDuration: number;
    currentTime: number;
    onTimeUpdate: (time: number) => void;
    onAnnotationInsert: (text: string) => void;
}

const annotationService = new AnnotationService();

export const AnnotationSystem: React.FC<AnnotationSystemProps> = ({
    audioDuration,
    currentTime,
    onTimeUpdate,
    onAnnotationInsert
}) => {
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selectedLayers, setSelectedLayers] = useState<AnnotationType[]>(
        Object.values(AnnotationType)
    );
    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);

    const handleLayerToggle = (layer: AnnotationType) => {
        setSelectedLayers(prev =>
            prev.includes(layer)
                ? prev.filter(l => l !== layer)
                : [...prev, layer]
        );
    };

    const handleAnnotationClick = (annotation: Annotation) => {
        setSelectedAnnotation(annotation);
    };

    const handleAnnotationSave = (editedAnnotation: Annotation) => {
        setAnnotations(prev =>
            prev.map(ann =>
                ann.id === editedAnnotation.id ? editedAnnotation : ann
            )
        );
        setSelectedAnnotation(null);
    };

    const handleAnnotationClose = () => {
        setSelectedAnnotation(null);
    };

    const getAnnotationText = (type: AnnotationType): string => {
        switch (type) {
            case AnnotationType.BREATHING:
                return '[ДИХАННЯ]';
            case AnnotationType.PAUSE:
                return '[ПАУЗА]';
            case AnnotationType.EMOTION:
                return '[ЕМОЦІЯ]';
            case AnnotationType.NON_VERBAL:
                return '[НЕВЕРБАЛЬНИЙ ЗВУК]';
        }
    };

    const handleQuickAnnotationAdd = useCallback((type: AnnotationType) => {
        const newAnnotation = annotationService.createAnnotation(
            type,
            currentTime,
            currentTime + 1, // За замовчуванням тривалість 1 секунда
            {}
        );
        
        setAnnotations(prev => [...prev, newAnnotation]);
        onAnnotationInsert(getAnnotationText(type));
    }, [currentTime, onAnnotationInsert]);

    return (
        <div className="annotation-system">
            <div className="main-content">
                <AnnotationQuickButtons
                    onAnnotationAdd={handleQuickAnnotationAdd}
                    disabled={currentTime < 0}
                />
                <div className="timeline-container">
                    <AnnotationTimeline
                        annotations={annotations}
                        duration={audioDuration}
                        currentTime={currentTime}
                        onAnnotationClick={handleAnnotationClick}
                        selectedLayers={selectedLayers}
                    />
                </div>
            </div>
            <div className="sidebar">
                <AnnotationLayerManager
                    selectedLayers={selectedLayers}
                    onLayerToggle={handleLayerToggle}
                />
                {selectedAnnotation && (
                    <AnnotationEditor
                        annotation={selectedAnnotation}
                        onSave={handleAnnotationSave}
                        onClose={handleAnnotationClose}
                    />
                )}
            </div>

            <style jsx>{`
                .annotation-system {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    height: 100%;
                }

                .main-content {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .timeline-container {
                    flex: 1;
                    min-height: 0;
                }

                .sidebar {
                    width: 300px;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
            `}</style>
        </div>
    );
}; 