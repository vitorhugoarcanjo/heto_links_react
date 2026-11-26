import json
import os
import re
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from flask import has_request_context

from backend.config.settings import settings
from backend.utils.database.db import get_conexao_direct, get_db

from .schemas import TABELAS_VALIDAS, normalizar_documento, padrao_fiscal
from .txt_corrigido import anotar_itens

RAIZ_PROJETO = Path(__file__).resolve().parents[3]
PASTA_SPED = RAIZ_PROJETO / "backend" / "data" / "sped"
ARQUIVO_SPED_COLUNAS = PASTA_SPED / "sped_colunas.json"
ARQUIVO_FISCAL = PASTA_SPED / "fiscal_colunas.json"

_SCHEMA_DIAGNOSTICO_JSON: dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "resumo_geral": {"type": "STRING"},
        "itens": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "erro": {"type": "STRING"},
                    "registro_alvo": {"type": "STRING"},
                    "significado": {"type": "STRING"},
                    "colunas_movimentos": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "colunas_itens": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "onde_procurar": {"type": "STRING"},
                    "sugestao_ajuste_txt": {"type": "STRING"},
                    "numero_linha": {"type": "INTEGER"},
                    "linha_txt_original": {"type": "STRING"},
                    "linha_txt_sugerida": {"type": "STRING"},
                },
                "required": [
                    "erro",
                    "registro_alvo",
                    "significado",
                    "colunas_movimentos",
                    "colunas_itens",
                    "onde_procurar",
                    "sugestao_ajuste_txt",
                    "numero_linha",
                    "linha_txt_original",
                    "linha_txt_sugerida",
                ],
            },
        },
    },
    "required": ["resumo_geral", "itens"],
}


def _obter_gemini_api_key() -> str:
    return (getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY") or "").strip()


def _obter_modelos_gemini() -> list[str]:
    principal = (
        getattr(settings, "GEMINI_MODEL", "")
        or os.getenv("GEMINI_MODEL")
        or "gemini-2.5-flash"
    ).strip()
    reserva = (
        getattr(settings, "GEMINI_MODEL_RESERVA", "")
        or os.getenv("GEMINI_MODEL_RESERVA")
        or "gemini-2.5-flash-lite"
    ).strip()
    return list(dict.fromkeys([m for m in (principal, reserva) if m]))


@contextmanager
def _conexao_sped():
    if has_request_context():
        yield get_db()
    else:
        conn = get_conexao_direct()
        try:
            yield conn
        finally:
            conn.close()


def _carregar_json_seed() -> dict[str, Any] | None:
    for caminho in (ARQUIVO_SPED_COLUNAS, ARQUIVO_FISCAL):
        if caminho.exists():
            bruto = json.loads(caminho.read_text(encoding="utf-8"))
            return normalizar_documento(bruto)
    return None


def _garantir_seed_sqlite(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    total = cur.execute("SELECT COUNT(*) FROM sped_fiscal_colunas").fetchone()[0]
    if total > 0:
        return

    doc_seed = _carregar_json_seed() or padrao_fiscal()
    for tabela in TABELAS_VALIDAS:
        for item in doc_seed["tabelas"].get(tabela, []):
            cur.execute(
                """
                INSERT OR IGNORE INTO sped_fiscal_colunas
                    (tabela, coluna, relevante_sped, categoria, descricao)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    tabela,
                    item["coluna"],
                    1 if item.get("relevante_sped") else 0,
                    item.get("categoria", ""),
                    item.get("descricao", ""),
                ),
            )
    conn.commit()


def carregar_documento() -> dict[str, Any]:
    with _conexao_sped() as conn:
        _garantir_seed_sqlite(conn)
        rows = conn.execute(
            """
            SELECT tabela, coluna, relevante_sped, categoria, descricao
            FROM sped_fiscal_colunas
            ORDER BY id ASC
            """
        ).fetchall()

    tabelas: dict[str, list[dict[str, Any]]] = {t: [] for t in TABELAS_VALIDAS}
    for r in rows:
        t = r["tabela"]
        if t in tabelas:
            tabelas[t].append(
                {
                    "coluna": r["coluna"],
                    "relevante_sped": bool(r["relevante_sped"]),
                    "categoria": r["categoria"] or "",
                    "descricao": r["descricao"] or "",
                }
            )
    return normalizar_documento({"tabelas": tabelas})


def salvar_documento(payload: Any) -> dict[str, Any]:
    limpo = normalizar_documento(payload)
    with _conexao_sped() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM sped_fiscal_colunas")
        for tabela in TABELAS_VALIDAS:
            for item in limpo["tabelas"].get(tabela, []):
                cur.execute(
                    """
                    INSERT INTO sped_fiscal_colunas
                        (tabela, coluna, relevante_sped, categoria, descricao)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        tabela,
                        item["coluna"],
                        1 if item.get("relevante_sped") else 0,
                        item.get("categoria", ""),
                        item.get("descricao", ""),
                    ),
                )
        conn.commit()
    return carregar_documento()


def listar_colunas(
    tabela: str = "TODAS",
    relevancia: str = "TODAS",
    categoria: str = "",
    busca: str = "",
) -> dict[str, Any]:
    doc = carregar_documento()
    tabelas = doc["tabelas"]
    alvos = list(TABELAS_VALIDAS) if tabela.upper() in ("", "TODAS") else [tabela.upper()]

    categorias: set[str] = set()
    for t in TABELAS_VALIDAS:
        for c in tabelas.get(t, []):
            if c.get("categoria"):
                categorias.add(c["categoria"])

    filtradas: list[dict[str, Any]] = []
    termo = busca.strip().lower()
    cat_filtro = categoria.strip().lower()

    for t in alvos:
        for c in tabelas.get(t, []):
            if relevancia.upper() == "RELEVANTES" and not c["relevante_sped"]:
                continue
            if relevancia.upper() == "NAO_RELEVANTES" and c["relevante_sped"]:
                continue
            if cat_filtro and cat_filtro not in c["categoria"].lower():
                continue
            if termo and not (
                termo in c["coluna"].lower()
                or termo in c["categoria"].lower()
                or termo in c["descricao"].lower()
                or termo in t.lower()
            ):
                continue
            filtradas.append({"tabela": t, **c})

    return {
        "totais": {
            "MOVIMENTOS": len(tabelas["MOVIMENTOS"]),
            "MOVIMENTOS_ITENS": len(tabelas["MOVIMENTOS_ITENS"]),
            "relevantes_movimentos": sum(1 for c in tabelas["MOVIMENTOS"] if c["relevante_sped"]),
            "relevantes_itens": sum(1 for c in tabelas["MOVIMENTOS_ITENS"] if c["relevante_sped"]),
            "filtradas": len(filtradas),
        },
        "categorias": sorted(categorias),
        "colunas": filtradas,
    }


def editar_coluna(
    tabela: str,
    coluna: str,
    relevante_sped: bool | None = None,
    categoria: str | None = None,
    descricao: str | None = None,
) -> dict[str, Any] | None:
    t = tabela.strip().upper()
    if t not in TABELAS_VALIDAS:
        return None
    col_limpa = coluna.strip()

    with _conexao_sped() as conn:
        _garantir_seed_sqlite(conn)
        atual = conn.execute(
            """
            SELECT tabela, coluna, relevante_sped, categoria, descricao
            FROM sped_fiscal_colunas
            WHERE tabela = ? AND LOWER(coluna) = LOWER(?)
            """,
            (t, col_limpa),
        ).fetchone()
        if not atual:
            return None

        novo_rel = atual["relevante_sped"] if relevante_sped is None else (1 if relevante_sped else 0)
        nova_cat = atual["categoria"] if categoria is None else categoria.strip()
        nova_desc = atual["descricao"] if descricao is None else descricao.strip()

        conn.execute(
            """
            UPDATE sped_fiscal_colunas
            SET relevante_sped = ?, categoria = ?, descricao = ?, atualizado_em = CURRENT_TIMESTAMP
            WHERE tabela = ? AND LOWER(coluna) = LOWER(?)
            """,
            (novo_rel, nova_cat, nova_desc, t, col_limpa),
        )
        conn.commit()

        row = conn.execute(
            """
            SELECT tabela, coluna, relevante_sped, categoria, descricao
            FROM sped_fiscal_colunas
            WHERE tabela = ? AND LOWER(coluna) = LOWER(?)
            """,
            (t, col_limpa),
        ).fetchone()

    return {
        "tabela": row["tabela"],
        "coluna": row["coluna"],
        "relevante_sped": bool(row["relevante_sped"]),
        "categoria": row["categoria"] or "",
        "descricao": row["descricao"] or "",
    }


def excluir_coluna(tabela: str, coluna: str) -> bool:
    t = tabela.strip().upper()
    if t not in TABELAS_VALIDAS:
        return False
    with _conexao_sped() as conn:
        _garantir_seed_sqlite(conn)
        cur = conn.execute(
            "DELETE FROM sped_fiscal_colunas WHERE tabela = ? AND LOWER(coluna) = LOWER(?)",
            (t, coluna.strip()),
        )
        conn.commit()
        return cur.rowcount > 0


def _contexto_colunas(limite: int = 120) -> dict[str, list[dict[str, Any]]]:
    doc = carregar_documento()
    ctx: dict[str, list[dict[str, Any]]] = {}
    for t in TABELAS_VALIDAS:
        todos = doc["tabelas"].get(t, [])
        relevantes = [c for c in todos if c.get("relevante_sped")]
        base = relevantes if relevantes else todos
        base_ordenada = sorted(base, key=lambda c: (0 if c.get("descricao") else 1, c["coluna"]))
        ctx[t] = [
            {
                "coluna": c["coluna"],
                "categoria": c.get("categoria", ""),
                "descricao": c.get("descricao", ""),
                "relevante_sped": bool(c.get("relevante_sped", False)),
            }
            for c in base_ordenada[:limite]
        ]
    return ctx


def _extrair_trechos_txt(
    conteudo_txt: str,
    texto_erros: str = "",
    registro_sped: str = "",
    max_linhas: int = 250,
) -> list[dict[str, Any]]:
    if not conteudo_txt.strip():
        return []

    linhas = conteudo_txt.splitlines()
    codigos_reg = set(
        re.findall(r"\b([0CDEFGH19][0-9A-Z]{3})\b", f"{texto_erros} {registro_sped}".upper())
    )
    chaves_ou_codigos = set(re.findall(r"\b\d{6,44}\b", f"{texto_erros} {registro_sped}"))
    palavras_chave = [
        p.lower()
        for p in re.findall(r"[A-Za-z0-9_]{4,}", texto_erros)
        if p.lower()
        not in ("erro", "linha", "campo", "registro", "valor", "sped", "invalido", "inválido")
    ]

    selecionadas: list[dict[str, Any]] = []
    for idx, linha in enumerate(linhas, start=1):
        limpa = linha.strip()
        if not limpa:
            continue
        partes = limpa.strip("|").split("|")
        reg_atual = partes[0].upper() if partes else ""
        bate_reg = reg_atual in codigos_reg if codigos_reg else False
        bate_trecho = bool(registro_sped.strip() and registro_sped.strip() in limpa)
        bate_codigo = any(c in limpa for c in chaves_ou_codigos) if chaves_ou_codigos else False
        bate_palavra = (
            any(k in limpa.lower() for k in palavras_chave[:12])
            if (not codigos_reg and not chaves_ou_codigos and palavras_chave)
            else False
        )

        if bate_reg or bate_trecho or bate_codigo or bate_palavra:
            selecionadas.append({"linha": idx, "registro": reg_atual, "conteudo": limpa})
            if len(selecionadas) >= max_linhas:
                break

    if not selecionadas:
        for idx, linha in enumerate(linhas[:max_linhas], start=1):
            if linha.strip():
                partes = linha.strip("|").split("|")
                selecionadas.append(
                    {
                        "linha": idx,
                        "registro": partes[0].upper() if partes else "",
                        "conteudo": linha.strip(),
                    }
                )

    return selecionadas


def _chamar_gemini_diagnostico(prompt: str) -> tuple[str, str]:
    api_key = _obter_gemini_api_key()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY não configurada no ambiente.")

    modelos = _obter_modelos_gemini()

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=60_000))
    ultimo_erro: Exception | None = None

    for rodada in range(2):
        for modelo_ativo in modelos:
            try:
                t0 = time.perf_counter()
                response = client.models.generate_content(
                    model=modelo_ativo,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        max_output_tokens=8192,
                        response_mime_type="application/json",
                        response_schema=_SCHEMA_DIAGNOSTICO_JSON,
                    ),
                )
                u = getattr(response, "usage_metadata", None)
                if u:
                    print(
                        f"[SPED_FISCAL][GEMINI:{modelo_ativo}] {time.perf_counter()-t0:.1f}s | "
                        f"entrada={getattr(u, 'prompt_token_count', None)} "
                        f"saida={getattr(u, 'candidates_token_count', None)}",
                        flush=True,
                    )
                texto = (getattr(response, "text", "") or "").strip()
                if texto:
                    return texto, modelo_ativo
                raise RuntimeError("Resposta vazia da API Gemini.")
            except Exception as exc:
                ultimo_erro = exc
                msg = str(exc).lower()
                transitorio = any(
                    s in msg
                    for s in (
                        "503",
                        "unavailable",
                        "high demand",
                        "429",
                        "resource_exhausted",
                        "timeout",
                        "deadline",
                    )
                )
                print(
                    f"[SPED_FISCAL][TENTATIVA_FALHOU:{modelo_ativo}:r{rodada+1}] {exc}",
                    flush=True,
                )
                if not transitorio:
                    raise RuntimeError(f"Falha na API Gemini: {ultimo_erro}") from ultimo_erro

        if rodada == 0:
            time.sleep(1.5)

    raise RuntimeError(f"Falha na API Gemini: {ultimo_erro}") from ultimo_erro


def diagnosticar_erro(
    mensagem_erro: str = "",
    registro_sped: str = "",
    conteudo_txt: str = "",
    erros_pva: list[str] | None = None,
) -> dict[str, Any]:
    lista_erros: list[str] = []
    for raw in (erros_pva or []):
        for linha in str(raw).splitlines():
            limpa = linha.strip()
            if limpa and limpa not in lista_erros:
                lista_erros.append(limpa)

    for linha in str(mensagem_erro or "").splitlines():
        limpa = linha.strip()
        if limpa and limpa not in lista_erros:
            lista_erros.insert(0, limpa)

    if not lista_erros and not conteudo_txt.strip():
        raise ValueError(
            "Informe ao menos um erro/mensagem do PVA ou cole/envie um trecho do arquivo .txt."
        )

    auto_varredura = len(lista_erros) == 0
    if auto_varredura:
        lista_erros = [
            "Varredura automática de inconsistências, duplicidades e pontos críticos no .txt enviado"
        ]

    texto_erros_unificado = "\n".join(f"- {e}" for e in lista_erros)
    ctx = _contexto_colunas()
    qtd_mov = len(ctx["MOVIMENTOS"])
    qtd_itens = len(ctx["MOVIMENTOS_ITENS"])
    trechos_txt = _extrair_trechos_txt(conteudo_txt, texto_erros_unificado, registro_sped)

    prompt = (
        "Você é especialista em SPED Fiscal (EFD ICMS/IPI) e análise de movimentos/itens de notas fiscais.\n"
        "Analise TODOS os erros/linhas listados em ERROS / PONTOS DO PVA e os trechos do .txt.\n"
        "Para CADA erro informado, gere um item em 'itens' (não pule nem resuma vários erros em um só).\n"
        "Use as colunas fornecidas de MOVIMENTOS e MOVIMENTOS_ITENS para apontar identificadores "
        "(ex.: ID do movimento, chave de acesso, CFOP, CST, valores) e onde procurar.\n"
        "Não invente colunas que não existam na lista fornecida.\n\n"
        "REGRAS PARA A CORREÇÃO NO .TXT:\n"
        "- 'linha_txt_original' deve ser a cópia EXATA, caractere por caractere, do campo 'conteudo' "
        "de uma das linhas em TRECHOS DO .TXT, e 'numero_linha' o valor do campo 'linha' dessa linha.\n"
        "- 'linha_txt_sugerida' deve ser a mesma linha com SOMENTE os campos necessários alterados: "
        "mesmo registro, mesma quantidade de campos, começando e terminando com '|'.\n"
        "- Se a correção exigir ajustar dados no sistema, incluir/excluir linhas, ou você não tiver "
        "certeza do valor correto, deixe 'linha_txt_original' e 'linha_txt_sugerida' vazias e "
        "'numero_linha' = 0, explicando em 'sugestao_ajuste_txt'. Nunca invente valores fiscais.\n\n"
        f"MODO_VARREDURA_SEM_ERROS_INFORMADOS: {auto_varredura}\n"
        f"QUANTIDADE_DE_ERROS_INFORMADOS: {len(lista_erros)}\n"
        f"ERROS / PONTOS DO PVA:\n{texto_erros_unificado}\n\n"
        f"REGISTRO / FILTRO INFORMADO:\n{registro_sped.strip() or 'Não informado'}\n\n"
        f"TRECHOS DO .TXT:\n{json.dumps(trechos_txt, ensure_ascii=False)}\n\n"
        f"COLUNAS DISPONÍVEIS (MOVIMENTOS E MOVIMENTOS_ITENS):\n{json.dumps(ctx, ensure_ascii=False)}"
    )

    try:
        bruto_ia, modelo_usado = _chamar_gemini_diagnostico(prompt)
        parsed = json.loads(bruto_ia)
        if isinstance(parsed, dict) and isinstance(parsed.get("itens"), list):
            itens = parsed["itens"]
            txt_corrigido = anotar_itens(itens, conteudo_txt)
            return {
                "modo": "ia",
                "modelo": modelo_usado,
                "colunas_movimentos": qtd_mov,
                "colunas_itens": qtd_itens,
                "linhas_txt_analisadas": len(trechos_txt),
                "resumo_geral": str(parsed.get("resumo_geral") or ""),
                "txt_corrigido_sugerido": txt_corrigido,
                "itens": itens,
                "diagnostico": bruto_ia,
            }
        return {
            "modo": "ia",
            "modelo": modelo_usado,
            "colunas_movimentos": qtd_mov,
            "colunas_itens": qtd_itens,
            "linhas_txt_analisadas": len(trechos_txt),
            "resumo_geral": "",
            "txt_corrigido_sugerido": "",
            "itens": [],
            "diagnostico": bruto_ia,
        }
    except Exception as exc:
        motivo = f"{type(exc).__name__}: {exc}"
        print(f"[SPED_FISCAL][FALLBACK] {motivo}", flush=True)
        top_mov = [c["coluna"] for c in ctx["MOVIMENTOS"][:6]]
        top_itens = [c["coluna"] for c in ctx["MOVIMENTOS_ITENS"][:6]]
        itens_fallback = [
            {
                "erro": err,
                "registro_alvo": registro_sped.strip()
                or (trechos_txt[0]["registro"] if trechos_txt else "Não identificado"),
                "significado": "Não deu certo consultar a IA para este ponto.",
                "colunas_movimentos": top_mov,
                "colunas_itens": top_itens,
                "onde_procurar": f"Motivo da falha na IA: {motivo}",
                "sugestao_ajuste_txt": "Verifique GEMINI_API_KEY, os modelos no .env e a conexão com a API, depois tente novamente.",
                "linha_txt_sugerida": "",
                "linha_txt_original": "",
                "numero_linha": 0,
                "aplicavel": False,
            }
            for err in lista_erros
        ]
        return {
            "modo": "estruturado_local",
            "motivo_fallback": motivo,
            "colunas_movimentos": qtd_mov,
            "colunas_itens": qtd_itens,
            "linhas_txt_analisadas": len(trechos_txt),
            "resumo_geral": f"Não deu certo analisar com a IA ({motivo}).",
            "txt_corrigido_sugerido": "",
            "itens": itens_fallback,
            "diagnostico": f"Não deu certo analisar com a IA.\nMotivo: {motivo}",
        }