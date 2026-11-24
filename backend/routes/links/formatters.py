"""Formatação dos dados de grupos e links para respostas da API."""

import sqlite3


def formatar_link(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "grupo_id": row["grupo_id"],
        "titulo": row["titulo"],
        "url": row["url"],
        "descricao": row["descricao"],
        "ordem": row["ordem"],
        "abrir_nova_aba": bool(row["abrir_nova_aba"]),
    }


def formatar_grupo(row: sqlite3.Row, links: list[dict] | None = None) -> dict:
    return {
        "id": row["id"],
        "titulo": row["titulo"],
        "cor_topo": row["cor_topo"],
        "ordem": row["ordem"],
        "links": links if links is not None else [],
    }


def montar_board(grupos_rows: list[sqlite3.Row], links_rows: list[sqlite3.Row]) -> list[dict]:
    links_por_grupo: dict[int, list[dict]] = {}
    for link_row in links_rows:
        gid = link_row["grupo_id"]
        links_por_grupo.setdefault(gid, []).append(formatar_link(link_row))

    return [
        formatar_grupo(grupo_row, links_por_grupo.get(grupo_row["id"], []))
        for grupo_row in grupos_rows
    ]