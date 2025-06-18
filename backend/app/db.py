from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
import os
import json
from pathlib import Path
import logging

# Налаштування логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Дані для підключення до БД
DB_USER = os.getenv('POSTGRES_USER', 'vlad')
DB_PASS = os.getenv('POSTGRES_PASSWORD', 'temp1234')
DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')
DB_NAME = os.getenv('POSTGRES_DB', 'voicetotext')

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Створення engine
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

# Сесія
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# Базова модель
Base = declarative_base()

# Модель транскрипції
class Transcription(Base):
    __tablename__ = 'transcriptions'
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    segments = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    filename = Column(String(256), nullable=True)

# Функція для створення таблиць
async def init_db():
    logger.info("Ініціалізація бази даних...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("База даних успішно ініціалізована")
    except Exception as e:
        logger.error(f"Помилка ініціалізації бази даних: {str(e)}")
        # Продовжуємо роботу, оскільки ми використовуємо JSON

# Функції для роботи з "БД" (насправді JSON)
HISTORY_FILE = Path(__file__).resolve().parent / "transcription_history.json"

def load_history():
    try:
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
                logger.info(f"Завантажено {len(history)} записів з історії")
                return history
        logger.info("Файл історії не знайдено, створюємо новий")
        return []
    except Exception as e:
        logger.error(f"Помилка завантаження історії: {str(e)}")
        return []

def save_history(history):
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
            logger.info(f"Збережено {len(history)} записів в історію")
    except Exception as e:
        logger.error(f"Помилка збереження історії: {str(e)}")

# Функції для імітації роботи з БД
async def get_all_transcriptions():
    """Отримати всі транскрипції"""
    history = load_history()
    return [Transcription(
        id=i,
        text=item["transcribedText"],
        segments=item["segments"],
        created_at=datetime.fromisoformat(item["date"]),
        filename=item["fileName"]
    ) for i, item in enumerate(history, 1)]

async def get_transcription_by_id(transcription_id: int):
    """Отримати транскрипцію за ID"""
    history = load_history()
    if 0 < transcription_id <= len(history):
        item = history[transcription_id - 1]
        return Transcription(
            id=transcription_id,
            text=item["transcribedText"],
            segments=item["segments"],
            created_at=datetime.fromisoformat(item["date"]),
            filename=item["fileName"]
        )
    return None

async def create_transcription(transcription: dict):
    """Створити нову транскрипцію"""
    history = load_history()
    history.append(transcription)
    save_history(history)
    return Transcription(
        id=len(history),
        text=transcription["transcribedText"],
        segments=transcription["segments"],
        created_at=datetime.fromisoformat(transcription["date"]),
        filename=transcription["fileName"]
    )

async def delete_transcription(transcription_id: int):
    """Видалити транскрипцію"""
    history = load_history()
    if 0 < transcription_id <= len(history):
        history.pop(transcription_id - 1)
        save_history(history)
        return True
    return False 