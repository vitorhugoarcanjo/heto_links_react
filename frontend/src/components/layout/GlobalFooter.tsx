import type { AppConfig } from '../../features/links-board/types';
import './GlobalFooter.css';

interface GlobalFooterProps {
  config: AppConfig;
  erroApi?: string | null;
}

export function GlobalFooter({ config, erroApi = null }: GlobalFooterProps) {
  return (
    <footer className="global-footer" role="contentinfo">
      <div className="global-footer__left">
        <span
          className={`global-footer__dot ${erroApi ? 'global-footer__dot--erro' : ''}`}
          title={erroApi ? erroApi : 'Backend Flask conectado'}
        />
        <span>{config.empresa}</span>
      </div>

      <div className="global-footer__right">
        <span>{config.nome_sistema}</span>
        <span className="global-footer__version">{config.versao}</span>
      </div>
    </footer>
  );
}