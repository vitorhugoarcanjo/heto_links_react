import { type ReactNode } from 'react';
import type { AppConfig, RotaMenu } from '../../features/links-board/types';
import { GlobalFooter } from './GlobalFooter';
import './SidebarLayout.css';

interface SidebarLayoutProps {
  config: AppConfig;
  rotaAtiva: RotaMenu;
  onSelecionarRota: (rota: RotaMenu) => void;
  erroApi?: string | null;
  children: ReactNode;
}

export function SidebarLayout({
  config,
  rotaAtiva,
  onSelecionarRota,
  erroApi = null,
  children,
}: SidebarLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Menu principal">
        <div className="sidebar__brand">
          <div className="sidebar__logo">H</div>
          <div className="sidebar__brand-text">
            <span className="sidebar__title">HETOSOFT</span>
            <span className="sidebar__sub">{config.empresa}</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          <button
            type="button"
            className={`sidebar__item ${rotaAtiva === 'links' ? 'sidebar__item--active' : ''}`}
            onClick={() => onSelecionarRota('links')}
          >
            <span>🔗 Links</span>
          </button>

          <button
            type="button"
            className={`sidebar__item ${rotaAtiva === 'clientes' ? 'sidebar__item--active' : ''}`}
            onClick={() => onSelecionarRota('clientes')}
          >
            <span>🏢 Clientes</span>
            <span className="sidebar__badge">Em breve</span>
          </button>
        </nav>
      </aside>

      <div className="app-main-area">{children}</div>

      <GlobalFooter config={config} erroApi={erroApi} />
    </div>
  );
}