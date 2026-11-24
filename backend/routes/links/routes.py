"""Endpoints REST para Grupos e Links (/api/links)."""

from flask import Blueprint, request

from backend.routes.links import schemas, service
from backend.utils.exceptions import ErroDominio
from backend.utils.responses import json_erro, json_ok

links_bp = Blueprint("links", __name__)


@links_bp.errorhandler(ErroDominio)
def handle_erro_dominio(err: ErroDominio):
    return json_erro(err.message, status=err.status_code)


# ===========================================
# ============ BOARD COMPLETO ===============
# ===========================================


@links_bp.get("/board")
def get_board():
    board = service.obter_board_completo()
    return json_ok(board)


# ===========================================
# ============ ROTAS DE GRUPOS ==============
# ===========================================


@links_bp.post("/grupos")
def post_grupo():
    dados = schemas.validar_payload_grupo(request.get_json(silent=True))
    grupo = service.criar_grupo(dados)
    return json_ok(grupo, message="Grupo criado com sucesso.", status=201)


@links_bp.put("/grupos/<int:grupo_id>")
def put_grupo(grupo_id: int):
    dados = schemas.validar_payload_grupo(request.get_json(silent=True))
    grupo = service.editar_grupo(grupo_id, dados)
    return json_ok(grupo, message="Grupo atualizado com sucesso.")


@links_bp.delete("/grupos/<int:grupo_id>")
def delete_grupo(grupo_id: int):
    service.excluir_grupo(grupo_id)
    return json_ok(None, message="Grupo removido com sucesso.")


@links_bp.patch("/grupos/reordenar")
def patch_reordenar_grupos():
    itens = schemas.validar_lista_reordenacao(request.get_json(silent=True))
    service.reordenar_grupos(itens)
    return json_ok(None, message="Ordem dos grupos atualizada.")


# ===========================================
# ============ ROTAS DE LINKS ===============
# ===========================================


@links_bp.post("")
def post_link():
    dados = schemas.validar_payload_link(request.get_json(silent=True))
    link = service.criar_link(dados)
    return json_ok(link, message="Link criado com sucesso.", status=201)


@links_bp.put("/<int:link_id>")
def put_link(link_id: int):
    dados = schemas.validar_payload_link(request.get_json(silent=True))
    link = service.editar_link(link_id, dados)
    return json_ok(link, message="Link atualizado com sucesso.")


@links_bp.delete("/<int:link_id>")
def delete_link(link_id: int):
    service.excluir_link(link_id)
    return json_ok(None, message="Link removido com sucesso.")


@links_bp.patch("/reordenar")
def patch_reordenar_links():
    itens = schemas.validar_lista_reordenacao(request.get_json(silent=True))
    service.reordenar_links(itens)
    return json_ok(None, message="Ordem dos links atualizada.")