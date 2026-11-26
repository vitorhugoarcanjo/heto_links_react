from pathlib import Path

CONFIG_MODELO_FISCAL: dict[str, dict[str, str]] = {
    "NF-E": {
        "titulo_documento": "NFe DE EMISSÃO PRÓPRIA FALTANTES NA SEQUÊNCIA",
        "coluna_sequencia": "NF-E INICIO / FIM",
        "sufixo_arquivo": "NF-e",
    },
    "NFC-E": {
        "titulo_documento": "NFCe FALTANTE NA SEQUÊNCIA",
        "coluna_sequencia": "NFC-E INICIO / FIM",
        "sufixo_arquivo": "NFC-e",
    },
}


def obter_config_modelo(modelo: str) -> dict[str, str]:
    chave = (modelo or "NF-E").upper().strip()
    return CONFIG_MODELO_FISCAL.get(chave, CONFIG_MODELO_FISCAL["NF-E"])


def obter_caminho_modelo_docx() -> Path:
    atual = Path(__file__).resolve()
    caminhos_relativos = [
        Path("data") / "modelo_doc_nfe_nfce" / "modelo_sequencia_faltante.docx",
        Path("backend") / "data" / "modelo_doc_nfe_nfce" / "modelo_sequencia_faltante.docx",
    ]
    for pai in [atual.parent, *atual.parents]:
        for rel in caminhos_relativos:
            candidato = pai / rel
            if candidato.exists():
                return candidato
    return (
        Path(__file__).resolve().parents[2]
        / "data"
        / "modelo_doc_nfe_nfce"
        / "modelo_sequencia_faltante.docx"
    )