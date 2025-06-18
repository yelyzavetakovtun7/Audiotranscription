import React, { useCallback, useMemo } from 'react';
import { Annotation, AnnotationType } from '../types/annotations';

interface AnnotationTimelineProps {
    annotations: Annotation[];
    duration: number; // тривалість аудіо в секундах
    currentTime: number;
    onAnnotationClick: (annotation: Annotation) => void;
    height?: number;
    selectedLayers?: AnnotationType[];
}

const COLORS = {
    [AnnotationType.BREATHING]: '#8884d8',
    [AnnotationType.NON_VERBAL]: '#82ca9d',
    [AnnotationType.EMOTION]: '#ffc658',
    [AnnotationType.PAUSE]: '#ff8042'
};

export const AnnotationTimeline: React.FC<AnnotationTimelineProps> = ({
    annotations,
    duration,
    currentTime,
    onAnnotationClick,
    height = 200,
    selectedLayers = Object.values(AnnotationType)
}) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const filteredAnnotations = useMemo(() => {
        return annotations.filter(ann => selectedLayers.includes(ann.type));
    }, [annotations, selectedLayers]);

    const drawTimeline = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Очищаємо канвас
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Малюємо часову шкалу
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(canvas.width, height / 2);
        ctx.strokeStyle = '#ccc';
        ctx.stroke();

        // Малюємо анотації
        filteredAnnotations.forEach(annotation => {
            const startX = (annotation.startTime / duration) * canvas.width;
            const endX = (annotation.endTime / duration) * canvas.width;
            const y = height / 2;

            ctx.beginPath();
            ctx.rect(startX, y - 10, endX - startX, 20);
            ctx.fillStyle = COLORS[annotation.type];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        });

        // Малюємо поточну позицію
        const currentX = (currentTime / duration) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);
        ctx.strokeStyle = '#ff0000';
        ctx.stroke();
    }, [filteredAnnotations, duration, currentTime, height]);

    React.useEffect(() => {
        drawTimeline();
    }, [drawTimeline]);

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const time = (x / canvas.width) * duration;

        // Знаходимо анотацію, на яку клікнули
        const clickedAnnotation = filteredAnnotations.find(
            ann => time >= ann.startTime && time <= ann.endTime
        );

        if (clickedAnnotation) {
            onAnnotationClick(clickedAnnotation);
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={1000}
            height={height}
            onClick={handleCanvasClick}
            style={{ width: '100%', height }}
        />
    );
}; 