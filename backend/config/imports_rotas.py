"""Registro de Blueprints da API."""

from flask import Blueprint

from backend.config.settings import settings
from backend.routes.links.routes import links_bp
from backend.routes.sped_fiscal import sped_fiscal_bp
from backend.routes.preenc_nfe_nfce import preenc_nfe_nfce_bp
from backend.utils.responses import json_ok

config_bp = Blueprint("config", __name__)


@config_bp.get("/settings")
def obter_settings():
    """Expõe título, empresa e versão do settings.py para o footer global do frontend."""
    return json_ok(
        {
            "nome_sistema": settings.TITULO_SISTEMA,
            "empresa": settings.EMPRESA,
            "versao": settings.VERSAO_SISTEMA,
        }
    )


# ===========================================
# ============ REGISTRO ============
# ===========================================


def registrar_blueprints(app):
    """Registra todos os blueprints da aplicação."""

    # ============ CONFIG GLOBAL ============
    app.register_blueprint(config_bp, url_prefix="/api")

    # ============ LINKS ============
    app.register_blueprint(links_bp, url_prefix="/api/links")

    # ============ LINKS ============
    app.register_blueprint(sped_fiscal_bp, url_prefix="/api/sped_fiscal")

    # ============ PREEN NFE E NFCE ============
    app.register_blueprint(preenc_nfe_nfce_bp)

    print("✅ Rotas registradas")