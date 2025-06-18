# -*- coding: utf-8 -*-
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import whisper
import os
import tempfile
from pydantic import BaseModel
from typing import List, Dict, Any
import logging
from datetime import datetime
import time
import asyncio
from typing import Set
from app.routers import history
from app.db import init_db, AsyncSessionLocal, Transcription, create_transcription

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Підключаємо роутер історії
app.include_router(history.router)

# Сховище активних WebSocket з'єднань
active_connections: Set[WebSocket] = set()

# Налаштування CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("Нове WebSocket з'єднання...")
    try:
        await websocket.accept()
        active_connections.add(websocket)
        logger.info(f"Активних з'єднань: {len(active_connections)}")
        
        # Відправляємо початкове повідомлення про успішне підключення
        try:
            await websocket.send_json({"status": "connected"})
            logger.info("Відправлено початкове повідомлення про підключення")
        except Exception as e:
            logger.error(f"Помилка відправки початкового повідомлення: {str(e)}")
            return
        
        while True:
            try:
                data = await websocket.receive_text()
                logger.info(f"Отримано повідомлення: {data}")
                
                # Відправляємо підтвердження отримання
                await websocket.send_json({"status": "message_received", "data": data})
            except Exception as e:
                logger.error(f"Помилка отримання повідомлення: {str(e)}")
                break
    except Exception as e:
        logger.error(f"Помилка WebSocket: {str(e)}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
            logger.info(f"З'єднання закрито. Залишилось активних: {len(active_connections)}")

async def broadcast_progress(progress: int):
    """Відправляє прогрес всім підключеним клієнтам"""
    logger.info(f"Відправляємо прогрес: {progress}%")
    disconnected = set()
    for connection in active_connections:
        try:
            await connection.send_json({"progress": progress})
            logger.debug(f"Прогрес {progress}% відправлено успішно")
        except Exception as e:
            logger.error(f"Помилка відправки прогресу: {str(e)}")
            disconnected.add(connection)
    
    # Видаляємо відключені з'єднання
    for connection in disconnected:
        active_connections.remove(connection)
        logger.info(f"Видалено відключене з'єднання. Залишилось: {len(active_connections)}")

@app.on_event("startup")
async def startup_event():
    logger.info("Запуск сервера...")
    try:
        global model
        model = whisper.load_model("base")
        logger.info("Модель Whisper успішно завантажена")
        await init_db()  # створення таблиць у БД
        logger.info("Базу даних ініціалізовано")
    except Exception as e:
        logger.error(f"Помилка при завантаженні моделі Whisper: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Зупинка сервера...")
    # Закриваємо всі активні WebSocket з'єднання
    for connection in active_connections:
        try:
            await connection.close()
        except Exception as e:
            logger.error(f"Помилка закриття з'єднання: {str(e)}")
    active_connections.clear()
    logger.info("Всі з'єднання закрито")

class TranscriptionResponse(BaseModel):
    text: str
    segments: List[Dict[str, Any]]

def get_duration(audio_path: str) -> float:
    """Отримати тривалість аудіо файлу в секундах"""
    import subprocess
    try:
        cmd = ['ffprobe', '-i', audio_path, '-show_entries', 'format=duration', '-v', 'quiet', '-of', 'csv=p=0']
        output = subprocess.check_output(cmd).decode().strip()
        return float(output)
    except:
        return 0

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    logger.info(f"Отримано файл: {file.filename}, тип: {file.content_type}")
    
    # Перевіряємо формат файлу
    if not file.content_type.startswith('audio/'):
        logger.error(f"Невірний формат файлу: {file.content_type}")
        raise HTTPException(status_code=400, detail="Файл повинен бути аудіо")

    # Створюємо тимчасовий файл для аудіо
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file_path = temp_file.name
        try:
            logger.info("Читання вмісту файлу...")
            content = await file.read()
            temp_file.write(content)
            logger.info(f"Файл збережено у тимчасове сховище: {temp_file_path}")

            # Отримуємо тривалість аудіо
            duration = get_duration(temp_file_path)
            logger.info(f"Тривалість аудіо: {duration:.2f} секунд")

            # Транскрибуємо аудіо
            logger.info("Початок транскрибування...")
            start_time = time.time()

            # Відправляємо початковий прогрес
            await broadcast_progress(0)

            # Запускаємо задачу для оновлення прогресу
            async def update_progress():
                while True:
                    elapsed = time.time() - start_time
                    # Припускаємо, що транскрибування займе приблизно 2x тривалість аудіо
                    estimated_duration = duration * 2
                    progress = min(int((elapsed / estimated_duration) * 100), 99)
                    await broadcast_progress(progress)
                    if progress >= 99:
                        break
                    await asyncio.sleep(0.1)

            # Запускаємо оновлення прогресу у фоновому режимі
            progress_task = asyncio.create_task(update_progress())

            # Виконуємо транскрибування
            result = model.transcribe(
                temp_file_path,
                language="uk",  # Вказуємо українську мову
                verbose=False
            )

            # Скасовуємо задачу оновлення прогресу
            progress_task.cancel()
            try:
                await progress_task
            except asyncio.CancelledError:
                pass

            # Відправляємо фінальний прогрес
            await broadcast_progress(100)
            
            logger.info("Транскрибування успішно завершено")

            # Зберігаємо результат в "БД"
            transcription_data = {
                "id": str(int(time.time())),  # Використовуємо timestamp як ID
                "fileName": file.filename,
                "date": datetime.utcnow().isoformat(),
                "transcribedText": result["text"],
                "editedText": result["text"],
                "segments": result["segments"],
                "editedSegments": result["segments"]
            }
            await create_transcription(transcription_data)

            return {"text": result["text"], "segments": result["segments"]}
        except Exception as e:
            logger.error(f"Помилка при транскрибуванні: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Помилка при транскрибуванні: {str(e)}")
        finally:
            # Видаляємо тимчасовий файл
            if os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                    logger.info(f"Тимчасовий файл видалено: {temp_file_path}")
                except Exception as e:
                    logger.error(f"Помилка при видаленні тимчасового файлу: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8001,
        ws_ping_interval=20,  # Відправляємо пінг кожні 20 секунд
        ws_ping_timeout=20,   # Чекаємо відповідь на пінг 20 секунд
        ws_max_size=1024 * 1024  # Максимальний розмір повідомлення 1MB
    ) 