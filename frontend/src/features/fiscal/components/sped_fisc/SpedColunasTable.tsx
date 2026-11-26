import React, { useEffect, useState } from 'react';
import type { ColunaFiscal, FiltroRelevancia } from '../types';
import { AjudaBloco } from './AjudaBloco';

interface SpedColunasTableProps {
  colunas: ColunaFiscal[];
  categorias: string[];
  totalFiltradas: number;
  totalAtivas: number;
  totalGeral: number;
  filtroTabela: string;
  onChangeFiltroTabela: (v: string) => void;
  filtroRelevancia: FiltroRelevancia;
  onChangeFiltroRelevancia: (v: FiltroRelevancia) => void;
  filtroCategoria: string;
  onChangeFiltroCategoria: (v: string) => void;
  busca: string;
  onChangeBusca: (v: string) => void;
  loading: boolean;
  onAtualizar: (
    item: ColunaFiscal,
    patch: { relevante_sped?: boolean; categoria?: string; descricao?: string }
  ) => Promise<void>;
  onRemover: (item: ColunaFiscal) => Promise<void>;
}

export const SpedColunasTable: React.FC<SpedColunasTableProps> = ({
  colunas,
  categorias,
  totalFiltradas,
  totalAtivas,
  totalGeral,
  filtroTabela,
  onChangeFiltroTabela,
  filtroRelevancia,
  onChangeFiltroRelevancia,
  filtroCategoria,
  onChangeFiltroCategoria,
  busca,
  onChangeBusca,
  loading,
  onAtualizar,
  onRemover,
}) => {
  const [exibirCampos, setExibirCampos] = useState(false);

  const pctAtivas = totalGeral > 0 ? Math.round((totalAtivas / totalGeral) * 100) : 0;
  const temFiltro =
    filtroTabela !== 'TODAS' ||
    filtroRelevancia !== 'TODAS' ||
    filtroCategoria !== '' ||
    busca.trim() !== '';

  function limparFiltros() {
    onChangeFiltroTabela('TODAS');
    onChangeFiltroRelevancia('TODAS');
    onChangeFiltroCategoria('');
    onChangeBusca('');
  }

  return (
    <div className="sped-card">
      <div className="sped-section-title">
        <div className="sped-titulo-com-ajuda">
          <h3>Dicionário de Campos</h3>
          <AjudaBloco texto="Define quais colunas de MOVIMENTOS e MOVIMENTOS_ITENS entram no contexto da IA e o que cada campo representa. Fica salvo no SQLite." />
        </div>

        <div className="sped-section-acoes">
          <span className="sped-badge sped-badge--ia">
            {totalAtivas}/{totalGeral} ativos na IA
          </span>
          <label className="sped-switch" htmlFor="toggle-dicionario-campos">
            <span className="sped-switch-label">
              {exibirCampos ? 'Ocultar campos' : 'Mostrar campos'}
            </span>
            <input
              id="toggle-dicionario-campos"
              type="checkbox"
              checked={exibirCampos}
              onChange={(e) => setExibirCampos(e.target.checked)}
            />
            <span className="sped-switch-track" aria-hidden="true" />
          </label>
        </div>
      </div>

      <div
        className="sped-meter"
        role="progressbar"
        aria-valuenow={pctAtivas}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Percentual de campos ativos na IA"
      >
        <span style={{ width: `${pctAtivas}%` }} />
      </div>

      {!exibirCampos && (
        <p className="sped-hint">
          Ative “Mostrar campos” para filtrar, descrever e escolher o que a IA enxerga em cada
          coluna.
        </p>
      )}

      {exibirCampos && (
        <>
          <div className="sped-filtros">
            <div className="sped-filtro-campo">
              <label htmlFor="filtro-origem">Parte da nota</label>
              <select
                id="filtro-origem"
                className="sped-select"
                value={filtroTabela}
                onChange={(e) => onChangeFiltroTabela(e.target.value)}
              >
                <option value="TODAS">Cabeçalho e Itens</option>
                <option value="MOVIMENTOS">Só Cabeçalho (MOVIMENTOS)</option>
                <option value="MOVIMENTOS_ITENS">Só Itens (MOVIMENTOS_ITENS)</option>
              </select>
            </div>

            <div className="sped-filtro-campo">
              <label htmlFor="filtro-uso-ia">Uso na IA</label>
              <select
                id="filtro-uso-ia"
                className="sped-select"
                value={filtroRelevancia}
                onChange={(e) => onChangeFiltroRelevancia(e.target.value as FiltroRelevancia)}
              >
                <option value="TODAS">Todos os campos</option>
                <option value="RELEVANTES">Apenas marcados p/ IA</option>
                <option value="NAO_RELEVANTES">Apenas desmarcados</option>
              </select>
            </div>

            <div className="sped-filtro-campo">
              <label htmlFor="filtro-grupo">Grupo</label>
              <select
                id="filtro-grupo"
                className="sped-select"
                value={filtroCategoria}
                onChange={(e) => onChangeFiltroCategoria(e.target.value)}
              >
                <option value="">Todos os grupos</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sped-filtro-campo">
              <label htmlFor="filtro-busca-campo">Buscar campo</label>
              <input
                id="filtro-busca-campo"
                type="text"
                className="sped-input"
                placeholder="Ex.: CHAVE, CFOP, ID_MOV..."
                value={busca}
                onChange={(e) => onChangeBusca(e.target.value)}
              />
            </div>
          </div>

          <div className="sped-filtro-rodape">
            <span className="sped-hint">Exibindo {totalFiltradas} campo(s).</span>
            {temFiltro && (
              <button type="button" className="sped-btn sped-btn-sm" onClick={limparFiltros}>
                Limpar filtros
              </button>
            )}
          </div>

          {loading && colunas.length === 0 ? (
            <p className="sped-hint">Carregando campos...</p>
          ) : (
            <div className="sped-table-wrap">
              <table className="sped-table">
                <thead>
                  <tr>
                    <th className="sped-col-ia">Na IA</th>
                    <th className="sped-col-campo">Campo</th>
                    <th className="sped-col-grupo">Grupo</th>
                    <th>O que significa</th>
                    <th className="sped-col-acoes">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {colunas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="sped-tabela-vazia">
                        Nenhum campo encontrado com esses filtros.
                      </td>
                    </tr>
                  ) : (
                    colunas.map((item) => (
                      <LinhaColunaFiscal
                        key={`${item.tabela}-${item.coluna}`}
                        item={item}
                        onToggle={() =>
                          onAtualizar(item, { relevante_sped: !item.relevante_sped })
                        }
                        onSalvar={(cat, desc) =>
                          onAtualizar(item, { categoria: cat, descricao: desc })
                        }
                        onExcluir={() => onRemover(item)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const LinhaColunaFiscal: React.FC<{
  item: ColunaFiscal;
  onToggle: () => Promise<void>;
  onSalvar: (categoria: string, descricao: string) => Promise<void>;
  onExcluir: () => Promise<void>;
}> = ({ item, onToggle, onSalvar, onExcluir }) => {
  const [cat, setCat] = useState(item.categoria);
  const [desc, setDesc] = useState(item.descricao);
  const [salvando, setSalvando] = useState(false);
  const alterado = cat !== item.categoria || desc !== item.descricao;

  useEffect(() => {
    setCat(item.categoria);
    setDesc(item.descricao);
  }, [item.categoria, item.descricao]);

  async function salvar() {
    if (!alterado || salvando) return;
    setSalvando(true);
    try {
      await onSalvar(cat, desc);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (window.confirm(`Excluir o campo ${item.coluna} do dicionário?`)) {
      await onExcluir();
    }
  }

  const ehCabecalho = item.tabela === 'MOVIMENTOS';

  return (
    <tr
      className={[
        alterado ? 'sped-row--alterada' : '',
        item.relevante_sped ? '' : 'sped-row--desativada',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <td>
        <label className="sped-switch" title="Enviar este campo para a IA">
          <input type="checkbox" checked={item.relevante_sped} onChange={onToggle} />
          <span className="sped-switch-track" aria-hidden="true" />
        </label>
      </td>
      <td>
        <span className="sped-campo-nome">{item.coluna}</span>
        <span
          className={`sped-campo-parte ${
            ehCabecalho ? 'sped-campo-parte--mov' : 'sped-campo-parte--itens'
          }`}
        >
          {ehCabecalho ? 'Cabeçalho' : 'Itens'}
        </span>
      </td>
      <td>
        <input
          type="text"
          className="sped-input sped-input--inline"
          value={cat}
          placeholder="Ex.: Nota, Imposto"
          aria-label={`Grupo do campo ${item.coluna}`}
          onChange={(e) => setCat(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') salvar();
          }}
        />
      </td>
      <td>
        <textarea
          rows={2}
          className="sped-input sped-input--inline"
          value={desc}
          placeholder="Ex.: Chave de acesso da NF-e"
          aria-label={`Descrição do campo ${item.coluna}`}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) salvar();
          }}
        />
      </td>
      <td>
        <div className="sped-row-acoes">
          <button
            type="button"
            className={`sped-btn sped-btn-sm ${alterado ? 'sped-btn-primary' : ''}`}
            disabled={!alterado || salvando}
            onClick={salvar}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" className="sped-btn sped-btn-sm sped-btn-danger" onClick={excluir}>
            Excluir
          </button>
        </div>
      </td>
    </tr>
  );
};