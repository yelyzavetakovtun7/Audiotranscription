from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import transcribe, history

app = FastAPI()

# Налаштування CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Підключаємо роутери
app.include_router(transcribe.router)
app.include_router(history.router, prefix="/history", tags=["history"]) 