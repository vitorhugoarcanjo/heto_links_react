import React, { useEffect, useMemo, useState } from 'react';
import { baixarTxtCorrigido, type CorrecaoPayload } from '../../utils/downloadTxt';
import type { DiagnosticoFiscalResultado, ItemDiagnosticoVisual } from '../types';
import { AjudaBloco } from './AjudaBloco';
import { SpedCollapseBtn } from './SpedCollapseBtn';

interface SpedDiagnosticoResultProps {
  diagnostico: DiagnosticoFiscalResultado;
  conteudoTxtOriginal: string;
}

function campos(linha: string): string[] {
  let t = linha.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|');
}

function diffCampos(original: string, nova: string) {
  const o = campos(original);
  const n = campos(nova);
  const mudancas: { numero: string; antes: string; depois: string }[] = [];
  for (let i = 0; i < Math.max(o.length, n.length); i++) {
    if ((o[i] ?? '') !== (n[i] ?? '')) {
      mudancas.push({
        numero: String(i + 1).padStart(2, '0'),
        antes: o[i] ?? '',
        depois: n[i] ?? '',
      });
    }
  }
  return mudancas;
}

const LinhaComDestaque: React.FC<{ linha: string; outra: string; tipo: 'antes' | 'depois' }> = ({
  linha,
  outra,
  tipo,
}) => {
  const a = campos(linha);
  const b = campos(outra);
  return (
    <code className={`sped-res-linha sped-res-linha--${tipo}`}>
      |
      {a.map((c, i) => (
        <React.Fragment key={i}>
          <span className={c !== (b[i] ?? '') ? 'sped-res-campo' : undefined}>{c}</span>|
        </React.Fragment>
      ))}
    </code>
  );
};

export const SpedDiagnosticoResult: React.FC<SpedDiagnosticoResultProps> = ({
  diagnostico,
  conteudoTxtOriginal,
}) => {
  const itens = useMemo<ItemDiagnosticoVisual[]>(() => diagnostico.itens ?? [], [diagnostico.itens]);
  const isIa = diagnostico.modo === 'ia';
  const temTxt = Boolean(conteudoTxtOriginal.trim());

  const [linhasEditadas, setLinhasEditadas] = useState<Record<number, string>>({});

  useEffect(() => {
    const iniciais: Record<number, string> = {};
    itens.forEach((it, idx) => {
      const base = (it.linha_txt_sugerida || it.linha_txt_original || '').trim();
      if (base) iniciais[idx] = base;
    });
    setLinhasEditadas(iniciais);
  }, [itens]);

  const itensDisponiveis = useMemo(() => {
    if (!temTxt) return [];
    return itens
      .map((it, idx) => {
        const original = (it.linha_txt_original ?? '').trim();
        const sugeridaAtual = (linhasEditadas[idx] ?? it.linha_txt_sugerida ?? '').trim();
        const podeIncluir = Boolean(original && sugeridaAtual && original !== sugeridaAtual);
        return podeIncluir ? idx : -1;
      })
      .filter((idx) => idx >= 0);
  }, [itens, linhasEditadas, temTxt]);

  const [aberto, setAberto] = useState(true);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [gerando, setGerando] = useState(false);
  const [erroDownload, setErroDownload] = useState('');

  useEffect(() => {
    setSelecionados(new Set(itensDisponiveis));
    setErroDownload('');
    setAberto(true);
  }, [itensDisponiveis]);

  function alternar(i: number) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(i)) novo.delete(i);
      else novo.add(i);
      return novo;
    });
  }

  function atualizarLinha(i: number, valor: string) {
    setLinhasEditadas((prev) => ({ ...prev, [i]: valor }));
    const original = (itens[i]?.linha_txt_original ?? '').trim();
    const limpa = valor.trim();
    if (original && limpa && original !== limpa) {
      setSelecionados((prev) => {
        const novo = new Set(prev);
        novo.add(i);
        return novo;
      });
    }
  }

  async function gerar() {
    setErroDownload('');
    setGerando(true);
    try {
      const correcoes: CorrecaoPayload[] = [...selecionados]
        .filter((i) => itensDisponiveis.includes(i))
        .sort((a, b) => a - b)
        .map((i) => ({
          indice: i,
          linha_original: itens[i].linha_txt_original ?? '',
          linha_nova: (linhasEditadas[i] ?? itens[i].linha_txt_sugerida ?? '').trim(),
          numero_linha: itens[i].numero_linha || null,
        }));

      if (correcoes.length === 0) {
        setErroDownload('Nenhuma linha alterada está selecionada para gerar o .txt.');
        return;
      }

      await baixarTxtCorrigido(conteudoTxtOriginal, correcoes);
    } catch (e) {
      setErroDownload(e instanceof Error ? e.message : 'Falha ao gerar o .txt corrigido.');
    } finally {
      setGerando(false);
    }
  }

  const podeGerar = isIa && temTxt && selecionados.size > 0;
  const manuais = Math.max(0, itens.length - itensDisponiveis.length);

  return (
    <div className="sped-card">
      <div className="sped-section-title">
        <div className="sped-titulo-com-ajuda">
          <SpedCollapseBtn aberto={aberto} onToggle={() => setAberto((v) => !v)} rotulo="resultado" />
          <h3>2. Resultado do Diagnóstico</h3>
          <AjudaBloco texto="Veja o diagnóstico, edite a linha sugerida se precisar ajustar algum campo na mão, marque as linhas que quer incluir e baixe o novo .txt para testar no PVA." />
        </div>
        <div className="sped-badges">
          <span className={`sped-badge ${isIa ? 'sped-badge--ia' : 'sped-badge--erro'}`}>
            {isIa ? `IA · ${diagnostico.modelo || 'Gemini'}` : 'Falha na IA'}
          </span>
          {typeof diagnostico.linhas_txt_analisadas === 'number' &&
            diagnostico.linhas_txt_analisadas > 0 && (
              <span className="sped-badge">{diagnostico.linhas_txt_analisadas} linhas lidas</span>
            )}
        </div>
      </div>

      {aberto && (
        <>
          {!isIa && (
            <div className="sped-alert-erro">
              <strong>Não deu certo consultar a IA.</strong>
              {diagnostico.motivo_fallback && (
                <div className="sped-motivo-detalhe">Motivo: {diagnostico.motivo_fallback}</div>
              )}
            </div>
          )}

          {diagnostico.resumo_geral && <p className="sped-resumo">{diagnostico.resumo_geral}</p>}

          {isIa && itens.length > 0 && (
            <div className="sped-res-resumo">
              <div className="sped-res-kpi">
                <strong>{itens.length}</strong>
                <span>apontamentos</span>
              </div>
              <div className="sped-res-kpi sped-res-kpi--ok">
                <strong>{itensDisponiveis.length}</strong>
                <span>com correção no .txt</span>
              </div>
              <div className="sped-res-kpi sped-res-kpi--manual">
                <strong>{manuais}</strong>
                <span>sem alteração / manual</span>
              </div>
            </div>
          )}

          {itens.length > 0 ? (
            <div className="sped-res-lista">
              {itens.map((item, i) => {
                const original = (item.linha_txt_original ?? '').trim();
                const linhaNovaAtual = (linhasEditadas[i] ?? item.linha_txt_sugerida ?? '').trim();
                const temLinhaOriginal = Boolean(original && temTxt);
                const temMudanca = Boolean(temLinhaOriginal && linhaNovaAtual && original !== linhaNovaAtual);
                const marcado = selecionados.has(i) && temMudanca;
                const mudancas = temMudanca ? diffCampos(original, linhaNovaAtual) : [];

                return (
                  <article
                    key={`${i}-${item.registro_alvo}`}
                    className={`sped-res-item ${temMudanca ? 'sped-res-item--ok' : 'sped-res-item--manual'} ${
                      marcado ? 'sped-res-item--marcado' : ''
                    }`}
                  >
                    <header className="sped-res-topo">
                      <span className="sped-item-indice">#{i + 1}</span>
                      <strong className="sped-res-erro">{item.erro}</strong>
                      {item.registro_alvo && <code className="sped-tag-alvo">{item.registro_alvo}</code>}
                      {isIa && (
                        <span
                          className={`sped-res-status ${
                            temMudanca ? 'sped-res-status--ok' : 'sped-res-status--manual'
                          }`}
                        >
                          {temMudanca ? 'Pronta p/ .txt' : 'Edite ou ajuste manual'}
                        </span>
                      )}
                    </header>

                    <div className="sped-res-grade">
                      <section>
                        <span className="sped-mini-label">O que significa</span>
                        <p className="sped-resultado-texto">{item.significado}</p>
                      </section>
                      <section>
                        <span className="sped-mini-label">Onde conferir</span>
                        <p className="sped-resultado-texto">{item.onde_procurar}</p>
                      </section>
                    </div>

                    {(item.colunas_movimentos?.length > 0 || item.colunas_itens?.length > 0) && (
                      <section>
                        <span className="sped-mini-label">Campos relacionados</span>
                        <div className="sped-colunas-tags">
                          {item.colunas_movimentos?.map((c) => (
                            <code key={`mov-${c}`}>MOVIMENTOS · {c}</code>
                          ))}
                          {item.colunas_itens?.map((c) => (
                            <code key={`item-${c}`}>MOVIMENTOS_ITENS · {c}</code>
                          ))}
                        </div>
                      </section>
                    )}

                    {item.sugestao_ajuste_txt && (
                      <section>
                        <span className="sped-mini-label">Ação recomendada</span>
                        <p className="sped-resultado-texto">{item.sugestao_ajuste_txt}</p>
                      </section>
                    )}

                    {isIa && temLinhaOriginal && (
                      <section className="sped-res-diff">
                        <div className="sped-res-diff-topo">
                          <span className="sped-mini-label">
                            Linha do arquivo{item.numero_linha ? ` · linha ${item.numero_linha}` : ''}
                          </span>
                          <label className="sped-res-check">
                            <input
                              type="checkbox"
                              checked={marcado}
                              disabled={!temMudanca}
                              onChange={() => alternar(i)}
                            />
                            Incluir no novo .txt
                          </label>
                        </div>

                        <div className="sped-res-diff-linhas">
                          <LinhaComDestaque
                            linha={original}
                            outra={linhaNovaAtual || original}
                            tipo="antes"
                          />
                          <LinhaComDestaque
                            linha={linhaNovaAtual || original}
                            outra={original}
                            tipo="depois"
                          />
                        </div>

                        <div className="sped-res-editor">
                          <label htmlFor={`sped-linha-edit-${i}`} className="sped-mini-label">
                            Editar linha corrigida (altere os campos entre | e teste no PVA)
                          </label>
                          <input
                            id={`sped-linha-edit-${i}`}
                            type="text"
                            className="sped-input sped-res-linha-input"
                            value={linhasEditadas[i] ?? ''}
                            onChange={(e) => atualizarLinha(i, e.target.value)}
                          />
                        </div>

                        {mudancas.length > 0 && (
                          <ul className="sped-res-mudancas">
                            {mudancas.map((m) => (
                              <li key={m.numero}>
                                Campo {m.numero}: <s>{m.antes || '(vazio)'}</s> → <b>{m.depois || '(vazio)'}</b>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    )}

                    {isIa && !temLinhaOriginal && item.linha_txt_sugerida && (
                      <section>
                        <span className="sped-mini-label">Linha de referência</span>
                        <pre className="sped-diagnostico-pre sped-pre--compact">{item.linha_txt_sugerida}</pre>
                      </section>
                    )}

                    {isIa && item.motivo_nao_aplicavel && (
                      <p className="sped-res-motivo">{item.motivo_nao_aplicavel}</p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            !diagnostico.resumo_geral && (
              <p className="sped-hint">Nenhum apontamento estruturado foi retornado para este envio.</p>
            )
          )}

          {isIa && temTxt && (
            <footer className="sped-res-rodape">
              <div className="sped-res-rodape-info">
                <strong>
                  {selecionados.size} de {itensDisponiveis.length}
                </strong>{' '}
                correção(ões) pronta(s) para o .txt
                {itensDisponiveis.length > 0 && (
                  <span className="sped-res-rodape-links">
                    <button
                      type="button"
                      className="sped-link-btn"
                      onClick={() => setSelecionados(new Set(itensDisponiveis))}
                    >
                      marcar todas
                    </button>
                    <button
                      type="button"
                      className="sped-link-btn"
                      onClick={() => setSelecionados(new Set())}
                    >
                      limpar
                    </button>
                  </span>
                )}
                <p className="sped-hint">
                  {podeGerar
                    ? 'Baixe o novo .txt e valide no PVA. Lembre-se de corrigir também na origem dentro do sistema.'
                    : 'Edite uma linha sugerida (alterando algum campo) e deixe marcada para liberar o download do .txt.'}
                </p>
                {erroDownload && <p className="sped-res-motivo">{erroDownload}</p>}
              </div>
              <button
                type="button"
                className="sped-btn sped-btn-primary"
                disabled={!podeGerar || gerando}
                onClick={gerar}
              >
                {gerando ? 'Gerando...' : 'Baixar .txt corrigido'}
              </button>
            </footer>
          )}
        </>
      )}
    </div>
  );
};