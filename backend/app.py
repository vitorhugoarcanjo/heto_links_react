"""Application Factory do Organizador de Links por Grupo — Hetosoft."""

from pathlib import Path

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from backend.config.imports_rotas import registrar_blueprints  # noqa: E402
from backend.config.imports_tabelas import criar_todas_tabelas  # noqa: E402
from backend.config.settings import settings  # noqa: E402
from backend.utils.database.db import close_db  # noqa: E402

# ===========================================
# ============ FACTORY ============
# ===========================================


def create_app():
    """Application factory — cria e configura o app Flask."""
    flask_app = Flask(__name__)
    flask_app.config["SECRET_KEY"] = settings.SECRET_KEY
    flask_app.config["TITULO_SISTEMA"] = settings.TITULO_SISTEMA
    flask_app.config["VERSAO_SISTEMA"] = settings.VERSAO_SISTEMA

    # ============ CORS ============
    CORS(flask_app, origins=settings.CORS_ORIGINS, supports_credentials=True)

    # ============ BANCO ============
    with flask_app.app_context():
        print("🚀 Inicializando o sistema Hetosoft Links...")
        criar_todas_tabelas()
        print("✅ Sistema inicializado!")

    # ============ TEARDOWN ============
    flask_app.teardown_appcontext(close_db)

    # ============ BLUEPRINTS ============
    registrar_blueprints(flask_app)

    return flask_app


# ===========================================
# ============ MAIN ============
# ===========================================

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)