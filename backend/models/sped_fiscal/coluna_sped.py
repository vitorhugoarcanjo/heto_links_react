"""DDL da tabela de colunas do SPED Fiscal no SQLite."""


def tabela_sped_fiscal_colunas(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS sped_fiscal_colunas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tabela TEXT NOT NULL CHECK (tabela IN ('MOVIMENTOS', 'MOVIMENTOS_ITENS')),
            coluna TEXT NOT NULL,
            relevante_sped INTEGER NOT NULL DEFAULT 0,
            categoria TEXT NOT NULL DEFAULT '',
            descricao TEXT NOT NULL DEFAULT '',
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (tabela, coluna)
        );
        """
    )
    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_sped_colunas_tabela_relev
        ON sped_fiscal_colunas (tabela, relevante_sped, coluna);
        """
    )