import React, { useState } from 'react';

interface TopicoGuia {
  titulo: string;
  quandoUsar: string;
  oQueFaz: string;
}

const TOPICOS_GUIA: TopicoGuia[] = [
  {
    titulo: '1. Arquivo .txt e Erros do PVA',
    quandoUsar: 'Sempre que for analisar um arquivo SPED Fiscal gerado pelo sistema.',
    oQueFaz:
      'Recebe o .txt e os erros do PVA (ou faz varredura se você deixar os erros em branco). Com o filtro de Registro/Chave/ID, foca na nota ou linha problemática.',
  },
  {
    titulo: '2. Resultado do Diagnóstico e .txt Sugerido',
    quandoUsar: 'Logo após clicar em "Analisar SPED com IA".',
    oQueFaz:
      'Explica o problema, indica onde olhar na nota/sistema e nos campos de Cabeçalho ou Itens, e gera um trecho sugerido com botão de copiar para conferir antes de aplicar no PVA.',
  },
  {
    titulo: '3. Dicionário de Campos (SQLite)',
    quandoUsar: 'Para calibrar quais colunas do sistema ajudam a IA a achar os dados corretos.',
    oQueFaz:
      'Permite marcar "Usar na IA", agrupar por categoria e descrever o que cada campo guarda (ex.: chave de acesso, ID do movimento, CFOP, CST). Salva direto no SQLite.',
  },
  {
    titulo: '4. Importar Lista de Colunas (JSON)',
    quandoUsar: 'Quando quiser carregar ou atualizar em lote as colunas de MOVIMENTOS e MOVIMENTOS_ITENS.',
    oQueFaz:
      'Atualiza a lista de campos armazenada no SQLite a partir do JSON exportado.',
  },
];

export const SpedGuiaFuncionalidades: React.FC = () => {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="sped-card sped-guia-card">
      <div className="sped-section-title">
        <div>
          <h3>Como este módulo funciona (Guia Rápido)</h3>
          <p className="sped-hint">
            Resumo direto de cada bloco da tela para consulta rápida ou apresentação para a equipe.
          </p>
        </div>
        <button type="button" className="sped-btn" onClick={() => setAberto((v) => !v)}>
          {aberto ? 'Esconder guia' : 'Ver como funciona'}
        </button>
      </div>

      {aberto && (
        <div className="sped-guia-grid">
          {TOPICOS_GUIA.map((topico) => (
            <div key={topico.titulo} className="sped-guia-item">
              <strong>{topico.titulo}</strong>
              <p className="sped-resultado-texto">
                <span className="sped-mini-label">Quando usar:</span>
                {topico.quandoUsar}
              </p>
              <p className="sped-resultado-texto">
                <span className="sped-mini-label">O que faz:</span>
                {topico.oQueFaz}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};