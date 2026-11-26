"""Criação de todas as tabelas do banco SQLite (modelo ad-hoc)."""

from backend.models.links.grupo_link import tabela_grupos_links, tabela_links
from backend.models.sped_fiscal.coluna_sped import tabela_sped_fiscal_colunas
from backend.utils.database.db import get_conexao_direct

# ===========================================
# ============ CRIAR TODAS AS TABELAS ============
# ===========================================


def criar_todas_tabelas():
    """Cria/migra todas as tabelas respeitando a ordem de FK."""
    conexao = get_conexao_direct()
    try:
        cursor = conexao.cursor()

        tabela_grupos_links(cursor)
        tabela_links(cursor)
        tabela_sped_fiscal_colunas(cursor)

        conexao.commit()
        print("✅ Tabelas criadas com sucesso!")
    finally:
        conexao.close()