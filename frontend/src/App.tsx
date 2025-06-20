import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

interface TranscriptionResponse {
  text: string;
  segments: Array<{
    id: number;
    text: string;
    start: number;
    end: number;
    confidence: number;
    words: Array<{
      word: string;
      start: number;
      end: number;
      confidence: number;
    }>;
  }>;
}

interface SavedWork {
  id: string;
  fileName: string;
  date: string;
  transcribedText: string;
  editedText: string;
  segments: any[];
  editedSegments: any[];
  audioData?: string;
}

// Додаємо інтерфейс для анотацій
interface Annotation {
  type: string;
  html: string;
  position: number;
}

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const AudioPlayer = styled.audio`
  width: 100%;
  margin: 20px 0;
`;

const TextEditor = styled.div`
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-height: 200px;
  margin: 1rem 0;
  line-height: 1.6;
  font-size: 1.1rem;
  white-space: pre-wrap;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 2;

  &[contenteditable="true"] {
    outline: none;
    cursor: text;
  }

  &[contenteditable="true"]:focus {
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }

  /* Стилі для підсвітки активного сегменту */
  .highlight-active {
    background-color: #e3f2fd !important;
    border-radius: 4px;
    transition: background-color 0.3s;
    padding: 0 2px;
    margin: 0 1px;
  }

  /* Стилі для анотацій */
  [data-annotation="breathing"] {
    color: #8884d8;
    font-weight: 500;
    background: rgba(136, 132, 216, 0.1);
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    display: inline-block;
    position: relative;
    z-index: 3;
  }

  [data-annotation="pause"] {
    color: #ff8042;
    font-weight: 500;
    background: rgba(255, 128, 66, 0.1);
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    display: inline-block;
    position: relative;
    z-index: 3;
  }

  [data-annotation="emotion"] {
    color: #ffc658;
    font-weight: 500;
    background: rgba(255, 198, 88, 0.1);
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    display: inline-block;
    position: relative;
    z-index: 3;
  }

  [data-annotation="non_verbal"] {
    color: #82ca9d;
    font-weight: 500;
    background: rgba(130, 202, 157, 0.1);
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    display: inline-block;
    position: relative;
    z-index: 3;
  }
`;

const HighlightedText = styled.span<{ $isActive: boolean; $isEdited: boolean }>`
  background-color: ${props => props.$isActive ? '#e3f2fd' : 'transparent'};
  border-radius: 4px;
  transition: background-color 0.3s;
  padding: 0 2px;
  margin: 0 1px;
  display: inline-block;
  
  ${props => props.$isEdited && css`
    border-bottom: 2px solid #4CAF50;
  `}

  /* Стилі для анотацій в режимі перегляду */
  [data-annotation] {
    display: inline-block;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-weight: 500;
    margin: 0 2px;
  }

  [data-annotation="breathing"] {
    color: #8884d8;
    background: rgba(136, 132, 216, 0.1);
  }

  [data-annotation="pause"] {
    color: #ff8042;
    background: rgba(255, 128, 66, 0.1);
  }

  [data-annotation="emotion"] {
    color: #ffc658;
    background: rgba(255, 198, 88, 0.1);
  }

  [data-annotation="non_verbal"] {
    color: #82ca9d;
    background: rgba(130, 202, 157, 0.1);
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid red;
  border-radius: 4px;
`;

const LoadingMessage = styled.div`
  color: #666;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Button = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 10px 0;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const AnnotationButtonGroup = styled(ButtonGroup)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(245, 245, 245, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 8px 8px 0 0;
  margin: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;

  /* Додаємо відступ знизу для контенту, щоб він не ховався за кнопками */
  & + * {
    margin-bottom: 100px;
  }
`;

const AnnotationButton = styled.button<{ color: string }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: ${props => props.color};
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const FileInput = styled.input`
  margin: 10px 0;
  display: block;
`;

const BackButton = styled(Button)`
  margin-bottom: 20px;
  display: block;
`;

const DownloadButton = styled(Button)`
  background-color: #2196F3;
`;

const CorpusButton = styled(Button)`
  background-color: #9C27B0;
`;

const HistoryContainer = styled.div`
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const HistoryItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const HistoryTitle = styled.h3`
  margin: 0;
  color: #333;
`;

const HistoryDate = styled.span`
  color: #666;
  font-size: 0.9em;
`;

const TopBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 1001;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  padding: 16px 0 8px 0;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  /* Для плавності на мобільних */
  @media (max-width: 600px) {
    padding: 8px 0 4px 0;
    margin-bottom: 12px;
  }
`;

const HeaderBar = styled.div`
  background: #fff;
  padding: 12px 0 8px 0;
  margin-bottom: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 8px 0 4px 0;
    margin-bottom: 4px;
  }
`;

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [editedText, setEditedText] = useState<string>('');
  const [segments, setSegments] = useState<any[]>([]);
  const [editedSegments, setEditedSegments] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [savedWorks, setSavedWorks] = useState<SavedWork[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  // Мапа для швидких анотацій по гарячих клавішах
  const annotationHotkeys: Record<string, string> = {
    '1': 'breathing',
    '2': 'pause',
    '3': 'emotion',
    '4': 'non_verbal',
  };

  // Додаємо useEffect для відновлення роботи при завантаженні
  useEffect(() => {
    const savedWork = localStorage.getItem('restoreWork');
    if (savedWork) {
      const work = JSON.parse(savedWork);
      setTranscribedText(work.transcribedText);
      setEditedText(work.editedText);
      setSegments(work.segments);
      setEditedSegments(work.editedSegments);
      // Видаляємо збережену роботу з localStorage
      localStorage.removeItem('restoreWork');
    }
  }, []);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 2000;
    let pingInterval: NodeJS.Timeout;

    const connectWebSocket = () => {
      console.log('Створення WebSocket з\'єднання...');
      
      // Закриваємо попереднє з'єднання, якщо воно існує
      if (wsRef.current) {
        wsRef.current.close();
      }

      wsRef.current = new WebSocket('ws://localhost:8001/ws');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket з\'єднання встановлено');
        reconnectAttempts = 0; // Скидаємо лічильник спроб при успішному підключенні
        
        // Відправляємо початкове повідомлення
        wsRef.current?.send(JSON.stringify({ type: 'init' }));
        
        // Запускаємо пінг кожні 10 секунд
        pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 10000);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Отримано WebSocket повідомлення:', data);
          
          if (data.status === 'connected') {
            console.log('Підтверджено підключення до сервера');
          } else if (data.status === 'message_received') {
            console.log('Сервер підтвердив отримання повідомлення:', data.data);
          } else if (data.progress !== undefined) {
            console.log('Оновлення прогресу:', data.progress);
            setProgress(data.progress);
          }
        } catch (e) {
          console.error('Помилка парсингу WebSocket повідомлення:', e);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket помилка:', error);
        // Закриваємо з'єднання при помилці
        if (wsRef.current) {
          wsRef.current.close();
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket з\'єднання закрито. Код:', event.code, 'Причина:', event.reason);
        
        // Очищаємо інтервал пінгу
        if (pingInterval) {
          clearInterval(pingInterval);
        }
        
        // Спробуємо перепідключитися, якщо не перевищено ліміт спроб
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`Спроба перепідключення ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, RECONNECT_DELAY);
        } else {
          console.error('Досягнуто максимальну кількість спроб перепідключення');
          // Прибираємо встановлення помилки на сторінці
          // setError('Не вдалося встановити з\'єднання з сервером. Спробуйте перезавантажити сторінку.');
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioFile]);

  // Завантаження збережених робіт при старті
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await axios.get<SavedWork[]>('http://localhost:8001/history');
        setSavedWorks(response.data);
        // Зберігаємо в localStorage як резервну копію
        localStorage.setItem('transcriptionHistory', JSON.stringify(response.data));
      } catch (error) {
        console.error('Error loading history:', error);
        // Якщо не вдалося завантажити з сервера, пробуємо завантажити з localStorage
        const saved = localStorage.getItem('transcriptionHistory');
        if (saved) {
          try {
            const parsedData = JSON.parse(saved);
            setSavedWorks(parsedData);
          } catch (parseError) {
            console.error('Error parsing saved history:', parseError);
            setSavedWorks([]);
          }
        } else {
          setSavedWorks([]);
        }
      }
    };
    loadHistory();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('audio/')) {
        setError('Будь ласка, виберіть аудіо файл');
        return;
      }
      setAudioFile(file);
      setError(null);
      setProgress(0);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      setError('Будь ласка, виберіть аудіо файл');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStartTime(Date.now());
    setProgress(0);

    const formData = new FormData();
    formData.append('file', audioFile);

    try {
      // Перевіряємо стан WebSocket з'єднання
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log('Перепідключення WebSocket...');
        wsRef.current = new WebSocket('ws://localhost:8001/ws');
        
        wsRef.current.onopen = () => {
          console.log('WebSocket з\'єднання відновлено');
          wsRef.current?.send(JSON.stringify({ type: 'init' }));
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Отримано WebSocket повідомлення:', data);
            if (data.progress !== undefined) {
              console.log('Оновлення прогресу:', data.progress);
              setProgress(data.progress);
            }
          } catch (e) {
            console.error('Помилка парсингу WebSocket повідомлення:', e);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket помилка:', error);
          if (wsRef.current) {
            wsRef.current.close();
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('WebSocket з\'єднання закрито. Код:', event.code, 'Причина:', event.reason);
        };
      }

      const response = await axios.post<TranscriptionResponse>('http://localhost:8001/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('Відповідь від сервера:', response.data);
      
      // Розраховуємо впевненість для кожного сегмента
      const segmentsWithConfidence = response.data.segments.map(segment => {
        // Розраховуємо впевненість на основі довжини сегмента та кількості слів
        const segmentDuration = segment.end - segment.start;
        const words = segment.text.split(/\s+/).filter(word => word.length > 0);
        const wordsPerSecond = words.length / segmentDuration;
        
        // Нормалізуємо впевненість (0.5 - 1.0)
        // Чим більше слів на секунду, тим вища впевненість
        const normalizedConfidence = Math.min(Math.max(wordsPerSecond * 0.5, 0.5), 1.0);
        
        return {
          ...segment,
          confidence: normalizedConfidence
        };
      });

      console.log('Сегменти з розрахованою впевненістю:', segmentsWithConfidence.map(s => ({
        text: s.text,
        confidence: s.confidence,
        duration: s.end - s.start,
        words: s.text.split(/\s+/).filter(word => word.length > 0).length
      })));

      setTranscribedText(response.data.text);
      setEditedText(response.data.text);
      setSegments(segmentsWithConfidence);
      setEditedSegments(segmentsWithConfidence);
      setProgress(100);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Виникла помилка при транскрибуванні');
      }
      console.error('Error transcribing audio:', error);
    } finally {
      setIsLoading(false);
      setStartTime(null);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setCurrentTime(currentTime);
    }
  };

  const getElapsedTime = (): string => {
    if (!startTime) return '';
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Додаємо функцію для визначення активного сегмента
  const isSegmentActive = (segment: any, currentTime: number) => {
    // Додаємо невелику затримку перед початком наступного сегмента
    const SEGMENT_OVERLAP = 0.1;
    return currentTime >= segment.start && currentTime < segment.end + SEGMENT_OVERLAP;
  };

  const handleEditorChange = (event: React.FormEvent<HTMLDivElement>) => {
    const newText = event.currentTarget.innerHTML;
      setEditedText(newText);
      
    // Розбиваємо HTML-контент у масив елементів (слова та анотації)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newText;
    
    // Видаляємо всі span з класом highlight-active
    const highlightSpans = tempDiv.querySelectorAll('.highlight-active');
    highlightSpans.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    });

    // Нормалізуємо пробіли в тексті
    const normalizeText = (text: string) => {
      return text.replace(/\s+/g, ' ').trim();
    };

    const elements: string[] = [];
    tempDiv.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Додаємо кожне слово окремо, зберігаючи пробіли
        const text = node.textContent || '';
        const words = text.split(/(\s+)/).filter(Boolean);
        elements.push(...words);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        elements.push((node as HTMLElement).outerHTML);
      }
    });

    // Розбиваємо елементи по сегментах
    let pointer = 0;
    const updatedSegments = editedSegments.map(segment => {
      const segmentText = normalizeText(segment.text);
      const segmentWords = segmentText.split(' ');
      const segmentLength = segmentWords.length;
      let htmlContent = '';
      let wordCount = 0;
      
      while (pointer < elements.length && wordCount < segmentLength) {
        const element = elements[pointer];
        htmlContent += element;
        
        // Рахуємо тільки слова, а не розмітку і не пробіли
        if (!element.startsWith('<') && element.trim()) {
          wordCount++;
        }
        pointer++;
      }
      
      return {
            ...segment,
        htmlContent: htmlContent.trim(),
        isEdited: true
      };
    });

    setEditedSegments(updatedSegments);
  };

  // Змінюємо функцію форматування тексту
  const formatTextWithHighlight = (text: string, isActive: boolean) => {
    if (!isActive) return text;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;

    // Обходимо всі текстові вузли
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToWrap: Text[] = [];
    let currentNode: Text | null;
    
    // Збираємо всі текстові вузли
    while ((currentNode = walker.nextNode() as Text | null)) {
      if (currentNode && 
          currentNode.nodeType === Node.TEXT_NODE && 
          !currentNode.parentElement?.hasAttribute('data-annotation') &&
          !currentNode.parentElement?.classList.contains('highlight-active') &&
          currentNode.textContent?.trim()) {
        nodesToWrap.push(currentNode);
      }
    }

    // Обгортаємо кожен текстовий вузол в span з підсвіткою
    nodesToWrap.forEach(node => {
      const span = document.createElement('span');
      span.className = 'highlight-active';
      node.parentNode?.insertBefore(span, node);
      span.appendChild(node);
    });

    return tempDiv.innerHTML;
  };

  const handleSave = () => {
    if (editorRef.current) {
      // Очищаємо текст від підсвітки
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorRef.current.innerHTML;
      const highlightSpans = tempDiv.querySelectorAll('.highlight-active');
      highlightSpans.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
      });
      const cleanHtml = tempDiv.innerHTML;

      setEditedText(cleanHtml);
      setIsEditing(false);

      // Парсимо HTML-контент у масив елементів (слова та анотації)
      const elements: string[] = [];
      tempDiv.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          // Додаємо кожне слово окремо
          const words = (node.textContent || '').split(/(\s+)/).filter(Boolean);
          elements.push(...words);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          elements.push((node as HTMLElement).outerHTML);
        }
      });

      // Розбиваємо елементи по сегментах
      let pointer = 0;
      const updatedSegments = segments.map((segment) => {
        const segmentWords = segment.text.split(/(\s+)/).filter(Boolean);
        const segmentLength = segmentWords.length;
        let htmlContent = '';
        let count = 0;
        while (pointer < elements.length && count < segmentLength) {
          htmlContent += elements[pointer];
          // Рахуємо тільки слова, а не розмітку
          if (!elements[pointer].startsWith('<')) count++;
          pointer++;
        }
        return {
          ...segment,
          htmlContent,
          isEdited: true
        };
      });

      setEditedSegments(updatedSegments);
    }
  };

  const handleReset = () => {
    setEditedText(transcribedText);
    setEditedSegments(segments);
    setIsEditing(false);
  };

  const handleSegmentClick = (start: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = start;
    }
  };

  // Збереження роботи
  const saveToHistory = async () => {
    if (!audioFile || !transcribedText) return;

    // Створюємо об'єкт без аудіофайлу для localStorage
    const workForLocalStorage: SavedWork = {
      id: Date.now().toString(),
      fileName: audioFile.name,
      date: new Date().toLocaleString(),
      transcribedText,
      editedText,
      segments,
      editedSegments
    };

    // Створюємо FormData для відправки на сервер
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('work', JSON.stringify(workForLocalStorage));

    try {
      // Зберігаємо в базу даних
      await axios.post('http://localhost:8001/history', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      // Оновлюємо локальний стан (без аудіофайлу)
      const updatedWorks = [workForLocalStorage, ...savedWorks];
      setSavedWorks(updatedWorks);
      
      // Зберігаємо в localStorage тільки метадані
      localStorage.setItem('transcriptionHistory', JSON.stringify(updatedWorks));
    } catch (error) {
      console.error('Error saving to history:', error);
      // Якщо не вдалося зберегти в базу, зберігаємо тільки метадані в localStorage
      const updatedWorks = [workForLocalStorage, ...savedWorks];
      setSavedWorks(updatedWorks);
      localStorage.setItem('transcriptionHistory', JSON.stringify(updatedWorks));
    }
  };

  // Відновлення роботи
  const restoreWork = async (work: SavedWork) => {
    try {
      // Отримуємо аудіофайл з сервера
      const response = await axios.get(`http://localhost:8001/history/${work.id}/audio`, {
        responseType: 'blob'
      });
      
      // Створюємо новий файл з отриманих даних
      const blob = response.data as Blob;
      const file = new File([blob], work.fileName, { type: blob.type || 'audio/mpeg' });
      setAudioFile(file);
      
      // Створюємо URL для відтворення
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Відновлюємо текст та сегменти
      setTranscribedText(work.transcribedText);
      setEditedText(work.editedText);
      setSegments(work.segments);
      setEditedSegments(work.editedSegments);
      setShowHistory(false);
    } catch (error) {
      console.error('Error restoring work:', error);
      // Якщо не вдалося отримати аудіофайл, показуємо помилку
      setError('Не вдалося завантажити аудіофайл. Спробуйте ще раз.');
      // Відновлюємо тільки текст
      setTranscribedText(work.transcribedText);
      setEditedText(work.editedText);
      setSegments(work.segments);
      setEditedSegments(work.editedSegments);
      setShowHistory(false);
    }
  };

  // Видалення роботи з історії
  const deleteWork = async (id: string) => {
    try {
      // Видаляємо з бази даних
      await axios.delete(`http://localhost:8001/history/${id}`);
      
      // Оновлюємо локальний стан
      const updatedWorks = savedWorks.filter(work => work.id !== id);
      setSavedWorks(updatedWorks);
      
      // Оновлюємо localStorage
      localStorage.setItem('transcriptionHistory', JSON.stringify(updatedWorks));
    } catch (error) {
      console.error('Error deleting from history:', error);
      // Якщо не вдалося видалити з бази, видаляємо тільки з localStorage
      const updatedWorks = savedWorks.filter(work => work.id !== id);
      setSavedWorks(updatedWorks);
      localStorage.setItem('transcriptionHistory', JSON.stringify(updatedWorks));
    }
  };

  // Повернення до історії
  const handleBackToHistory = () => {
    setShowHistory(true);
    setTranscribedText('');
    setEditedText('');
    setSegments([]);
    setEditedSegments([]);
    setAudioFile(null);
    setAudioUrl(null);
  };

  const handleDownloadText = () => {
    // Очищаємо текст від підсвітки
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editedText;
    const highlightSpans = tempDiv.querySelectorAll('.highlight-active');
    highlightSpans.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    });
    // Беремо чистий текст
    const plainText = tempDiv.innerText;

    // Створюємо Blob з текстом
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    
    // Створюємо URL для скачування
    const url = URL.createObjectURL(blob);
    
    // Створюємо посилання для скачування
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcription_${new Date().toISOString().slice(0, 10)}.txt`;
    
    // Додаємо посилання на сторінку і клікаємо по ньому
    document.body.appendChild(link);
    link.click();
    
    // Видаляємо посилання і очищаємо URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCorpus = () => {
    // Створюємо текст з корпусною розміткою
    let corpusText = '';
    
    // Додаємо заголовок з метаданими
    corpusText += `# Корпусна розмітка\n`;
    corpusText += `# Дата створення: ${new Date().toLocaleString()}\n`;
    corpusText += `# Файл: ${audioFile?.name || 'Невідомий файл'}\n\n`;
    
    // Додаємо сегменти з розміткою
    editedSegments.forEach((segment, index) => {
      // Форматуємо час
      const startTime = new Date(segment.start * 1000).toISOString().substr(11, 12);
      const endTime = new Date(segment.end * 1000).toISOString().substr(11, 12);
      
      // Додаємо розмітку часу
      corpusText += `[${startTime} --> ${endTime}] `;
      
      // Перевіряємо наявність та валідність значення confidence
      const confidence = typeof segment.confidence === 'number' && !isNaN(segment.confidence) 
        ? (segment.confidence * 100).toFixed(1)
        : 'невідомо';
      corpusText += `[впевненість: ${confidence}%] `;
      
      // Додаємо мітку про редагування
      if (segment.isEdited) {
        corpusText += '[відредаговано] ';
      }

      // Отримуємо текст з анотаціями
      if (segment.isEdited && segment.htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = segment.htmlContent;
        
        // Збираємо всі елементи в порядку їх появи
        const elements: Array<{type: 'text' | 'annotation', content: string}> = [];
        const walker = document.createTreeWalker(
          tempDiv,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
          null
        );

        let node: Node | null;
        while ((node = walker.nextNode()) !== null) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim() || '';
            if (text) {
              elements.push({ type: 'text', content: text });
            }
          } else if (
            node.nodeType === Node.ELEMENT_NODE && 
            (node as Element).hasAttribute('data-annotation')
          ) {
            const type = (node as Element).getAttribute('data-annotation');
            let content = '';
            switch (type) {
              case 'breathing':
                content = '[ДИХАННЯ]';
                break;
              case 'pause':
                content = '[ПАУЗА]';
                break;
              case 'emotion':
                content = '[ЕМОЦІЯ]';
                break;
              case 'non_verbal':
                content = '[НЕВЕРБАЛЬНИЙ ЗВУК]';
                break;
            }
            elements.push({ type: 'annotation', content });
          }
        }
        
        corpusText += elements.map(el => el.content).join(' ').trim() + '\n';
      } else {
        corpusText += segment.text.trim() + '\n';
      }
    });
    
    // Створюємо Blob з текстом
    const blob = new Blob([corpusText], { type: 'text/plain;charset=utf-8' });
    
    // Створюємо URL для скачування
    const url = URL.createObjectURL(blob);
    
    // Створюємо посилання для скачування
    const link = document.createElement('a');
    link.href = url;
    link.download = `corpus_${new Date().toISOString().slice(0, 10)}.txt`;
    
    // Додаємо посилання на сторінку і клікаємо по ньому
    document.body.appendChild(link);
    link.click();
    
    // Видаляємо посилання і очищаємо URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAnnotationInsert = (annotationType: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      let annotationText = '';
      switch (annotationType) {
        case 'breathing':
          annotationText = '[ДИХАННЯ]';
          break;
        case 'pause':
          annotationText = '[ПАУЗА]';
          break;
        case 'emotion':
          annotationText = '[ЕМОЦІЯ]';
          break;
        case 'non_verbal':
          annotationText = '[НЕВЕРБАЛЬНИЙ ЗВУК]';
          break;
      }

      if (range) {
        const span = document.createElement('span');
        span.setAttribute('data-annotation', annotationType);
        span.textContent = annotationText;
        
        range.deleteContents();
        range.insertNode(span);
        
        // Встановлюємо курсор після вставленої анотації
        range.setStartAfter(span);
        range.setEndAfter(span);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // Додаємо пробіл після анотації
        const space = document.createTextNode(' ');
        range.insertNode(space);
        range.setStartAfter(space);
        range.setEndAfter(space);
        
        // Оновлюємо текст
        handleEditorChange({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
      }
    }
  };

  // Функції для збереження та відновлення позиції курсора
  function saveSelection(containerEl: HTMLElement | null) {
    if (!containerEl) return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(containerEl);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    return { start, end: start + range.toString().length };
  }

  function restoreSelection(containerEl: HTMLElement | null, savedSel: { start: number; end: number } | null) {
    if (!containerEl || !savedSel) return;
    let charIndex = 0, range = document.createRange();
    range.setStart(containerEl, 0);
    range.collapse(true);
    let nodeStack: Node[] = [containerEl], node: Node | undefined, foundStart = false, stop = false;

    while (!stop && (node = nodeStack.pop())) {
      if (node.nodeType === 3) {
        const nextCharIndex = charIndex + (node.textContent?.length || 0);
        if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
          range.setStart(node, savedSel.start - charIndex);
          foundStart = true;
        }
        if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
          range.setEnd(node, savedSel.end - charIndex);
          stop = true;
        }
        charIndex = nextCharIndex;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  // Додаю функцію для формування цілісного тексту з підсвіткою активного сегмента
  const getFullTextWithHighlight = () => {
    return editedSegments.map((segment, index) => {
      const shouldHighlight = isSegmentActive(segment, currentTime);
      const html = segment.htmlContent || segment.text;
      if (shouldHighlight) {
        // Обгортаємо весь сегмент у підсвітку
        return `<span class="highlight-active">${html}</span>`;
      }
      return html;
    }).join('');
  };

  // Додаємо keydown обробник для редактора
  useEffect(() => {
    if (!isEditing || !editorRef.current) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && annotationHotkeys[e.key]) {
        e.preventDefault();
        handleAnnotationInsert(annotationHotkeys[e.key]);
      }
    };
    const editor = editorRef.current;
    editor.addEventListener('keydown', handleKeyDown);
    return () => {
      editor.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, editorRef.current]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Container>
            <h1>Аудіо в текст</h1>

            {/* Верхній блок з поверненням, вибором файлу та транскрибуванням */}
            <HeaderBar>
              {!showHistory && (
                <BackButton onClick={handleBackToHistory}>
                  ← Повернутися до історії
                </BackButton>
              )}
              <FileInput type="file" accept="audio/*" onChange={handleFileChange} />
              <Button onClick={handleTranscribe} disabled={isLoading || !audioFile}>
                {isLoading ? 'Транскрибування...' : 'Транскрибувати'}
              </Button>
            </HeaderBar>

            {/* Закріплена панель з плеєром і кнопками */}
            {!showHistory && (
              <TopBar>
                {audioUrl && (
                  <AudioPlayer
                    ref={audioRef}
                    controls
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                  />
                )}
                <ButtonGroup>
                  {!isEditing ? (
                    <>
                      <Button onClick={handleEdit}>Редагувати</Button>
                      <Button onClick={saveToHistory}>Зберегти в історію</Button>
                      <DownloadButton onClick={handleDownloadText}>Скачати текст</DownloadButton>
                      <CorpusButton onClick={handleDownloadCorpus}>Скачати з розміткою</CorpusButton>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleSave}>Зберегти</Button>
                      <Button onClick={handleReset}>Скасувати</Button>
                    </>
                  )}
                </ButtonGroup>
              </TopBar>
            )}

            {/* Додаємо відступ для основного контенту */}
            <div style={{ marginTop: 16 }} />

            {showHistory && (
              <HistoryContainer>
                <HistoryTitle>Історія робіт</HistoryTitle>
                {savedWorks.map(work => (
                  <HistoryItem key={work.id}>
                    <div onClick={() => restoreWork(work)}>
                      <strong>{work.fileName}</strong>
                      <HistoryDate> - {work.date}</HistoryDate>
                    </div>
                    <Button onClick={() => deleteWork(work.id)}>Видалити</Button>
                  </HistoryItem>
                ))}
              </HistoryContainer>
            )}

            {/* Відображення тексту тільки якщо не showHistory */}
            {!showHistory && (
              isEditing ? (
                (() => {
                  // Зберігаємо позицію курсора перед ререндером
                  const savedSel = saveSelection(editorRef.current);
                  // Формуємо HTML з підсвіткою
                  const html = editedSegments.map((segment, index) => {
                    const shouldHighlight = isSegmentActive(segment, currentTime);
                    // Спочатку видаляємо всі існуючі підсвітки з сегмента
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = segment.htmlContent || segment.text;
                    const highlightSpans = tempDiv.querySelectorAll('.highlight-active');
                    highlightSpans.forEach(span => {
                      const parent = span.parentNode;
                      if (parent) {
                        while (span.firstChild) {
                          parent.insertBefore(span.firstChild, span);
                        }
                        parent.removeChild(span);
                      }
                    });
                    // Потім додаємо нову підсвітку якщо потрібно
                    return formatTextWithHighlight(tempDiv.innerHTML, shouldHighlight);
                  }).join(' ');
                  // Відновлюємо позицію курсора після ререндеру
                  setTimeout(() => restoreSelection(editorRef.current, savedSel), 0);
                  return (
                  <TextEditor
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorChange}
                    suppressContentEditableWarning
                      dangerouslySetInnerHTML={{ __html: html }}
                  />
                  );
                })()
                ) : (
                  <TextEditor
                    as="div"
                    contentEditable={false}
                    dangerouslySetInnerHTML={{ __html: getFullTextWithHighlight() }}
                  />
              )
            )}

            {/* Блок кнопок анотацій під текстом */}
            {!showHistory && (
              <AnnotationButtonGroup>
                <AnnotationButton
                  color="#8884d8"
                  onClick={() => handleAnnotationInsert('breathing')}
                  disabled={!isEditing}
                >
                  🫁 Дихання
                </AnnotationButton>
                <AnnotationButton
                  color="#ff8042"
                  onClick={() => handleAnnotationInsert('pause')}
                  disabled={!isEditing}
                >
                  ⏸️ Пауза
                </AnnotationButton>
                <AnnotationButton
                  color="#ffc658"
                  onClick={() => handleAnnotationInsert('emotion')}
                  disabled={!isEditing}
                >
                  😊 Емоція
                </AnnotationButton>
                <AnnotationButton
                  color="#82ca9d"
                  onClick={() => handleAnnotationInsert('non_verbal')}
                  disabled={!isEditing}
                >
                  🔊 Невербальний звук
                </AnnotationButton>
              </AnnotationButtonGroup>
            )}
          </Container>
        } />
      </Routes>
    </Router>
  );
}

export default App; 

