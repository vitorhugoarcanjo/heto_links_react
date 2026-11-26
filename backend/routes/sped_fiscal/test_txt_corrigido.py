from txt_corrigido import anotar_itens, codificar_txt, montar_txt_corrigido

TXT = "|0000|017|0|\r\n|C100|0|1|A|\r\n|C170|1|X|\r\n|C170|1|X|\r\n|9999|4|\r\n"


def test_troca_so_a_linha_certa():
    r = montar_txt_corrigido(TXT, [{"indice": 0, "linha_original": "|C100|0|1|A|", "linha_nova": "|C100|0|1|B|"}])
    assert r["txt"] == TXT.replace("|A|", "|B|")
    assert len(r["aplicadas"]) == 1 and not r["ignoradas"]


def test_duplicada_sem_numero_e_com_numero():
    c = {"indice": 0, "linha_original": "|C170|1|X|", "linha_nova": "|C170|1|Y|"}
    assert montar_txt_corrigido(TXT, [c])["ignoradas"]
    r = montar_txt_corrigido(TXT, [{**c, "numero_linha": 4}])
    assert r["txt"].splitlines()[3] == "|C170|1|Y|" and r["txt"].splitlines()[2] == "|C170|1|X|"


def test_rejeita_campos_e_registro():
    r = montar_txt_corrigido(TXT, [
        {"indice": 0, "linha_original": "|C100|0|1|A|", "linha_nova": "|C100|0|1|A|extra|"},
        {"indice": 1, "linha_original": "|C100|0|1|A|", "linha_nova": "|C190|0|1|B|"},
        {"indice": 2, "linha_original": "|NAO|EXISTE|", "linha_nova": "|NAO|X|"},
    ])
    assert not r["aplicadas"] and len(r["ignoradas"]) == 3 and r["txt"] == TXT


def test_ia_errou_a_copia_mas_acertou_numero_da_linha():
    # cópia com valor errado, mas numero_linha 2 é o C100 certo
    r = montar_txt_corrigido(TXT, [
        {"indice": 0, "linha_original": "|C100|0|1|ZZZ|", "linha_nova": "|C100|0|1|B|", "numero_linha": 2},
    ])
    assert r["aplicadas"] and r["aplicadas"][0]["antes"] == "|C100|0|1|A|"
    assert r["txt"].splitlines()[1] == "|C100|0|1|B|"


def test_sem_original_usa_numero_da_linha_e_recusa_registro_diferente():
    ok = montar_txt_corrigido(TXT, [{"indice": 0, "linha_original": "", "linha_nova": "|C100|0|1|B|", "numero_linha": 2}])
    assert ok["aplicadas"]
    ruim = montar_txt_corrigido(TXT, [{"indice": 0, "linha_original": "", "linha_nova": "|C100|0|1|B|", "numero_linha": 3}])
    assert not ruim["aplicadas"] and "registro" in ruim["ignoradas"][0]["motivo"]


def test_anotar_alinha_item_com_arquivo_real():
    itens = [
        {"linha_txt_original": "|C100|0|1|errada|", "linha_txt_sugerida": "|C100|0|1|Ç|", "numero_linha": 2},
        {"linha_txt_sugerida": ""},
    ]
    txt = anotar_itens(itens, TXT)
    assert itens[0]["aplicavel"] and not itens[1]["aplicavel"] and "Ç" in txt
    assert itens[0]["linha_txt_original"] == "|C100|0|1|A|" and itens[0]["numero_linha"] == 2
    assert codificar_txt(txt)[1] == "iso-8859-1"


def test_encoding():
    assert codificar_txt("|–|")[1] == "cp1252"
    assert codificar_txt("| |")[1] == "utf-8"