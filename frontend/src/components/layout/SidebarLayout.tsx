import { useEffect, useState, type ReactNode } from 'react';
import type { AppConfig } from '../../features/links-board/types';
import type { RotaMenu } from '../../types/navigation';
import { GlobalFooter } from './GlobalFooter';
import './SidebarLayout.css';

interface SidebarLayoutProps {
  config: AppConfig;
  rotaAtiva: RotaMenu;
  onSelecionarRota: (rota: RotaMenu) => void;
  erroApi?: string | null;
  children: ReactNode;
}

const ROTAS_FISCAL: RotaMenu[] = [
  'sped_fiscal',
  'sped_contribuicoes',
  'preenchimento_nfe_nfce',
];

export function SidebarLayout({
  config,
  rotaAtiva,
  onSelecionarRota,
  erroApi = null,
  children,
}: SidebarLayoutProps) {
  const isFiscalAtivo = ROTAS_FISCAL.includes(rotaAtiva);
  const [fiscalAberto, setFiscalAberto] = useState<boolean>(isFiscalAtivo);

  useEffect(() => {
    if (isFiscalAtivo) {
      setFiscalAberto(true);
    }
  }, [isFiscalAtivo]);

  function handleToggleFiscal() {
    setFiscalAberto((prev) => !prev);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Menu principal">
        <div className="sidebar__brand">
          <div className="sidebar__logo">H</div>
          <div className="sidebar__brand-text">
            <span className="sidebar__title">BUSCA DE AJUDA</span>
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

          <div className="sidebar__group">
            <button
              type="button"
              className={`sidebar__item sidebar__item--toggle ${
                isFiscalAtivo ? 'sidebar__item--parent-active' : ''
              }`}
              aria-expanded={fiscalAberto}
              onClick={handleToggleFiscal}
            >
              <span>📊 Fiscal</span>
              <span
                className={`sidebar__caret ${fiscalAberto ? 'sidebar__caret--open' : ''}`}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>

            {fiscalAberto && (
              <div className="sidebar__submenu" role="group" aria-label="Submódulos de Fiscal">
                <button
                  type="button"
                  className={`sidebar__subitem ${
                    rotaAtiva === 'sped_fiscal' ? 'sidebar__subitem--active' : ''
                  }`}
                  onClick={() => onSelecionarRota('sped_fiscal')}
                >
                  <span>SPED Fiscal</span>
                </button>

                <button
                  type="button"
                  className={`sidebar__subitem ${
                    rotaAtiva === 'sped_contribuicoes' ? 'sidebar__subitem--active' : ''
                  }`}
                  onClick={() => onSelecionarRota('sped_contribuicoes')}
                >
                  <span>SPED Contribuições</span>
                  <span className="sidebar__badge">Futuro</span>
                </button>

                <button
                  type="button"
                  className={`sidebar__subitem ${
                    rotaAtiva === 'preenchimento_nfe_nfce' ? 'sidebar__subitem--active' : ''
                  }`}
                  onClick={() => onSelecionarRota('preenchimento_nfe_nfce')}
                >
                  <span>Preenchimento NF-e e NFC-e</span>
                </button>
              </div>
            )}
          </div>

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