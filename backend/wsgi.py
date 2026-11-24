"""Entrada WSGI para execução em produção ou servidores compatíveis."""

from backend.app import create_app

app = create_app()