"""Regras de negócio do domínio de Grupos e Links."""

import re

from backend.routes.links import formatters, queries
from backend.utils.database.db import get_db
from backend.utils.exceptions import ErroValidacao, NaoEncontrado


def _normalizar_url(url: str) -> str:
    limpa = url.strip()
    if not re.match(r"^https?://", limpa, flags=re.IGNORECASE):
        limpa = f"https://{limpa}"
    if "." not in limpa and "localhost" not in limpa:
        raise ErroValidacao("Informe uma URL válida (ex.: https://site.com.br).")
    return limpa


def obter_board_completo() -> list[dict]:
    conn = get_db()
    grupos = queries.listar_todos_grupos(conn)
    links = queries.listar_todos_links(conn)
    return formatters.montar_board(grupos, links)


# ===========================================
# ============ SERVIÇOS DE GRUPOS ===========
# ===========================================


def criar_grupo(dados: dict) -> dict:
    conn = get_db()
    ordem = (
        dados["ordem"]
        if dados["ordem"] is not None
        else queries.obter_proxima_ordem_grupo(conn)
    )
    novo_id = queries.inserir_grupo(conn, dados["titulo"], dados["cor_topo"], ordem)
    row = queries.buscar_grupo_por_id(conn, novo_id)
    return formatters.formatar_grupo(row, [])


def editar_grupo(grupo_id: int, dados: dict) -> dict:
    conn = get_db()
    atual = queries.buscar_grupo_por_id(conn, grupo_id)
    if not atual:
        raise NaoEncontrado("Grupo não encontrado.")

    ordem = dados["ordem"] if dados["ordem"] is not None else atual["ordem"]
    queries.atualizar_grupo(conn, grupo_id, dados["titulo"], dados["cor_topo"], ordem)
    atualizado = queries.buscar_grupo_por_id(conn, grupo_id)
    return formatters.formatar_grupo(atualizado)


def excluir_grupo(grupo_id: int) -> None:
    conn = get_db()
    atual = queries.buscar_grupo_por_id(conn, grupo_id)
    if not atual:
        raise NaoEncontrado("Grupo não encontrado.")
    queries.deletar_grupo(conn, grupo_id)


def reordenar_grupos(itens: list[dict]) -> None:
    conn = get_db()
    queries.reordenar_grupos_em_lote(conn, itens)


# ===========================================
# ============ SERVIÇOS DE LINKS ============
# ===========================================


def criar_link(dados: dict) -> dict:
    conn = get_db()
    grupo = queries.buscar_grupo_por_id(conn, dados["grupo_id"])
    if not grupo:
        raise NaoEncontrado("Grupo de destino não encontrado.")

    url_normalizada = _normalizar_url(dados["url"])
    ordem = (
        dados["ordem"]
        if dados["ordem"] is not None
        else queries.obter_proxima_ordem_link(conn, dados["grupo_id"])
    )

    novo_id = queries.inserir_link(
        conn=conn,
        grupo_id=dados["grupo_id"],
        titulo=dados["titulo"],
        url=url_normalizada,
        descricao=dados["descricao"],
        ordem=ordem,
        abrir_nova_aba=dados["abrir_nova_aba"],
    )
    row = queries.buscar_link_por_id(conn, novo_id)
    return formatters.formatar_link(row)


def editar_link(link_id: int, dados: dict) -> dict:
    conn = get_db()
    atual = queries.buscar_link_por_id(conn, link_id)
    if not atual:
        raise NaoEncontrado("Link não encontrado.")

    grupo = queries.buscar_grupo_por_id(conn, dados["grupo_id"])
    if not grupo:
        raise NaoEncontrado("Grupo de destino não encontrado.")

    url_normalizada = _normalizar_url(dados["url"])
    ordem = dados["ordem"] if dados["ordem"] is not None else atual["ordem"]

    queries.atualizar_link(
        conn=conn,
        link_id=link_id,
        grupo_id=dados["grupo_id"],
        titulo=dados["titulo"],
        url=url_normalizada,
        descricao=dados["descricao"],
        ordem=ordem,
        abrir_nova_aba=dados["abrir_nova_aba"],
    )
    row = queries.buscar_link_por_id(conn, link_id)
    return formatters.formatar_link(row)


def excluir_link(link_id: int) -> None:
    conn = get_db()
    atual = queries.buscar_link_por_id(conn, link_id)
    if not atual:
        raise NaoEncontrado("Link não encontrado.")
    queries.deletar_link(conn, link_id)


def reordenar_links(itens: list[dict]) -> None:
    conn = get_db()
    queries.reordenar_links_em_lote(conn, itens)