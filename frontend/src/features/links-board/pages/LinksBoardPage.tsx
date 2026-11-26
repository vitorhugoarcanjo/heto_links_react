import { useState } from 'react';
import { BoardColunas } from '../components/BoardColunas';
import { LinksFooter } from '../components/LinksFooter';
import { ModalGrupo } from '../components/ModalGrupo';
import { ModalLink } from '../components/ModalLink';
import { TabelaLinks } from '../components/TabelaLinks';
import { TopBarFiltro } from '../components/TopBarFiltro';
import { useLinksBoard } from '../hooks';
import type { GrupoLinks, LinkItem } from '../types';
import './LinksBoardPage.css';

interface LinksBoardPageProps {
  boardState?: ReturnType<typeof useLinksBoard>;
}

export function LinksBoardPage({ boardState }: LinksBoardPageProps) {
  const hookState = useLinksBoard();
  const state = boardState ?? hookState;

  const {
    grupos = [],
    gruposFiltrados = [],
    loading = false,
    erroApi = null,
    busca = '',
    setBusca,
    modoVisualizacao = 'colunas',
    setModoVisualizacao,
    modoEdicao = false,
    setModoEdicao,
    totalLinksVisiveis = 0,
    totalLinksGeral = 0,
    recarregar,
    salvarLink,
    excluirLink,
    salvarGrupo,
    excluirGrupo,
  } = state;

  const [modalLinkAberto, setModalLinkAberto] = useState(false);
  const [linkEmEdicao, setLinkEmEdicao] = useState<LinkItem | null>(null);

  const [modalGrupoAberto, setModalGrupoAberto] = useState(false);
  const [grupoEmEdicao, setGrupoEmEdicao] = useState<GrupoLinks | null>(null);

  const abrirNovoLink = () => {
    setLinkEmEdicao(null);
    setModalLinkAberto(true);
  };

  const abrirEditarLink = (link: LinkItem) => {
    setLinkEmEdicao(link);
    setModalLinkAberto(true);
  };

  const handleExcluirLink = async (link: LinkItem) => {
    if (!window.confirm(`Excluir o link "${link.titulo}"?`)) return;
    await excluirLink(link.id);
  };

  const abrirNovoGrupo = () => {
    setGrupoEmEdicao(null);
    setModalGrupoAberto(true);
  };

  const abrirEditarGrupo = (grupo: GrupoLinks) => {
    setGrupoEmEdicao(grupo);
    setModalGrupoAberto(true);
  };

  const handleExcluirGrupo = async (grupo: GrupoLinks) => {
    if (!window.confirm(`Excluir o grupo "${grupo.titulo}" e todos os links dele?`)) return;
    await excluirGrupo(grupo.id);
  };

  return (
    <main className="links-page">
      <TopBarFiltro
        busca={busca}
        onBuscaChange={setBusca}
        modoVisualizacao={modoVisualizacao}
        onModoChange={setModoVisualizacao}
      />

      {erroApi && (
        <div className="links-page__feedback">
          <span>{erroApi}</span>
          <button type="button" className="btn-secondary" onClick={() => recarregar(false)}>
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="links-page__loading">Carregando grupos e links...</div>
      ) : modoVisualizacao === 'colunas' ? (
        <BoardColunas
          grupos={gruposFiltrados}
          modoEdicao={modoEdicao}
          onEditarGrupo={abrirEditarGrupo}
          onExcluirGrupo={handleExcluirGrupo}
          onEditarLink={abrirEditarLink}
          onExcluirLink={handleExcluirLink}
        />
      ) : (
        <TabelaLinks
          grupos={gruposFiltrados}
          modoEdicao={modoEdicao}
          onEditarLink={abrirEditarLink}
          onExcluirLink={handleExcluirLink}
        />
      )}

      <LinksFooter
        totalGrupos={gruposFiltrados.length}
        totalLinksVisiveis={totalLinksVisiveis}
        totalLinksGeral={totalLinksGeral}
        modoEdicao={modoEdicao}
        onToggleEdicao={() => setModoEdicao((prev) => !prev)}
        onNovoGrupo={abrirNovoGrupo}
        onNovoLink={abrirNovoLink}
      />

      <ModalLink
        aberto={modalLinkAberto}
        grupos={grupos}
        linkEmEdicao={linkEmEdicao}
        onFechar={() => setModalLinkAberto(false)}
        onSalvar={salvarLink}
      />

      <ModalGrupo
        aberto={modalGrupoAberto}
        grupoEmEdicao={grupoEmEdicao}
        onFechar={() => setModalGrupoAberto(false)}
        onSalvar={salvarGrupo}
      />
    </main>
  );
}