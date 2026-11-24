import type { GrupoLinks, LinkItem } from '../types';
import { ColunaGrupo } from './ColunaGrupo';
import './BoardColunas.css';

interface BoardColunasProps {
  grupos: GrupoLinks[];
  modoEdicao: boolean;
  onEditarGrupo: (grupo: GrupoLinks) => void;
  onExcluirGrupo: (grupo: GrupoLinks) => void;
  onEditarLink: (link: LinkItem) => void;
  onExcluirLink: (link: LinkItem) => void;
}

export function BoardColunas({
  grupos,
  modoEdicao,
  onEditarGrupo,
  onExcluirGrupo,
  onEditarLink,
  onExcluirLink,
}: BoardColunasProps) {
  if (grupos.length === 0) {
    return (
      <div className="board-empty">
        Nenhum grupo ou link encontrado para o filtro atual.
      </div>
    );
  }

  return (
    <section className="board-colunas" aria-label="Grupos de links">
      {grupos.map((grupo) => (
        <ColunaGrupo
          key={grupo.id}
          grupo={grupo}
          modoEdicao={modoEdicao}
          onEditarGrupo={onEditarGrupo}
          onExcluirGrupo={onExcluirGrupo}
          onEditarLink={onEditarLink}
          onExcluirLink={onExcluirLink}
        />
      ))}
    </section>
  );
}