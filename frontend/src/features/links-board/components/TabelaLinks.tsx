import type { GrupoLinks, LinkItem } from '../types';
import './TabelaLinks.css';

interface TabelaLinksProps {
  grupos: GrupoLinks[];
  modoEdicao: boolean;
  onEditarLink: (link: LinkItem) => void;
  onExcluirLink: (link: LinkItem) => void;
}

export function TabelaLinks({
  grupos,
  modoEdicao,
  onEditarLink,
  onExcluirLink,
}: TabelaLinksProps) {
  const linhas = grupos.flatMap((grupo) =>
    grupo.links.map((link) => ({
      link,
      grupoTitulo: grupo.titulo,
      grupoCor: grupo.cor_topo,
    }))
  );

  if (linhas.length === 0) {
    return (
      <div className="board-empty">
        Nenhum link encontrado para exibir na tabela.
      </div>
    );
  }

  return (
    <div className="tabela-wrapper">
      <table className="tabela-links">
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Título</th>
            <th>URL</th>
            {modoEdicao && <th style={{ textAlign: 'right' }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ link, grupoTitulo, grupoCor }) => (
            <tr key={link.id}>
              <td>
                <span className="tabela-links__grupo-badge">
                  <span
                    className="tabela-links__dot"
                    style={{ backgroundColor: grupoCor }}
                  />
                  {grupoTitulo}
                </span>
              </td>
              <td>
                <a
                  href={link.url}
                  target={link.abrir_nova_aba ? '_blank' : '_self'}
                  rel={link.abrir_nova_aba ? 'noopener noreferrer' : undefined}
                  className="tabela-links__link"
                >
                  {link.titulo}
                </a>
              </td>
              <td>
                <span className="tabela-links__url" title={link.url}>
                  {link.url}
                </span>
              </td>
              {modoEdicao && (
                <td>
                  <div className="tabela-links__acoes">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Editar link"
                      onClick={() => onEditarLink(link)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      title="Excluir link"
                      onClick={() => onExcluirLink(link)}
                    >
                      🗑
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}