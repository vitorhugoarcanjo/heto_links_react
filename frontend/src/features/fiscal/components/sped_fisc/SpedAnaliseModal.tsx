import React, { useEffect, useState } from 'react';

interface SpedAnaliseModalProps {
  aberto: boolean;
  modo?: 'analisando' | 'importando';
  nomeArquivo?: string;
  qtdErros: number;
  temTxt: boolean;
}

const ETAPAS_ANALISE = [
  'Coletando campos ativos no banco SQLite...',
  'Lendo linhas do .txt e erros do PVA...',
  'Consultando a IA para diagnosticar os pontos...',
  'Organizando os resultados na tela...',
];

export const SpedAnaliseModal: React.FC<SpedAnaliseModalProps> = ({
  aberto,
  modo = 'analisando',
  nomeArquivo = '',
  qtdErros,
  temTxt,
}) => {
  const [indiceEtapa, setIndiceEtapa] = useState(0);

  useEffect(() => {
    if (!aberto || modo !== 'analisando') {
      setIndiceEtapa(0);
      return;
    }
    const timer = setInterval(() => {
      setIndiceEtapa((prev) => (prev < ETAPAS_ANALISE.length - 1 ? prev + 1 : prev));
    }, 1400);
    return () => clearInterval(timer);
  }, [aberto, modo]);

  if (!aberto) return null;

  const importando = modo === 'importando';

  return (
    <div
      className="sped-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sped-modal-titulo"
    >
      <div className="sped-modal-box">
        <div className="sped-modal-spinner" aria-hidden="true" />
        <h3 id="sped-modal-titulo">
          {importando ? 'Importando arquivo .txt' : 'Analisando SPED Fiscal'}
        </h3>
        <p className="sped-modal-etapa">
          {importando
            ? `Carregando ${nomeArquivo || 'o arquivo'} no campo de texto...`
            : ETAPAS_ANALISE[indiceEtapa]}
        </p>

        {!importando && (
          <div className="sped-modal-meta">
            <span>{qtdErros > 0 ? `${qtdErros} erro(s) na fila` : 'Varredura automática'}</span>
            <span>·</span>
            <span>{temTxt ? 'Arquivo .txt carregado' : 'Sem .txt anexado'}</span>
          </div>
        )}

        <p className="sped-hint">
          {importando
            ? 'A tela ficará bloqueada até o conteúdo terminar de carregar.'
            : 'Aguarde a conclusão para evitar cliques duplicados durante a análise.'}
        </p>
      </div>
    </div>
  );
};