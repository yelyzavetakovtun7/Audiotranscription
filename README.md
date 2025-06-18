# Voice to Text System

Система для транскрибування аудіо файлів у текст з можливістю редагування та створення корпусу розмітки.

## Особливості

- Транскрибування аудіо файлів за допомогою Whisper
- Редагування тексту з синхронізацією з аудіо
- Версіонування тексту
- Створення корпусу розмітки
- Експорт у різні формати

## Технології

### Frontend
- React
- Web Audio API
- Canvas API
- Draft.js
- Framer Motion
- Web Workers
- React.memo та useMemo для оптимізації

### Backend
- FastAPI
- Whisper для розпізнавання мови
- PostgreSQL для зберігання даних
- WebSocket для відображення прогресу

## Встановлення

### Backend

```bash
# Створення віртуального середовища
python -m venv venv
source venv/bin/activate  # Linux/Mac
# або
.\venv\Scripts\activate  # Windows

# Встановлення залежностей
pip install -r requirements.txt

# Запуск сервера
uvicorn app.main:app --reload
```

### Frontend

```bash
# Встановлення залежностей
cd frontend
npm install

# Запуск в режимі розробки
npm run dev
```

## Структура проекту

```
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   └── services/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── services/
│   └── package.json
└── diagrams/
    └── *.puml
```

## Використання

1. Завантажте аудіо файл через веб-інтерфейс
2. Дочекайтесь завершення транскрибування
3. Редагуйте текст за необхідності
4. Експортуйте результат у потрібному форматі

## Ліцензія

MIT 