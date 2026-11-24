"""Validação e normalização de payloads de grupos e links."""

from backend.utils.exceptions import ErroValidacao


def validar_payload_grupo(data: dict) -> dict:
    if not isinstance(data, dict):
        raise ErroValidacao("Corpo JSON inválido.")

    titulo = str(data.get("titulo", "")).strip()
    if not titulo:
        raise ErroValidacao("O título do grupo é obrigatório.")

    cor_topo = str(data.get("cor_topo") or "#2563eb").strip()
    if not cor_topo.startswith("#") or len(cor_topo) not in (4, 7):
        cor_topo = "#2563eb"

    ordem = data.get("ordem")
    if ordem is not None:
        try:
            ordem = int(ordem)
        except (TypeError, ValueError) as exc:
            raise ErroValidacao("O campo 'ordem' deve ser um número inteiro.") from exc

    return {
        "titulo": titulo.upper(),
        "cor_topo": cor_topo,
        "ordem": ordem,
    }


def validar_payload_link(data: dict) -> dict:
    if not isinstance(data, dict):
        raise ErroValidacao("Corpo JSON inválido.")

    try:
        grupo_id = int(data.get("grupo_id"))
    except (TypeError, ValueError) as exc:
        raise ErroValidacao("Selecione um grupo válido para o link.") from exc

    titulo = str(data.get("titulo", "")).strip()
    if not titulo:
        raise ErroValidacao("O título do link é obrigatório.")

    url = str(data.get("url", "")).strip()
    if not url:
        raise ErroValidacao("A URL do link é obrigatória.")

    descricao_raw = data.get("descricao")
    descricao = str(descricao_raw).strip() if descricao_raw else None

    ordem = data.get("ordem")
    if ordem is not None:
        try:
            ordem = int(ordem)
        except (TypeError, ValueError) as exc:
            raise ErroValidacao("O campo 'ordem' deve ser um número inteiro.") from exc

    abrir_nova_aba = 1 if bool(data.get("abrir_nova_aba", True)) else 0

    return {
        "grupo_id": grupo_id,
        "titulo": titulo,
        "url": url,
        "descricao": descricao,
        "ordem": ordem,
        "abrir_nova_aba": abrir_nova_aba,
    }


def validar_lista_reordenacao(data) -> list[dict]:
    if not isinstance(data, list) or not data:
        raise ErroValidacao("Envie uma lista não vazia de itens para reordenar.")

    itens_validados = []
    for item in data:
        if not isinstance(item, dict):
            raise ErroValidacao("Cada item da reordenação deve ser um objeto.")
        try:
            item_id = int(item["id"])
            ordem = int(item["ordem"])
        except (KeyError, TypeError, ValueError) as exc:
            raise ErroValidacao("Cada item deve conter 'id' e 'ordem' inteiros.") from exc

        registro = {"id": item_id, "ordem": ordem}
        if "grupo_id" in item and item["grupo_id"] is not None:
            try:
                registro["grupo_id"] = int(item["grupo_id"])
            except (TypeError, ValueError) as exc:
                raise ErroValidacao("'grupo_id' inválido na reordenação.") from exc

        itens_validados.append(registro)

    return itens_validados