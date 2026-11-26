import copy
import io
from docx import Document
from docx.table import _Row
from .queries import obter_caminho_modelo_docx, obter_config_modelo
from .schemas import GerarSequenciaRequestSchema


def _substituir_texto_preservando_estilo(paragrafo, mapa: dict[str, str]) -> None:
    runs = paragrafo.runs
    if not runs:
        texto_atual = paragrafo.text
        novo = texto_atual
        for chave, valor in mapa.items():
            if chave in novo:
                novo = novo.replace(chave, valor)
        if novo != texto_atual:
            paragrafo.text = novo
        return

    texto_completo = "".join(r.text for r in runs)
    novo_texto = texto_completo
    for chave, valor in mapa.items():
        if chave in novo_texto:
            novo_texto = novo_texto.replace(chave, valor)

    if novo_texto == texto_completo:
        return

    # Escreve no primeiro run para preservar a formatação (fonte/tamanho/cor) original
    runs[0].text = novo_texto
    for r in runs[1:]:
        r.text = ""


def _substituir_em_paragrafos(paragrafos, mapa: dict[str, str]) -> None:
    for p in paragrafos:
        _substituir_texto_preservando_estilo(p, mapa)


def _substituir_em_tabela(tabela, mapa: dict[str, str]) -> None:
    for row in tabela.rows:
        for cell in row.cells:
            _substituir_em_paragrafos(cell.paragraphs, mapa)
            for sub in cell.tables:
                _substituir_em_tabela(sub, mapa)


def _remover_linha_tabela(row) -> None:
    parent = row._tr.getparent()
    if parent is not None:
        parent.remove(row._tr)


def gerar_documento_sequencia_docx(req: GerarSequenciaRequestSchema) -> tuple[io.BytesIO, str]:
    cfg = obter_config_modelo(req.modelo)
    caminho_modelo = obter_caminho_modelo_docx()

    if not caminho_modelo.exists():
        raise FileNotFoundError(f"Modelo não encontrado em: {caminho_modelo}")

    doc = Document(str(caminho_modelo))

    mapa_geral = {
        "{{TITULO_DOCUMENTO}}": cfg["titulo_documento"],
        "{{COLUNA_SEQUENCIA}}": cfg["coluna_sequencia"],
        "{{NOME_EMPRESA}}": req.variaveis.nome_empresa,
        "{{CNPJ_EMPRESA}}": req.variaveis.cnpj_empresa,
    }

    _substituir_em_paragrafos(doc.paragraphs, mapa_geral)
    for tabela in doc.tables:
        _substituir_em_tabela(tabela, mapa_geral)

    if doc.tables and len(doc.tables[0].rows) > 1 and req.linhas_word:
        tabela = doc.tables[0]
        linha_template = tabela.rows[1]
        tr_template = linha_template._tr
        tbl = tabela._tbl
        idx_insercao = tbl.index(tr_template)

        for r_extra in list(tabela.rows)[2:]:
            _remover_linha_tabela(r_extra)

        _remover_linha_tabela(linha_template)

        for offset, item in enumerate(req.linhas_word):
            novo_tr = copy.deepcopy(tr_template)
            tbl.insert(idx_insercao + offset, novo_tr)
            nova_row = _Row(novo_tr, tabela)

            mapa_linha = {
                "{{SERIE}}": item.serie,
                "{{NUM_DOC}}": item.num_doc,
                "{{MES_ANO_EMISSAO}}": item.mes_ano_emissao,
                "{{MES_ANO_PROTOCOLO}}": item.mes_ano_protocolo,
            }
            for cell in nova_row.cells:
                _substituir_em_paragrafos(cell.paragraphs, mapa_linha)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    nome_arquivo = f"Sequencia_Faltante_{cfg['sufixo_arquivo']}.docx"
    return buffer, nome_arquivo