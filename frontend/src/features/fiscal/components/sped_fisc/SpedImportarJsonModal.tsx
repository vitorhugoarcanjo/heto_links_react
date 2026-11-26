import React, { useState } from 'react';
import { AjudaBloco } from './AjudaBloco';

interface SpedImportarJsonModalProps {
  onImportar: (rawJson: string) => Promise<boolean>;
  onFechar: () => void;
}

export const SpedImportarJsonModal: React.FC<SpedImportarJsonModalProps> = ({
  onImportar,
  onFechar,
}) => {
  const [jsonTexto, setJsonTexto] = useState('');

  async function handleSalvar() {
    const ok = await onImportar(jsonTexto);
    if (ok) {
      setJsonTexto('');
      onFechar();
    }
  }

  return (
    <div className="sped-card">
      <div className="sped-section-title">
        <div className="sped-titulo-com-ajuda">
          <h3>Importar Colunas do ERP (JSON)</h3>
          <AjudaBloco texto="Carrega ou atualiza em lote os campos de MOVIMENTOS e MOVIMENTOS_ITENS no banco SQLite." />
        </div>
      </div>
      <div className="sped-form-group">
        <label htmlFor="sped-json-import">
          Cole o JSON contendo as tabelas MOVIMENTOS e MOVIMENTOS_ITENS
        </label>
        <textarea
          id="sped-json-import"
          className="sped-textarea sped-textarea--json"
          placeholder='{"tabelas": {"MOVIMENTOS": [...], "MOVIMENTOS_ITENS": [...]}}'
          value={jsonTexto}
          onChange={(e) => setJsonTexto(e.target.value)}
        />
      </div>
      <div className="sped-actions">
        <button type="button" className="sped-btn sped-btn-primary" onClick={handleSalvar}>
          Salvar no Banco SQLite
        </button>
        <button type="button" className="sped-btn" onClick={onFechar}>
          Cancelar
        </button>
      </div>
    </div>
  );
};