"""DDL das tabelas de grupos_links e links no SQLite."""


def tabela_grupos_links(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS grupos_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            cor_topo TEXT DEFAULT '#2563eb',
            ordem INTEGER NOT NULL DEFAULT 0,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """
    )


def tabela_links(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            grupo_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            url TEXT NOT NULL,
            descricao TEXT NULL,
            ordem INTEGER NOT NULL DEFAULT 0,
            abrir_nova_aba INTEGER NOT NULL DEFAULT 1,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (grupo_id) REFERENCES grupos_links(id) ON DELETE CASCADE
        );
        """
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_links_grupo_ordem ON links (grupo_id, ordem, id);"
    )