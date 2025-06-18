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

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Подключаем роутер истории
app.include_router(history.router)

# Хранилище активных WebSocket соединений
active_connections: Set[WebSocket] = set()

# Настройка CORS
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
    """Отправляет прогресс всем подключенным клиентам"""
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
    """Получить длительность аудио файла в секундах"""
    import subprocess
    try:
        cmd = ['ffprobe', '-i', audio_path, '-show_entries', 'format=duration', '-v', 'quiet', '-of', 'csv=p=0']
        output = subprocess.check_output(cmd).decode().strip()
        return float(output)
    except:
        return 0

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    logger.info(f"Получен файл: {file.filename}, тип: {file.content_type}")
    
    # Проверяем формат файла
    if not file.content_type.startswith('audio/'):
        logger.error(f"Неверный формат файла: {file.content_type}")
        raise HTTPException(status_code=400, detail="Файл должен быть аудио")

    # Создаем временный файл для аудио
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file_path = temp_file.name
        try:
            logger.info("Чтение содержимого файла...")
            content = await file.read()
            temp_file.write(content)
            logger.info(f"Файл сохранен во временное хранилище: {temp_file_path}")

            # Получаем длительность аудио
            duration = get_duration(temp_file_path)
            logger.info(f"Длительность аудио: {duration:.2f} секунд")

            # Транскрибируем аудио
            logger.info("Начало транскрибации...")
            start_time = time.time()

            # Отправляем начальный прогресс
            await broadcast_progress(0)

            # Запускаем задачу для обновления прогресса
            async def update_progress():
                while True:
                    elapsed = time.time() - start_time
                    # Предполагаем, что транскрибация займет примерно 2x длительность аудио
                    estimated_duration = duration * 2
                    progress = min(int((elapsed / estimated_duration) * 100), 99)
                    await broadcast_progress(progress)
                    if progress >= 99:
                        break
                    await asyncio.sleep(0.1)

            # Запускаем обновление прогресса в фоновом режиме
            progress_task = asyncio.create_task(update_progress())

            # Выполняем транскрибацию
            result = model.transcribe(
                temp_file_path,
                language="uk",  # Указываем украинский язык
                verbose=False
            )

            # Отменяем задачу обновления прогресса
            progress_task.cancel()
            try:
                await progress_task
            except asyncio.CancelledError:
                pass

            # Отправляем финальный прогресс
            await broadcast_progress(100)
            
            logger.info("Транскрибация успешно завершена")
            return {"text": result["text"], "segments": result["segments"]}
        except Exception as e:
            logger.error(f"Ошибка при транскрибации: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Ошибка при транскрибации: {str(e)}")
        finally:
            # Удаляем временный файл
            if os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                    logger.info(f"Временный файл удален: {temp_file_path}")
                except Exception as e:
                    logger.error(f"Ошибка при удалении временного файла: {str(e)}")

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