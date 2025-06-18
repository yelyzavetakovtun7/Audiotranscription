import React from 'react';
import { AnnotationType } from '../types/annotations';

interface AnnotationLayerManagerProps {
    selectedLayers: AnnotationType[];
    onLayerToggle: (layer: AnnotationType) => void;
}

const LAYER_LABELS = {
    [AnnotationType.BREATHING]: 'Дихання',
    [AnnotationType.NON_VERBAL]: 'Невербальні звуки',
    [AnnotationType.EMOTION]: 'Емоції',
    [AnnotationType.PAUSE]: 'Паузи'
};

export const AnnotationLayerManager: React.FC<AnnotationLayerManagerProps> = ({
    selectedLayers,
    onLayerToggle
}) => {
    return (
        <div className="annotation-layer-manager">
            <h3>Шари анотацій</h3>
            <div className="layer-toggles">
                {Object.values(AnnotationType).map(layer => (
                    <label key={layer} className="layer-toggle">
                        <input
                            type="checkbox"
                            checked={selectedLayers.includes(layer)}
                            onChange={() => onLayerToggle(layer)}
                        />
                        <span className="layer-label">{LAYER_LABELS[layer]}</span>
                    </label>
                ))}
            </div>

            <style jsx>{`
                .annotation-layer-manager {
                    padding: 1rem;
                    background: #f5f5f5;
                    border-radius: 8px;
                }

                h3 {
                    margin-top: 0;
                    margin-bottom: 1rem;
                    color: #333;
                }

                .layer-toggles {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .layer-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .layer-toggle input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                }

                .layer-label {
                    font-size: 14px;
                    color: #444;
                }
            `}</style>
        </div>
    );
}; 