export enum AnnotationType {
    BREATHING = 'breathing',
    NON_VERBAL = 'non_verbal',
    EMOTION = 'emotion',
    PAUSE = 'pause'
}

export enum BreathingType {
    INHALE = 'inhale',
    EXHALE = 'exhale',
    DEEP_BREATH = 'deep_breath',
    SHALLOW_BREATH = 'shallow_breath'
}

export enum NonVerbalType {
    LAUGH = 'laugh',
    COUGH = 'cough',
    THROAT_CLEARING = 'throat_clearing',
    BACKGROUND_NOISE = 'background_noise',
    OTHER = 'other'
}

export enum EmotionType {
    HAPPY = 'happy',
    SAD = 'sad',
    ANGRY = 'angry',
    SURPRISED = 'surprised',
    NEUTRAL = 'neutral',
    EXCITED = 'excited',
    WORRIED = 'worried'
}

export enum PauseType {
    SHORT = 'short',        // < 1 second
    MEDIUM = 'medium',      // 1-3 seconds
    LONG = 'long',         // > 3 seconds
    HESITATION = 'hesitation'
}

export interface BaseAnnotation {
    id: string;
    type: AnnotationType;
    startTime: number;
    endTime: number;
    confidence: number;
    notes?: string;
}

export interface BreathingAnnotation extends BaseAnnotation {
    type: AnnotationType.BREATHING;
    breathingType: BreathingType;
    intensity: number; // 0-1
}

export interface NonVerbalAnnotation extends BaseAnnotation {
    type: AnnotationType.NON_VERBAL;
    soundType: NonVerbalType;
    intensity: number; // 0-1
    customLabel?: string; // для OTHER типу
}

export interface EmotionAnnotation extends BaseAnnotation {
    type: AnnotationType.EMOTION;
    emotionType: EmotionType;
    intensity: number; // 0-1
    valence: number; // -1 to 1 (negative to positive)
    arousal: number; // 0-1 (calm to excited)
}

export interface PauseAnnotation extends BaseAnnotation {
    type: AnnotationType.PAUSE;
    pauseType: PauseType;
    duration: number; // in seconds
    isFilledPause: boolean; // true for "um", "uh", etc.
}

export type Annotation = 
    | BreathingAnnotation 
    | NonVerbalAnnotation 
    | EmotionAnnotation 
    | PauseAnnotation; 