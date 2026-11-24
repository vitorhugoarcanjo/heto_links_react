"""Popula o banco SQLite com os 5 grupos e 23 links iniciais do legado."""

from backend.config.imports_tabelas import criar_todas_tabelas
from backend.utils.database.db import get_conexao_direct

DADOS_LEGADO = [
    {
        "titulo": "MONITOR E GSURF",
        "cor_topo": "#38bdf8",
        "ordem": 1,
        "links": [
            ("GSURF", "https://parceiros.gsurfnet.com/login/login"),
            ("MONITOR SEFAZ", "https://www.nfe.fazenda.gov.br/portal/disponibilidade.aspx"),
            ("MONITOR - OPERADORAS DOWNDETECTOR", "https://downdetector.com.br/"),
            ("ZORTE MONITOR SEFAZ", "https://www.nfe.fazenda.gov.br/portal/disponibilidade.aspx"),
            ("INTEGRA MONITOR SEFAZ", "https://www.nfe.fazenda.gov.br/portal/disponibilidade.aspx"),
        ],
    },
    {
        "titulo": "NOTAS FISCAIS DE CUPOM E NFE",
        "cor_topo": "#3b82f6",
        "ordem": 2,
        "links": [
            ("NFC-e INUTILIZAÇÕES", "https://www.nfe.fazenda.gov.br/portal/principal.aspx"),
            ("NFC-e CONSULTA", "https://www.nfce.fazenda.gov.br/portal/"),
            ("NF-e CONSULTA", "https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx"),
            ("CT-e CONSULTA", "https://www.cte.fazenda.gov.br/portal/"),
            ("ACESSO WEB SEFAZ", "https://www.sefaz.mt.gov.br/"),
        ],
    },
    {
        "titulo": "NOTAS FISCAIS DE SERVICOS",
        "cor_topo": "#6366f1",
        "ordem": 3,
        "links": [
            ("NFSe AGIL SOFTWARE RONDONOPOLIS", "https://rondonopolis.agili.com.br/"),
            ("NFSe ISSNET CUIABÁ", "https://www.issnetonline.com.br/cuiaba/"),
            ("NFSe VARZEA GRANDE", "https://nfse.varzeagrande.mt.gov.br/"),
            ("NFSe JI PARANA", "https://ji-parana.atende.net/"),
            ("NFSe CUIABÁ", "https://cuiaba.atende.net/"),
            ("NFSe GOV", "https://www.nfse.gov.br/EmissorNacional"),
        ],
    },
    {
        "titulo": "TABELAS TRIBUTACOES / NCM",
        "cor_topo": "#0ea5e9",
        "ordem": 4,
        "links": [
            ("TABELA TRIBUTACAO CST - LUCRO PRESUMIDO/REAL", "https://www.gov.br/"),
            ("TABELA CSOSN - SIMPLES NACIONAL", "https://www.gov.br/"),
            ("TABELA CST - PIS / COFINS", "https://www.gov.br/"),
            ("NCM - BLUESOFT", "https://cosmos.bluesoft.com.br/ncms"),
            ("CÓDIGO DE CLASSIFICAÇÃO E CST - GOV", "https://www.gov.br/"),
        ],
    },
    {
        "titulo": "HETOSOFT",
        "cor_topo": "#22d3ee",
        "ordem": 5,
        "links": [
            ("MANUAL - HETOSOFT", "https://hetosoft.com.br"),
            ("PORTAL CIDADE/ESTADO NFSE - GOV", "https://www.gov.br/nfse"),
        ],
    },
]


def executar_seed():
    criar_todas_tabelas()
    conn = get_conexao_direct()
    try:
        cur = conn.cursor()
        total = cur.execute("SELECT COUNT(*) AS qtd FROM grupos_links;").fetchone()["qtd"]
        if total > 0:
            print(f"ℹ️ Banco já possui {total} grupos cadastrados. Seed ignorado.")
            return

        with conn:
            for grupo in DADOS_LEGADO:
                c_grupo = conn.execute(
                    "INSERT INTO grupos_links (titulo, cor_topo, ordem) VALUES (?, ?, ?);",
                    (grupo["titulo"], grupo["cor_topo"], grupo["ordem"]),
                )
                grupo_id = c_grupo.lastrowid

                for idx, (titulo_link, url_link) in enumerate(grupo["links"], start=1):
                    conn.execute(
                        """
                        INSERT INTO links (grupo_id, titulo, url, ordem, abrir_nova_aba)
                        VALUES (?, ?, ?, ?, 1);
                        """,
                        (grupo_id, titulo_link, url_link, idx),
                    )

        print("✅ Seed concluído: 5 grupos e 23 links inseridos!")
    finally:
        conn.close()


if __name__ == "__main__":
    executar_seed()