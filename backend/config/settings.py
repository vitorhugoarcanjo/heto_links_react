"""Configurações globais do Organizador de Links — Hetosoft."""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend
PROJECT_ROOT = BASE_DIR.parent  # .../sites_hetosoft_react

for env_candidate in (PROJECT_ROOT / ".env", BASE_DIR / ".env"):
    if env_candidate.exists():
        load_dotenv(dotenv_path=env_candidate, override=False)

INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = str(INSTANCE_DIR / "meus_links.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

SECRET_KEY = os.getenv("SECRET_KEY", "hetosoft-links-dev-key")
EMPRESA = "Hetosoft Sistemas"
TITULO_SISTEMA = "HETOSOFT • Central de Links"
VERSAO_SISTEMA = "v1.0.0"

GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()
GEMINI_MODEL = (os.getenv("GEMINI_MODEL") or "gemini-2.5-flash").strip()
GEMINI_MODEL_RESERVA = (os.getenv("GEMINI_MODEL_RESERVA") or "gemini-2.5-flash-lite").strip()

_cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
CORS_ORIGINS = [origem.strip() for origem in _cors_raw.split(",") if origem.strip()]


class Config:
    DB_PATH = DB_PATH
    DATABASE_URL = DATABASE_URL
    SECRET_KEY = SECRET_KEY
    EMPRESA = EMPRESA
    TITULO_SISTEMA = TITULO_SISTEMA
    VERSAO_SISTEMA = VERSAO_SISTEMA
    GEMINI_API_KEY = GEMINI_API_KEY
    GEMINI_MODEL = GEMINI_MODEL
    GEMINI_MODEL_RESERVA = GEMINI_MODEL_RESERVA
    CORS_ORIGINS = CORS_ORIGINS


settings = Config()