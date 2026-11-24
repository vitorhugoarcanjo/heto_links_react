"""Consultas e comandos SQL puros para grupos_links e links."""

import sqlite3


def listar_todos_grupos(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    cur = conn.execute(
        """
        SELECT id, titulo, cor_topo, ordem, criado_em, atualizado_em
        FROM grupos_links
        ORDER BY ordem ASC, id ASC;
        """
    )
    return cur.fetchall()


def buscar_grupo_por_id(conn: sqlite3.Connection, grupo_id: int) -> sqlite3.Row | None:
    cur = conn.execute(
        """
        SELECT id, titulo, cor_topo, ordem, criado_em, atualizado_em
        FROM grupos_links
        WHERE id = ?;
        """,
        (grupo_id,),
    )
    return cur.fetchone()


def obter_proxima_ordem_grupo(conn: sqlite3.Connection) -> int:
    cur = conn.execute("SELECT COALESCE(MAX(ordem), 0) + 1 AS prox FROM grupos_links;")
    return int(cur.fetchone()["prox"])


def inserir_grupo(conn: sqlite3.Connection, titulo: str, cor_topo: str, ordem: int) -> int:
    with conn:
        cur = conn.execute(
            """
            INSERT INTO grupos_links (titulo, cor_topo, ordem)
            VALUES (?, ?, ?);
            """,
            (titulo, cor_topo, ordem),
        )
        return int(cur.lastrowid)


def atualizar_grupo(
    conn: sqlite3.Connection, grupo_id: int, titulo: str, cor_topo: str, ordem: int
) -> None:
    with conn:
        conn.execute(
            """
            UPDATE grupos_links
            SET titulo = ?, cor_topo = ?, ordem = ?, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (titulo, cor_topo, ordem, grupo_id),
        )


def deletar_grupo(conn: sqlite3.Connection, grupo_id: int) -> None:
    with conn:
        conn.execute("DELETE FROM grupos_links WHERE id = ?;", (grupo_id,))


def reordenar_grupos_em_lote(conn: sqlite3.Connection, itens: list[dict]) -> None:
    with conn:
        for item in itens:
            conn.execute(
                """
                UPDATE grupos_links
                SET ordem = ?, atualizado_em = CURRENT_TIMESTAMP
                WHERE id = ?;
                """,
                (item["ordem"], item["id"]),
            )


# ===========================================
# ============ QUERIES DE LINKS =============
# ===========================================


def listar_todos_links(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    cur = conn.execute(
        """
        SELECT id, grupo_id, titulo, url, descricao, ordem, abrir_nova_aba, criado_em, atualizado_em
        FROM links
        ORDER BY ordem ASC, id ASC;
        """
    )
    return cur.fetchall()


def buscar_link_por_id(conn: sqlite3.Connection, link_id: int) -> sqlite3.Row | None:
    cur = conn.execute(
        """
        SELECT id, grupo_id, titulo, url, descricao, ordem, abrir_nova_aba, criado_em, atualizado_em
        FROM links
        WHERE id = ?;
        """,
        (link_id,),
    )
    return cur.fetchone()


def obter_proxima_ordem_link(conn: sqlite3.Connection, grupo_id: int) -> int:
    cur = conn.execute(
        "SELECT COALESCE(MAX(ordem), 0) + 1 AS prox FROM links WHERE grupo_id = ?;",
        (grupo_id,),
    )
    return int(cur.fetchone()["prox"])


def inserir_link(
    conn: sqlite3.Connection,
    grupo_id: int,
    titulo: str,
    url: str,
    descricao: str | None,
    ordem: int,
    abrir_nova_aba: int,
) -> int:
    with conn:
        cur = conn.execute(
            """
            INSERT INTO links (grupo_id, titulo, url, descricao, ordem, abrir_nova_aba)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            (grupo_id, titulo, url, descricao, ordem, abrir_nova_aba),
        )
        return int(cur.lastrowid)


def atualizar_link(
    conn: sqlite3.Connection,
    link_id: int,
    grupo_id: int,
    titulo: str,
    url: str,
    descricao: str | None,
    ordem: int,
    abrir_nova_aba: int,
) -> None:
    with conn:
        conn.execute(
            """
            UPDATE links
            SET grupo_id = ?, titulo = ?, url = ?, descricao = ?,
                ordem = ?, abrir_nova_aba = ?, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (grupo_id, titulo, url, descricao, ordem, abrir_nova_aba, link_id),
        )


def deletar_link(conn: sqlite3.Connection, link_id: int) -> None:
    with conn:
        conn.execute("DELETE FROM links WHERE id = ?;", (link_id,))


def reordenar_links_em_lote(conn: sqlite3.Connection, itens: list[dict]) -> None:
    with conn:
        for item in itens:
            if "grupo_id" in item:
                conn.execute(
                    """
                    UPDATE links
                    SET ordem = ?, grupo_id = ?, atualizado_em = CURRENT_TIMESTAMP
                    WHERE id = ?;
                    """,
                    (item["ordem"], item["grupo_id"], item["id"]),
                )
            else:
                conn.execute(
                    """
                    UPDATE links
                    SET ordem = ?, atualizado_em = CURRENT_TIMESTAMP
                    WHERE id = ?;
                    """,
                    (item["ordem"], item["id"]),
                )