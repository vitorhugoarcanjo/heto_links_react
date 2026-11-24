"""Gerenciamento de conexões SQLite com suporte a Foreign Keys."""

import sqlite3
from flask import g

from backend.config.settings import settings


def _configurar_conexao(conn: sqlite3.Connection) -> sqlite3.Connection:
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def get_conexao_direct() -> sqlite3.Connection:
    """Abre conexão direta para inicialização de tabelas e scripts CLI."""
    conn = sqlite3.connect(settings.DB_PATH)
    return _configurar_conexao(conn)


def get_db() -> sqlite3.Connection:
    """Retorna a conexão SQLite vinculada ao contexto do request atual."""
    if "db" not in g:
        g.db = get_conexao_direct()
    return g.db


def close_db(e=None):
    """Fecha a conexão SQLite ao final do request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()