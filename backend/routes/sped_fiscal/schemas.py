from typing import Any

TABELAS_VALIDAS = ("MOVIMENTOS", "MOVIMENTOS_ITENS")


def padrao_fiscal() -> dict[str, Any]:
    return {
        "sistema": "Hetosoft Links",
        "modulo": "diagnostico_sped_fiscal",
        "obrigacao": "EFD_ICMS_IPI",
        "banco": "Firebird",
        "tabelas": {
            "MOVIMENTOS": [],
            "MOVIMENTOS_ITENS": [],
        },
    }


def normalizar_coluna(item: dict[str, Any], tabela_padrao: str) -> dict[str, Any] | None:
    nome = str(item.get("coluna") or item.get("nome") or item.get("campo") or "").strip()
    if not nome:
        return None
    tabela = str(item.get("tabela") or tabela_padrao).strip().upper()
    if tabela not in TABELAS_VALIDAS:
        tabela = tabela_padrao
    return {
        "coluna": nome,
        "relevante_sped": bool(item.get("relevante_sped", False)),
        "categoria": str(item.get("categoria") or "").strip(),
        "descricao": str(item.get("descricao") or "").strip(),
    }


def normalizar_documento(payload: Any) -> dict[str, Any]:
    base = padrao_fiscal()
    if isinstance(payload, dict):
        for chave in ("sistema", "modulo", "obrigacao", "banco"):
            if payload.get(chave):
                base[chave] = payload[chave]
        origem = payload.get("tabelas") if isinstance(payload.get("tabelas"), dict) else payload
        for tabela in TABELAS_VALIDAS:
            brutos = origem.get(tabela) if isinstance(origem, dict) else []
            if not isinstance(brutos, list):
                continue
            vistos: set[str] = set()
            limpos: list[dict[str, Any]] = []
            for bruto in brutos:
                if not isinstance(bruto, dict):
                    continue
                norm = normalizar_coluna(bruto, tabela)
                if norm and norm["coluna"].upper() not in vistos:
                    vistos.add(norm["coluna"].upper())
                    limpos.append(norm)
            base["tabelas"][tabela] = limpos
    return base