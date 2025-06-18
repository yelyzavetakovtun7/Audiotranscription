from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel
import json
import os
from datetime import datetime
import logging
import shutil
from fastapi.responses import FileResponse
from pathlib import Path

# Налаштування логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["history"])

# Створюємо директорію для зберігання аудіофайлів
BASE_DIR = Path(__file__).resolve().parent.parent.parent
AUDIO_DIR = BASE_DIR / "audio_files"
HISTORY_FILE = BASE_DIR / "transcription_history.json"

logger.info(f"Base directory: {BASE_DIR}")
logger.info(f"Audio directory: {AUDIO_DIR}")
logger.info(f"History file: {HISTORY_FILE}")

os.makedirs(AUDIO_DIR, exist_ok=True)

class SavedWork(BaseModel):
    id: str
    fileName: str
    date: str
    transcribedText: str
    editedText: str
    segments: List[dict]
    editedSegments: List[dict]

def load_history():
    try:
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
                logger.info(f"Loaded {len(history)} items from history")
                return history
        logger.info("History file not found, creating new one")
        return []
    except Exception as e:
        logger.error(f"Error loading history: {str(e)}")
        return []

def save_history(history):
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
            logger.info(f"Saved {len(history)} items to history")
    except Exception as e:
        logger.error(f"Error saving history: {str(e)}")

@router.get("/")
async def get_history():
    try:
        history = load_history()
        return history
    except Exception as e:
        logger.error(f"Error in get_history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def save_to_history(
    file: UploadFile = File(...),
    work: str = Form(...)
):
    try:
        work_data = json.loads(work)
        logger.info(f"Saving work with ID: {work_data['id']}")
        logger.info(f"Received file: {file.filename}, content type: {file.content_type}")
        
        # Зберігаємо аудіофайл
        file_path = AUDIO_DIR / f"{work_data['id']}_{work_data['fileName']}"
        logger.info(f"Saving audio file to: {file_path}")
        
        # Перевіряємо, чи існує директорія
        if not AUDIO_DIR.exists():
            logger.info(f"Creating audio directory: {AUDIO_DIR}")
            os.makedirs(AUDIO_DIR, exist_ok=True)
        
        # Зберігаємо файл
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info(f"File saved successfully to {file_path}")
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise
        
        # Перевіряємо, чи файл дійсно збережений
        if not file_path.exists():
            raise Exception(f"Failed to save audio file to {file_path}")
        
        file_size = file_path.stat().st_size
        logger.info(f"Audio file saved successfully, size: {file_size} bytes")
        
        if file_size == 0:
            raise Exception("Saved file is empty")
        
        # Зберігаємо метадані
        history = load_history()
        history.append(work_data)
        save_history(history)
        
        return {"message": "Work saved successfully"}
    except Exception as e:
        logger.error(f"Error in save_to_history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{work_id}/audio")
async def get_audio(work_id: str):
    try:
        logger.info(f"Getting audio for work ID: {work_id}")
        history = load_history()
        logger.info(f"Loaded history: {history}")
        
        work = next((w for w in history if w["id"] == work_id), None)
        logger.info(f"Found work: {work}")
        
        if not work:
            logger.error(f"Work not found: {work_id}")
            raise HTTPException(status_code=404, detail="Work not found")
        
        file_path = AUDIO_DIR / f"{work_id}_{work['fileName']}"
        logger.info(f"Looking for audio file at: {file_path}")
        
        if not file_path.exists():
            logger.error(f"Audio file not found: {file_path}")
            # Перевіряємо вміст директорії
            logger.info(f"Contents of {AUDIO_DIR}: {list(AUDIO_DIR.glob('*'))}")
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        file_size = file_path.stat().st_size
        logger.info(f"Audio file size: {file_size} bytes")
        
        if file_size == 0:
            logger.error(f"Audio file is empty: {file_path}")
            raise HTTPException(status_code=500, detail="Audio file is empty")
        
        return FileResponse(
            file_path,
            media_type="audio/mpeg",
            filename=work['fileName']
        )
    except Exception as e:
        logger.error(f"Error in get_audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{work_id}")
async def delete_from_history(work_id: str):
    try:
        logger.info(f"Deleting work with ID: {work_id}")
        history = load_history()
        work = next((w for w in history if w["id"] == work_id), None)
        
        if not work:
            logger.error(f"Work not found: {work_id}")
            raise HTTPException(status_code=404, detail="Work not found")
        
        # Видаляємо аудіофайл
        file_path = AUDIO_DIR / f"{work_id}_{work['fileName']}"
        if file_path.exists():
            logger.info(f"Deleting audio file: {file_path}")
            os.remove(file_path)
        
        # Видаляємо з історії
        history = [w for w in history if w["id"] != work_id]
        save_history(history)
        
        return {"message": "Work deleted successfully"}
    except Exception as e:
        logger.error(f"Error in delete_from_history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 