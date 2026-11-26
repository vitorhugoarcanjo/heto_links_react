"""Montagem determinística do .txt SPED corrigido.

A IA sugere, por apontamento, a linha corrigida e onde ela está (numero_linha).
Este módulo:
  - localiza a linha no arquivo (cópia exata da IA; se ela errou a cópia, usa o numero_linha,
    desde que seja o mesmo registro);
  - valida a linha sugerida (mesmo registro, mesma quantidade de campos, formato com '|');
  - troca só as linhas aprovadas e preserva todo o resto (inclusive a quebra de linha).

Local sugerido: backend/routes/sped_fiscal/txt_corrigido.py
"""

from __future__ import annotations

from typing import Any


def _campos(linha: str) -> list[str]:
    t = linha.strip()
    if t.startswith("|"):
        t = t[1:]
    if t.endswith("|"):
        t = t[:-1]
    return t.split("|")


def _compacta(linha: str) -> str:
    return " ".join(linha.split())


def validar_linha_sped(original: str, nova: str) -> str | None:
    """Retorna o motivo da rejeição, ou None se a troca é segura."""
    o, n = original.strip(), nova.strip()
    if not n:
        return "Linha sugerida vazia."
    if "\n" in n or "\r" in n:
        return "Linha sugerida contém quebra de linha."
    if not (n.startswith("|") and n.endswith("|")):
        return "Linha sugerida precisa começar e terminar com '|'."
    co, cn = _campos(o), _campos(n)
    if co[0] != cn[0]:
        return f"O registro mudou de {co[0]} para {cn[0]}."
    if len(co) != len(cn):
        return f"A quantidade de campos mudou ({len(co)} → {len(cn)})."
    return None


def montar_txt_corrigido(
    conteudo_txt: str, correcoes: list[dict[str, Any]]
) -> dict[str, Any]:
    """Aplica as correções sobre o conteúdo original.

    Cada correção: {"indice": int, "linha_original": str, "linha_nova": str,
                    "numero_linha": int | None (1-based)}
    """
    quebra = "\r\n" if "\r\n" in conteudo_txt else "\n"
    termina_com_quebra = conteudo_txt.endswith(("\n", "\r"))
    linhas = conteudo_txt.splitlines()

    exato: dict[str, list[int]] = {}
    compacto: dict[str, list[int]] = {}
    for pos, linha in enumerate(linhas):
        exato.setdefault(linha.strip(), []).append(pos)
        compacto.setdefault(_compacta(linha), []).append(pos)

    aplicadas: list[dict[str, Any]] = []
    ignoradas: list[dict[str, Any]] = []
    usadas: set[int] = set()

    for c in correcoes:
        idx = c.get("indice")
        orig = str(c.get("linha_original") or "").strip()
        nova = str(c.get("linha_nova") or "").strip()
        num = c.get("numero_linha")
        num = num if isinstance(num, int) and 1 <= num <= len(linhas) else None

        def ignorar(motivo: str) -> None:
            ignoradas.append({"indice": idx, "motivo": motivo})

        if not nova:
            ignorar("Sem linha sugerida: ajuste manual no sistema.")
            continue
        if not (nova.startswith("|") and nova.endswith("|")):
            ignorar("Linha sugerida precisa começar e terminar com '|'.")
            continue

        # 1) cópia exata da IA (ou igual ignorando espaços repetidos)
        posicoes = exato.get(orig, []) if orig else []
        if orig and not posicoes:
            posicoes = compacto.get(_compacta(orig), [])

        alvo: int | None = None
        if posicoes:
            if num is not None and (num - 1) in posicoes:
                alvo = num - 1
            elif len(posicoes) == 1:
                alvo = posicoes[0]
            else:
                livres = [p for p in posicoes if p not in usadas]
                if len(livres) == 1:
                    alvo = livres[0]
            if alvo is None:
                ignorar(f"A linha aparece {len(posicoes)} vezes e não foi possível saber qual trocar.")
                continue
        # 2) a IA errou a cópia: confia no número da linha se for o mesmo registro
        elif num is not None:
            candidata = linhas[num - 1]
            if _campos(candidata)[0] == _campos(nova)[0]:
                alvo = num - 1
            else:
                ignorar(
                    f"A linha {num} do arquivo é do registro {_campos(candidata)[0]}, "
                    f"mas a correção é do registro {_campos(nova)[0]}."
                )
                continue
        else:
            ignorar("Não foi possível localizar a linha no arquivo (sem cópia exata nem número da linha).")
            continue

        real = linhas[alvo].strip()
        if real == nova:
            ignorar("A linha sugerida é igual à original.")
            continue
        if alvo in usadas:
            ignorar("Essa linha já foi corrigida por outro apontamento.")
            continue

        motivo = validar_linha_sped(real, nova)
        if motivo:
            ignorar(motivo)
            continue

        linhas[alvo] = nova
        usadas.add(alvo)
        aplicadas.append(
            {
                "indice": idx,
                "numero_linha": alvo + 1,
                "registro": _campos(real)[0],
                "antes": real,
                "depois": nova,
            }
        )

    txt = quebra.join(linhas) + (quebra if termina_com_quebra else "")
    return {
        "txt": txt,
        "aplicadas": aplicadas,
        "ignoradas": ignoradas,
        "total_linhas": len(linhas),
    }


def anotar_itens(itens: list[Any], conteudo_txt: str) -> str:
    """Marca cada item da IA como aplicável (ou não), alinha linha original/número com o
    arquivo real e devolve o .txt com todas as correções aplicáveis."""
    validos = [(i, it) for i, it in enumerate(itens) if isinstance(it, dict)]
    correcoes = []
    for i, it in validos:
        num = it.get("numero_linha")
        correcoes.append(
            {
                "indice": i,
                "linha_original": it.get("linha_txt_original", ""),
                "linha_nova": it.get("linha_txt_sugerida", ""),
                "numero_linha": num if isinstance(num, int) and num > 0 else None,
            }
        )

    if not conteudo_txt.strip():
        for _, it in validos:
            it["aplicavel"] = False
            it["motivo_nao_aplicavel"] = "Nenhum .txt foi enviado."
        return ""

    res = montar_txt_corrigido(conteudo_txt, correcoes)
    for _, it in validos:
        it["aplicavel"] = False
    for a in res["aplicadas"]:
        item = itens[a["indice"]]
        item["aplicavel"] = True
        item["linha_txt_original"] = a["antes"]
        item["numero_linha"] = a["numero_linha"]
    for g in res["ignoradas"]:
        itens[g["indice"]]["motivo_nao_aplicavel"] = g["motivo"]

    print(
        f"[SPED_FISCAL][TXT] correções aplicáveis: {len(res['aplicadas'])}/{len(validos)}"
        + (
            " | motivos: " + "; ".join(g["motivo"] for g in res["ignoradas"][:3])
            if res["ignoradas"]
            else ""
        ),
        flush=True,
    )
    return res["txt"] if res["aplicadas"] else ""


def codificar_txt(txt: str) -> tuple[bytes, str]:
    """O PVA espera ISO-8859-1. Tenta ele, depois Windows-1252 e por último UTF-8."""
    for nome in ("iso-8859-1", "cp1252"):
        try:
            return txt.encode(nome), nome
        except UnicodeEncodeError:
            continue
    return txt.encode("utf-8"), "utf-8"