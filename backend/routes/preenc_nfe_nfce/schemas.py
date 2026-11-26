from dataclasses import dataclass, field
from typing import Any


@dataclass
class VariaveisDocumentoSchema:
    nome_empresa: str
    cnpj_empresa: str


@dataclass
class LinhaWordSchema:
    serie: str
    num_doc: str
    mes_ano_emissao: str
    mes_ano_protocolo: str


@dataclass
class GerarSequenciaRequestSchema:
    modelo: str
    variaveis: VariaveisDocumentoSchema
    linhas_word: list[LinhaWordSchema] = field(default_factory=list)

    @classmethod
    def from_payload(cls, payload: dict[str, Any] | None) -> "GerarSequenciaRequestSchema":
        dados = payload or {}
        modelo_raw = str(dados.get("modelo", "NF-E")).upper().strip()
        modelo = modelo_raw if modelo_raw in {"NF-E", "NFC-E"} else "NF-E"

        var_raw = dados.get("variaveis") or {}
        variaveis = VariaveisDocumentoSchema(
            nome_empresa=str(var_raw.get("NOME_EMPRESA", "")).strip(),
            cnpj_empresa=str(var_raw.get("CNPJ_EMPRESA", "")).strip(),
        )

        linhas_raw = dados.get("linhas_word") or []
        linhas_word: list[LinhaWordSchema] = []
        for item in linhas_raw:
            if not isinstance(item, dict):
                continue
            linhas_word.append(
                LinhaWordSchema(
                    serie=str(item.get("SERIE", "")).strip(),
                    num_doc=str(item.get("NUM_DOC", "")).strip(),
                    mes_ano_emissao=str(item.get("MES_ANO_EMISSAO", "")).strip(),
                    mes_ano_protocolo=str(item.get("MES_ANO_PROTOCOLO", "")).strip(),
                )
            )

        return cls(modelo=modelo, variaveis=variaveis, linhas_word=linhas_word)