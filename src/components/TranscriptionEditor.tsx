import React, { useState, useCallback } from 'react';
import { AnnotationSystem } from './AnnotationSystem';
import { AnnotatedText } from './AnnotatedText';

interface TranscriptionEditorProps {
    audioUrl: string;
}

export const TranscriptionEditor: React.FC<TranscriptionEditorProps> = ({
    audioUrl
}) => {
    const [text, setText] = useState<string>('');
    const [cursorPosition, setCursorPosition] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [audioDuration, setAudioDuration] = useState<number>(0);

    const handleTextChange = (newText: string) => {
        setText(newText);
    };

    const handleCursorPositionChange = (position: number) => {
        setCursorPosition(position);
    };

    const handleTimeUpdate = (time: number) => {
        setCurrentTime(time);
    };

    const handleAnnotationInsert = useCallback((annotationText: string) => {
        setText(prev => {
            const before = prev.slice(0, cursorPosition);
            const after = prev.slice(cursorPosition);
            return before + annotationText + after;
        });
    }, [cursorPosition]);

    const handleAudioLoad = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        setAudioDuration(e.currentTarget.duration);
    };

    const handleAudioTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        setCurrentTime(e.currentTarget.currentTime);
    };

    return (
        <div className="transcription-editor">
            <div className="audio-player">
                <audio
                    src={audioUrl}
                    controls
                    onLoadedMetadata={handleAudioLoad}
                    onTimeUpdate={handleAudioTimeUpdate}
                />
            </div>
            
            <div className="editor-container">
                <div className="text-container">
                    <AnnotatedText
                        text={text}
                        onTextChange={handleTextChange}
                        onCursorPositionChange={handleCursorPositionChange}
                    />
                </div>
                
                <div className="annotation-container">
                    <AnnotationSystem
                        audioDuration={audioDuration}
                        currentTime={currentTime}
                        onTimeUpdate={handleTimeUpdate}
                        onAnnotationInsert={handleAnnotationInsert}
                    />
                </div>
            </div>

            <style jsx>{`
                .transcription-editor {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    height: 100vh;
                    padding: 1rem;
                    background: #f9f9f9;
                }

                .audio-player {
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                audio {
                    width: 100%;
                }

                .editor-container {
                    display: flex;
                    gap: 1rem;
                    flex: 1;
                    min-height: 0;
                }

                .text-container {
                    flex: 1;
                    min-width: 0;
                }

                .annotation-container {
                    width: 400px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    overflow: auto;
                }
            `}</style>
        </div>
    );
}; 