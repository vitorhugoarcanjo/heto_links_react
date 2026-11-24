import './LinksFooter.css';

interface LinksFooterProps {
  totalGrupos: number;
  totalLinksVisiveis: number;
  totalLinksGeral: number;
  modoEdicao: boolean;
  onToggleEdicao: () => void;
  onNovoGrupo: () => void;
  onNovoLink: () => void;
}

export function LinksFooter({
  totalGrupos,
  totalLinksVisiveis,
  totalLinksGeral,
  modoEdicao,
  onToggleEdicao,
  onNovoGrupo,
  onNovoLink,
}: LinksFooterProps) {
  return (
    <div className="links-page-footer">
      <div className="links-page-footer__stats">
        <span>
          Grupos: <strong>{totalGrupos}</strong>
        </span>
        <span>•</span>
        <span>
          Links: <strong>{totalLinksVisiveis}</strong>
          {totalLinksVisiveis !== totalLinksGeral ? ` / ${totalLinksGeral}` : ''}
        </span>
      </div>

      <div className="links-page-footer__actions">
        <button
          type="button"
          className={`btn-secondary ${modoEdicao ? 'btn-secondary--active' : ''}`}
          onClick={onToggleEdicao}
        >
          {modoEdicao ? '✓ Concluir Edição' : '✎ Editar'}
        </button>

        <button type="button" className="btn-secondary" onClick={onNovoGrupo}>
          + Grupo
        </button>

        <button type="button" className="btn-primary-novo" onClick={onNovoLink}>
          + Novo Link
        </button>
      </div>
    </div>
  );
}