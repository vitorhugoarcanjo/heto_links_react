import React from 'react';

interface SpedHeaderStatsProps {
  totais: {
    MOVIMENTOS: number;
    MOVIMENTOS_ITENS: number;
    relevantes_movimentos: number;
    relevantes_itens: number;
    filtradas: number;
  };
}

export const SpedHeaderStats: React.FC<SpedHeaderStatsProps> = ({ totais }) => {
  return (
    <header className="sped-header">
      <div>
        <h2>Diagnóstico SPED Fiscal</h2>
        <p className="sped-subtitle">
          Envie o .txt do SPED e os erros do PVA para localizar onde corrigir no sistema.
        </p>
      </div>

      <div className="sped-stats">
        <div className="sped-stat-pill">
          <span className="sped-stat-label">Cabeçalho (MOVIMENTOS)</span>
          <strong>
            {totais.relevantes_movimentos} ativas / {totais.MOVIMENTOS}
          </strong>
        </div>
        <div className="sped-stat-pill">
          <span className="sped-stat-label">Itens (MOVIMENTOS_ITENS)</span>
          <strong>
            {totais.relevantes_itens} ativas / {totais.MOVIMENTOS_ITENS}
          </strong>
        </div>
      </div>
    </header>
  );
};