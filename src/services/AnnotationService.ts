import { v4 as uuidv4 } from 'uuid';
import {
    Annotation,
    AnnotationType,
    BreathingAnnotation,
    NonVerbalAnnotation,
    EmotionAnnotation,
    PauseAnnotation,
    BreathingType,
    NonVerbalType,
    EmotionType,
    PauseType
} from '../types/annotations';

type AnnotationData = {
    breathingType?: BreathingType;
    soundType?: NonVerbalType;
    emotionType?: EmotionType;
    pauseType?: PauseType;
    intensity?: number;
    customLabel?: string;
    valence?: number;
    arousal?: number;
    duration?: number;
    isFilledPause?: boolean;
    notes?: string;
    confidence?: number;
};

export class AnnotationService {
    private annotations: Annotation[] = [];

    // Створення нової анотації
    createAnnotation(
        type: AnnotationType,
        startTime: number,
        endTime: number,
        data: AnnotationData
    ): Annotation {
        const baseAnnotation = {
            id: uuidv4(),
            type,
            startTime,
            endTime,
            confidence: data.confidence ?? 1,
            notes: data.notes ?? ''
        };

        let annotation: Annotation;

        switch (type) {
            case AnnotationType.BREATHING:
                annotation = {
                    ...baseAnnotation,
                    type: AnnotationType.BREATHING,
                    breathingType: data.breathingType!,
                    intensity: data.intensity ?? 0.5
                } as BreathingAnnotation;
                break;

            case AnnotationType.NON_VERBAL:
                annotation = {
                    ...baseAnnotation,
                    type: AnnotationType.NON_VERBAL,
                    soundType: data.soundType!,
                    intensity: data.intensity ?? 0.5,
                    customLabel: data.customLabel
                } as NonVerbalAnnotation;
                break;

            case AnnotationType.EMOTION:
                annotation = {
                    ...baseAnnotation,
                    type: AnnotationType.EMOTION,
                    emotionType: data.emotionType!,
                    intensity: data.intensity ?? 0.5,
                    valence: data.valence ?? 0,
                    arousal: data.arousal ?? 0.5
                } as EmotionAnnotation;
                break;

            case AnnotationType.PAUSE:
                annotation = {
                    ...baseAnnotation,
                    type: AnnotationType.PAUSE,
                    pauseType: data.pauseType!,
                    duration: data.duration ?? (endTime - startTime),
                    isFilledPause: data.isFilledPause ?? false
                } as PauseAnnotation;
                break;

            default:
                throw new Error(`Невідомий тип анотації: ${type}`);
        }

        this.annotations.push(annotation);
        return annotation;
    }

    // Отримання всіх анотацій
    getAnnotations(): Annotation[] {
        return [...this.annotations];
    }

    // Отримання анотацій за типом
    getAnnotationsByType(type: AnnotationType): Annotation[] {
        return this.annotations.filter(ann => ann.type === type);
    }

    // Оновлення анотації
    updateAnnotation(id: string, data: Partial<AnnotationData>): Annotation {
        const index = this.annotations.findIndex(ann => ann.id === id);
        if (index === -1) {
            throw new Error(`Анотацію з ID ${id} не знайдено`);
        }

        const oldAnnotation = this.annotations[index];
        const updatedAnnotation = { ...oldAnnotation, ...data };
        this.annotations[index] = updatedAnnotation;

        return updatedAnnotation;
    }

    // Видалення анотації
    deleteAnnotation(id: string): void {
        const index = this.annotations.findIndex(ann => ann.id === id);
        if (index === -1) {
            throw new Error(`Анотацію з ID ${id} не знайдено`);
        }

        this.annotations.splice(index, 1);
    }

    // Експорт анотацій у JSON
    exportAnnotations(): string {
        return JSON.stringify(this.annotations, null, 2);
    }

    // Імпорт анотацій з JSON
    importAnnotations(json: string): void {
        try {
            const annotations = JSON.parse(json);
            if (!Array.isArray(annotations)) {
                throw new Error('Невірний формат JSON');
            }
            this.annotations = annotations;
        } catch (error) {
            throw new Error(`Помилка імпорту анотацій: ${error.message}`);
        }
    }

    // Пошук анотацій за часовим проміжком
    findAnnotationsInTimeRange(startTime: number, endTime: number): Annotation[] {
        return this.annotations.filter(ann =>
            ann.startTime <= endTime && ann.endTime >= startTime
        );
    }

    // Об'єднання перекриваючихся анотацій одного типу
    mergeOverlappingAnnotations(type: AnnotationType): void {
        const typeAnnotations = this.getAnnotationsByType(type);
        const merged: Annotation[] = [];
        
        typeAnnotations.sort((a, b) => a.startTime - b.startTime);

        let current = typeAnnotations[0];
        for (let i = 1; i < typeAnnotations.length; i++) {
            const next = typeAnnotations[i];
            if (current.endTime >= next.startTime) {
                // Об'єднуємо анотації
                current = {
                    ...current,
                    endTime: Math.max(current.endTime, next.endTime),
                    confidence: (current.confidence + next.confidence) / 2,
                    notes: current.notes + ' ' + next.notes
                };
            } else {
                merged.push(current);
                current = next;
            }
        }
        if (current) {
            merged.push(current);
        }

        // Оновлюємо список анотацій
        this.annotations = [
            ...this.annotations.filter(ann => ann.type !== type),
            ...merged
        ];
    }
} 