import type { CSSProperties } from 'react';
import type { GrupoLinks, LinkItem } from '../types';
import './ColunaGrupo.css';

interface ColunaGrupoProps {
  grupo: GrupoLinks;
  modoEdicao: boolean;
  onEditarGrupo: (grupo: GrupoLinks) => void;
  onExcluirGrupo: (grupo: GrupoLinks) => void;
  onEditarLink: (link: LinkItem) => void;
  onExcluirLink: (link: LinkItem) => void;
}

function obterFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
  } catch {
    return '';
  }
}

export function ColunaGrupo({
  grupo,
  modoEdicao,
  onEditarGrupo,
  onExcluirGrupo,
  onEditarLink,
  onExcluirLink,
}: ColunaGrupoProps) {
  const styleVar = { '--grupo-cor': grupo.cor_topo } as CSSProperties;

  return (
    <article className="coluna-grupo" style={styleVar}>
      <div className="coluna-grupo__header">
        <div className="coluna-grupo__title-wrap">
          <span className="coluna-grupo__dot" />
          <h2 className="coluna-grupo__title" title={grupo.titulo}>
            {grupo.titulo}
          </h2>
          <span className="coluna-grupo__count">{grupo.links.length}</span>
        </div>

        {modoEdicao && (
          <div className="coluna-grupo__actions">
            <button
              type="button"
              className="icon-btn"
              title="Editar grupo"
              onClick={() => onEditarGrupo(grupo)}
            >
              ✎
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--danger"
              title="Excluir grupo"
              onClick={() => onExcluirGrupo(grupo)}
            >
              🗑
            </button>
          </div>
        )}
      </div>

      <div className="coluna-grupo__list">
        {grupo.links.length === 0 ? (
          <div className="coluna-grupo__empty">Nenhum link neste grupo</div>
        ) : (
          grupo.links.map((link) => {
            const favicon = obterFaviconUrl(link.url);
            return (
              <div key={link.id} className="link-row">
                <a
                  href={link.url}
                  target={link.abrir_nova_aba ? '_blank' : '_self'}
                  rel={link.abrir_nova_aba ? 'noopener noreferrer' : undefined}
                  className="link-row__anchor"
                  title={link.url}
                >
                  {favicon && (
                    <img
                      src={favicon}
                      alt=""
                      className="link-row__favicon"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="link-row__text">
                    <span className="link-row__label">{link.titulo}</span>
                    {link.descricao && (
                      <span className="link-row__desc">{link.descricao}</span>
                    )}
                  </div>
                  {!modoEdicao && <span className="link-row__arrow">↗</span>}
                </a>

                {modoEdicao && (
                  <div className="link-row__edit-actions">
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
                )}
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}