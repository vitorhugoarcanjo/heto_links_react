import React, { useCallback, useState } from 'react';
import { SpedAnaliseModal } from '../components/sped_fisc/SpedAnaliseModal';
import { SpedColunasTable } from '../components/sped_fisc/SpedColunasTable';
import { SpedDiagnosticoForm } from '../components/sped_fisc/SpedDiagnosticoForm';
import { SpedDiagnosticoResult } from '../components/sped_fisc/SpedDiagnosticoResult';
import { SpedHeaderStats } from '../components/sped_fisc/SpedHeaderStats';
import { SpedImportarJsonModal } from '../components/sped_fisc/SpedImportarJsonModal';
import { useSpedFiscal } from '../hooks';
import './SpedFiscalPage.css';

export const SpedFiscalPage: React.FC = () => {
  const {
    colunas,
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
    loadingColunas,
    diagnosticando,
    erro,
    aviso,
    diagnostico,
    executarDiagnostico,
    atualizarColuna,
    removerColuna,
    importarJson,
  } = useSpedFiscal();

  const [abrirJson, setAbrirJson] = useState(false);
  const [ultimaQtdErros, setUltimaQtdErros] = useState(0);
  const [ultimoTemTxt, setUltimoTemTxt] = useState(false);
  const [txtOriginal, setTxtOriginal] = useState('');
  const [importandoTxt, setImportandoTxt] = useState(false);
  const [nomeArquivoTxt, setNomeArquivoTxt] = useState('');

  const totalAtivas = totais.relevantes_movimentos + totais.relevantes_itens;
  const totalGeral = totais.MOVIMENTOS + totais.MOVIMENTOS_ITENS;

  const handleImportacaoInicio = useCallback((nome: string) => {
    setNomeArquivoTxt(nome);
    setImportandoTxt(true);
  }, []);

  const handleImportacaoFim = useCallback(() => {
    setImportandoTxt(false);
  }, []);

  async function handleAnalisar(params: {
    mensagemErro: string;
    errosPva: string[];
    registroSped: string;
    conteudoTxt: string;
  }) {
    setUltimaQtdErros(params.errosPva.length);
    setUltimoTemTxt(Boolean(params.conteudoTxt.trim()));
    setTxtOriginal(params.conteudoTxt);
    await executarDiagnostico(params);
  }

  return (
    <section className="sped-page">
      <SpedAnaliseModal
        aberto={diagnosticando || importandoTxt}
        modo={importandoTxt ? 'importando' : 'analisando'}
        nomeArquivo={nomeArquivoTxt}
        qtdErros={ultimaQtdErros}
        temTxt={ultimoTemTxt || Boolean(txtOriginal.trim())}
      />

      <SpedHeaderStats totais={totais} />

      {erro && <div className="sped-alert-erro">{erro}</div>}
      {aviso && <div className="sped-alert-aviso">{aviso}</div>}

      <SpedDiagnosticoForm
        diagnosticando={diagnosticando}
        importandoTxt={importandoTxt}
        onImportacaoInicio={handleImportacaoInicio}
        onImportacaoFim={handleImportacaoFim}
        abrirJson={abrirJson}
        onToggleJson={() => setAbrirJson((v) => !v)}
        onAnalisar={handleAnalisar}
      />

      {abrirJson && (
        <SpedImportarJsonModal
          onImportar={importarJson}
          onFechar={() => setAbrirJson(false)}
        />
      )}

      {diagnostico && (
        <SpedDiagnosticoResult
          diagnostico={diagnostico}
          conteudoTxtOriginal={txtOriginal}
        />
      )}

      <SpedColunasTable
        colunas={colunas}
        categorias={categorias}
        totalFiltradas={totais.filtradas}
        totalAtivas={totalAtivas}
        totalGeral={totalGeral}
        filtroTabela={filtroTabela}
        onChangeFiltroTabela={setFiltroTabela}
        filtroRelevancia={filtroRelevancia}
        onChangeFiltroRelevancia={setFiltroRelevancia}
        filtroCategoria={filtroCategoria}
        onChangeFiltroCategoria={setFiltroCategoria}
        busca={busca}
        onChangeBusca={setBusca}
        loading={loadingColunas}
        onAtualizar={atualizarColuna}
        onRemover={removerColuna}
      />
    </section>
  );
};