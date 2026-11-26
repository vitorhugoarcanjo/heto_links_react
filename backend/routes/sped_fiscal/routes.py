"""Endpoints REST para Diagnóstico e Colunas do SPED Fiscal (/api/sped_fiscal)."""

from flask import Blueprint, Response, jsonify, request

from backend.utils.responses import json_erro, json_ok

from .service import (
    carregar_documento,
    diagnosticar_erro,
    editar_coluna,
    excluir_coluna,
    listar_colunas,
    salvar_documento,
)
from .txt_corrigido import codificar_txt, montar_txt_corrigido

sped_fiscal_bp = Blueprint("sped_fiscal", __name__)


@sped_fiscal_bp.get("/colunas")
def get_colunas():
    dados = listar_colunas(
        tabela=request.args.get("tabela", "TODAS"),
        relevancia=request.args.get("relevancia", "TODAS"),
        categoria=request.args.get("categoria", ""),
        busca=request.args.get("busca", ""),
    )
    return json_ok(dados)


@sped_fiscal_bp.post("/colunas/importar")
def post_importar():
    payload = request.get_json(silent=True)
    if not payload:
        return json_erro("JSON inválido ou vazio.", status=400)
    salvo = salvar_documento(payload)
    resumo = {
        "totais": {
            "MOVIMENTOS": len(salvo["tabelas"]["MOVIMENTOS"]),
            "MOVIMENTOS_ITENS": len(salvo["tabelas"]["MOVIMENTOS_ITENS"]),
        }
    }
    return json_ok(resumo, message="JSON importado com sucesso.")


@sped_fiscal_bp.patch("/colunas")
def patch_coluna():
    body = request.get_json(silent=True) or {}
    t = str(body.get("tabela") or "").strip().upper()
    col = str(body.get("coluna") or "").strip()
    if not t or not col:
        return json_erro("Informe 'tabela' e 'coluna'.", status=400)

    atualizada = editar_coluna(
        tabela=t,
        coluna=col,
        relevante_sped=body.get("relevante_sped"),
        categoria=body.get("categoria"),
        descricao=body.get("descricao"),
    )
    if not atualizada:
        return json_erro("Coluna não encontrada.", status=404)

    return json_ok({"coluna": atualizada}, message="Coluna atualizada com sucesso.")


@sped_fiscal_bp.delete("/colunas")
def delete_coluna():
    t = request.args.get("tabela", "").strip().upper()
    col = request.args.get("coluna", "").strip()
    if not t or not col:
        return json_erro("Informe 'tabela' e 'coluna'.", status=400)

    if not excluir_coluna(t, col):
        return json_erro("Coluna não encontrada.", status=404)

    return json_ok(
        {"tabela": t, "coluna": col},
        message="Coluna removida com sucesso.",
    )


@sped_fiscal_bp.post("/diagnosticar")
def post_diagnosticar():
    body = request.get_json(silent=True) or {}
    msg = str(body.get("mensagem_erro") or "").strip()
    reg = str(body.get("registro_sped") or "").strip()
    txt = str(body.get("conteudo_txt") or "")
    erros_lista = body.get("erros_pva") if isinstance(body.get("erros_pva"), list) else []

    if not msg and not erros_lista and not txt.strip():
        return json_erro("Informe ao menos um erro do PVA ou envie/cole um .txt.", status=400)

    try:
        resultado = diagnosticar_erro(
            mensagem_erro=msg,
            registro_sped=reg,
            conteudo_txt=txt,
            erros_pva=erros_lista,
        )
        return json_ok(resultado)
    except ValueError as exc:
        return json_erro(str(exc), status=400)
    except Exception as exc:
        return json_erro(f"Falha ao diagnosticar erro: {exc}", status=500)


@sped_fiscal_bp.post("/gerar_txt")
def post_gerar_txt():
    body = request.get_json(silent=True) or {}
    txt = str(body.get("conteudo_txt") or "")
    correcoes = body.get("correcoes") if isinstance(body.get("correcoes"), list) else []

    if not txt.strip():
        return json_erro("Envie o conteúdo do .txt original.", status=400)
    if not correcoes:
        return json_erro("Selecione ao menos uma correção.", status=400)

    resultado = montar_txt_corrigido(txt, [c for c in correcoes if isinstance(c, dict)])
    if not resultado["aplicadas"]:
        motivos = "; ".join(g["motivo"] for g in resultado["ignoradas"][:3])
        return json_erro(f"Nenhuma correção pôde ser aplicada. {motivos}", status=422)

    dados, codificacao = codificar_txt(resultado["txt"])
    resp = Response(dados, mimetype="text/plain")
    resp.headers["Content-Type"] = f"text/plain; charset={codificacao}"
    resp.headers["Content-Disposition"] = 'attachment; filename="sped_corrigido.txt"'
    return resp


@sped_fiscal_bp.get("/exportar")
def get_exportar():
    return jsonify(carregar_documento())