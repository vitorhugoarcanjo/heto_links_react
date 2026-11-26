import { useCallback, useEffect, useMemo, useState } from 'react';
import { spedFiscalApi } from './api';
import type {
  ColunaFiscal,
  DiagnosticoFiscalResultado,
  FiltroRelevancia,
} from './types';

export function useSpedFiscal() {
  const [todasColunas, setTodasColunas] = useState<ColunaFiscal[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [totaisBase, setTotaisBase] = useState({
    MOVIMENTOS: 0,
    MOVIMENTOS_ITENS: 0,
    relevantes_movimentos: 0,
    relevantes_itens: 0,
  });

  const [filtroTabela, setFiltroTabela] = useState('TODAS');
  const [filtroRelevancia, setFiltroRelevancia] = useState<FiltroRelevancia>('TODAS');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busca, setBusca] = useState('');

  const [loadingInicial, setLoadingInicial] = useState(true);
  const [diagnosticando, setDiagnosticando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [diagnostico, setDiagnostico] = useState<DiagnosticoFiscalResultado | null>(null);

  const sincronizarBase = useCallback(async (mostrarLoading = false) => {
    if (mostrarLoading) setLoadingInicial(true);
    setErro(null);
    try {
      const resp = await spedFiscalApi.listarColunas({});
      setTodasColunas(resp.colunas);
      setCategorias(resp.categorias);
      setTotaisBase({
        MOVIMENTOS: resp.totais.MOVIMENTOS,
        MOVIMENTOS_ITENS: resp.totais.MOVIMENTOS_ITENS,
        relevantes_movimentos: resp.totais.relevantes_movimentos,
        relevantes_itens: resp.totais.relevantes_itens,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao carregar colunas do SPED Fiscal.');
    } finally {
      if (mostrarLoading) setLoadingInicial(false);
    }
  }, []);

  useEffect(() => {
    sincronizarBase(true);
  }, [sincronizarBase]);

  const colunasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const catFiltro = filtroCategoria.trim().toLowerCase();

    return todasColunas.filter((c) => {
      if (filtroTabela !== 'TODAS' && c.tabela !== filtroTabela) return false;
      if (filtroRelevancia === 'RELEVANTES' && !c.relevante_sped) return false;
      if (filtroRelevancia === 'NAO_RELEVANTES' && c.relevante_sped) return false;
      if (catFiltro && !c.categoria.toLowerCase().includes(catFiltro)) return false;
      if (
        termo &&
        !(
          c.coluna.toLowerCase().includes(termo) ||
          c.categoria.toLowerCase().includes(termo) ||
          c.descricao.toLowerCase().includes(termo) ||
          c.tabela.toLowerCase().includes(termo)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [todasColunas, filtroTabela, filtroRelevancia, filtroCategoria, busca]);

  const totais = useMemo(() => {
    const relevantesMov = todasColunas.filter(
      (c) => c.tabela === 'MOVIMENTOS' && c.relevante_sped
    ).length;
    const relevantesItens = todasColunas.filter(
      (c) => c.tabela === 'MOVIMENTOS_ITENS' && c.relevante_sped
    ).length;
    const totalMov = todasColunas.filter((c) => c.tabela === 'MOVIMENTOS').length;
    const totalItens = todasColunas.filter((c) => c.tabela === 'MOVIMENTOS_ITENS').length;

    return {
      MOVIMENTOS: totalMov || totaisBase.MOVIMENTOS,
      MOVIMENTOS_ITENS: totalItens || totaisBase.MOVIMENTOS_ITENS,
      relevantes_movimentos: relevantesMov,
      relevantes_itens: relevantesItens,
      filtradas: colunasFiltradas.length,
    };
  }, [todasColunas, totaisBase, colunasFiltradas.length]);

  const executarDiagnostico = async (params: {
    mensagemErro?: string;
    errosPva?: string[];
    registroSped?: string;
    conteudoTxt?: string;
  }) => {
    const temEntrada =
      Boolean(params.mensagemErro?.trim()) ||
      Boolean(params.errosPva && params.errosPva.length > 0) ||
      Boolean(params.conteudoTxt?.trim());
    if (!temEntrada) return;

    setDiagnosticando(true);
    setErro(null);
    setAviso(null);
    try {
      const res = await spedFiscalApi.diagnosticar({
        mensagem_erro: params.mensagemErro,
        erros_pva: params.errosPva,
        registro_sped: params.registroSped,
        conteudo_txt: params.conteudoTxt,
      });
      setDiagnostico(res);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao diagnosticar SPED Fiscal.');
    } finally {
      setDiagnosticando(false);
    }
  };

  const atualizarColuna = async (
    item: ColunaFiscal,
    patch: { relevante_sped?: boolean; categoria?: string; descricao?: string }
  ) => {
    setErro(null);
    const anterior = todasColunas;
    const proximoItem: ColunaFiscal = {
      ...item,
      relevante_sped:
        patch.relevante_sped !== undefined ? patch.relevante_sped : item.relevante_sped,
      categoria: patch.categoria !== undefined ? patch.categoria.trim() : item.categoria,
      descricao: patch.descricao !== undefined ? patch.descricao.trim() : item.descricao,
    };

    setTodasColunas((prev) =>
      prev.map((c) =>
        c.tabela === item.tabela && c.coluna === item.coluna ? proximoItem : c
      )
    );
    if (proximoItem.categoria) {
      setCategorias((prev) =>
        prev.includes(proximoItem.categoria) ? prev : [...prev, proximoItem.categoria].sort()
      );
    }
    setAviso(`Salvo: ${item.coluna}`);

    try {
      const salva = await spedFiscalApi.editarColuna({
        tabela: item.tabela,
        coluna: item.coluna,
        ...patch,
      });
      setTodasColunas((prev) =>
        prev.map((c) =>
          c.tabela === item.tabela && c.coluna === item.coluna ? salva : c
        )
      );
    } catch (err) {
      setTodasColunas(anterior);
      setErro(err instanceof Error ? err.message : 'Falha ao atualizar coluna.');
    }
  };

  const removerColuna = async (item: ColunaFiscal) => {
    setErro(null);
    const anterior = todasColunas;
    setTodasColunas((prev) =>
      prev.filter((c) => !(c.tabela === item.tabela && c.coluna === item.coluna))
    );
    setAviso(`Removido: ${item.coluna}`);

    try {
      await spedFiscalApi.excluirColuna(item.tabela, item.coluna);
    } catch (err) {
      setTodasColunas(anterior);
      setErro(err instanceof Error ? err.message : 'Falha ao excluir coluna.');
    }
  };

  const importarJson = async (rawJson: string) => {
    setErro(null);
    setAviso(null);
    try {
      const parsed = JSON.parse(rawJson);
      await spedFiscalApi.importarJson(parsed);
      await sincronizarBase(false);
      setAviso('Lista de colunas atualizada.');
      return true;
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'JSON inválido.');
      return false;
    }
  };

  return {
    colunas: colunasFiltradas,
    categorias,
    totais,
    filtroTabela,
    setFiltroTabela,
    filtroRelevancia,
    setFiltroRelevancia,
    filtroCategoria,
    setFiltroCategoria,
    busca,
    setBusca,
    loadingColunas: loadingInicial,
    diagnosticando,
    erro,
    aviso,
    diagnostico,
    executarDiagnostico,
    atualizarColuna,
    removerColuna,
    importarJson,
  };
}