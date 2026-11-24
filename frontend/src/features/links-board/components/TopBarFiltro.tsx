import type { ModoVisualizacao } from '../types';
import './TopBarFiltro.css';

interface TopBarFiltroProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  modoVisualizacao: ModoVisualizacao;
  onModoChange: (modo: ModoVisualizacao) => void;
}

export function TopBarFiltro({
  busca,
  onBuscaChange,
  modoVisualizacao,
  onModoChange,
}: TopBarFiltroProps) {
  return (
    <header className="topbar-links">
      <div className="topbar-links__heading">
        <h1>Links e Portais</h1>
        <p>Acesso rápido por grupos ou tabela direta</p>
      </div>

      <div className="topbar-links__controls">
        <div className="search-box">
          <span className="search-box__icon">⌕</span>
          <input
            type="text"
            className="search-box__input"
            placeholder="Buscar link, grupo ou URL..."
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
          />
          {busca && (
            <button
              type="button"
              className="search-box__clear"
              onClick={() => onBuscaChange('')}
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        <div className="view-switcher" role="group" aria-label="Modo de visualização">
          <button
            type="button"
            className={`view-switcher__btn ${modoVisualizacao === 'colunas' ? 'view-switcher__btn--active' : ''}`}
            onClick={() => onModoChange('colunas')}
          >
            Colunas
          </button>
          <button
            type="button"
            className={`view-switcher__btn ${modoVisualizacao === 'tabela' ? 'view-switcher__btn--active' : ''}`}
            onClick={() => onModoChange('tabela')}
          >
            Tabela
          </button>
        </div>
      </div>
    </header>
  );
}