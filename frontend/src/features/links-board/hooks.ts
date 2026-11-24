import { useCallback, useEffect, useMemo, useState } from 'react';
import { FALLBACK_CONFIG, linksApi } from './api';
import type { AppConfig, GrupoLinks, GrupoPayload, LinkPayload, ModoVisualizacao } from './types';

export function useLinksBoard() {
  const [config, setConfig] = useState<AppConfig>(FALLBACK_CONFIG);
  const [grupos, setGrupos] = useState<GrupoLinks[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>('colunas');
  const [modoEdicao, setModoEdicao] = useState(false);

  const recarregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setErroApi(null);
    try {
      const [cfg, board] = await Promise.all([linksApi.obterConfig(), linksApi.carregarBoard()]);
      setConfig(cfg);
      setGrupos(Array.isArray(board) ? board : []);
    } catch (err) {
      setErroApi(err instanceof Error ? err.message : 'Falha ao conectar na API.');
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, []);

  useEffect(() => {
    recarregar(false);
  }, [recarregar]);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return grupos;

    return grupos
      .map((grupo) => {
        const bateGrupo = grupo.titulo.toLowerCase().includes(termo);
        const linksBatendo = (grupo.links || []).filter(
          (l) =>
            l.titulo.toLowerCase().includes(termo) ||
            l.url.toLowerCase().includes(termo) ||
            (l.descricao && l.descricao.toLowerCase().includes(termo))
        );
        if (bateGrupo) return grupo;
        if (linksBatendo.length > 0) return { ...grupo, links: linksBatendo };
        return null;
      })
      .filter((g): g is GrupoLinks => g !== null);
  }, [grupos, busca]);

  const totalLinksVisiveis = useMemo(
    () => gruposFiltrados.reduce((acc, g) => acc + (g.links?.length || 0), 0),
    [gruposFiltrados]
  );

  const totalLinksGeral = useMemo(
    () => grupos.reduce((acc, g) => acc + (g.links?.length || 0), 0),
    [grupos]
  );

  const salvarLink = async (payload: LinkPayload, linkId?: number) => {
    if (linkId) {
      await linksApi.editarLink(linkId, payload);
    } else {
      await linksApi.criarLink(payload);
    }
    const board = await linksApi.carregarBoard();
    setGrupos(Array.isArray(board) ? board : []);
  };

  const excluirLink = async (linkId: number) => {
    await linksApi.excluirLink(linkId);
    const board = await linksApi.carregarBoard();
    setGrupos(Array.isArray(board) ? board : []);
  };

  const salvarGrupo = async (payload: GrupoPayload, grupoId?: number) => {
    if (grupoId) {
      await linksApi.editarGrupo(grupoId, payload);
    } else {
      await linksApi.criarGrupo(payload);
    }
    const board = await linksApi.carregarBoard();
    setGrupos(Array.isArray(board) ? board : []);
  };

  const excluirGrupo = async (grupoId: number) => {
    await linksApi.excluirGrupo(grupoId);
    const board = await linksApi.carregarBoard();
    setGrupos(Array.isArray(board) ? board : []);
  };

  return {
    config,
    grupos,
    gruposFiltrados,
    loading,
    erroApi,
    busca,
    setBusca,
    modoVisualizacao,
    setModoVisualizacao,
    modoEdicao,
    setModoEdicao,
    totalLinksVisiveis,
    totalLinksGeral,
    recarregar,
    salvarLink,
    excluirLink,
    salvarGrupo,
    excluirGrupo,
  };
}