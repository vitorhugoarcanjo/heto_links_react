import React, { useRef } from 'react';
import type { ModeloDocumentoFiscal } from '../../../../types/navigation';
import { formatarCnpj } from '../../utils/nfeNfceUtils';

interface EmpresaModeloCardProps {
  modeloDocumento: ModeloDocumentoFiscal;
  onChangeModelo: (modelo: ModeloDocumentoFiscal) => void;
  nomeEmpresa: string;
  onChangeNomeEmpresa: (valor: string) => void;
  cnpjEmpresa: string;
  onChangeCnpjEmpresa: (valor: string) => void;
}

export const EmpresaModeloCard: React.FC<EmpresaModeloCardProps> = ({
  modeloDocumento,
  onChangeModelo,
  nomeEmpresa,
  onChangeNomeEmpresa,
  cnpjEmpresa,
  onChangeCnpjEmpresa,
}) => {
  const cnpjRef = useRef<HTMLInputElement>(null);

  function handleKeyDownEmpresa(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      cnpjRef.current?.focus();
    }
  }

  function handleKeyDownCnpj(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const campoSerie = document.getElementById('doc-serie') as HTMLInputElement | null;
      campoSerie?.focus();
    }
  }

  return (
    <div className="sped-card">
      <div className="sped-section-title">
        <h3>Empresa e Modelo</h3>
        <div className="sped-actions" style={{ marginTop: 0 }}>
          <button
            type="button"
            className={`sped-btn sped-btn-sm ${modeloDocumento === 'NF-E' ? 'sped-btn-primary' : ''}`}
            onClick={() => onChangeModelo('NF-E')}
          >
            NF-E
          </button>
          <button
            type="button"
            className={`sped-btn sped-btn-sm ${modeloDocumento === 'NFC-E' ? 'sped-btn-primary' : ''}`}
            onClick={() => onChangeModelo('NFC-E')}
          >
            NFC-E
          </button>
        </div>
      </div>

      <div className="sped-grid-2">
        <div className="sped-form-group">
          <label htmlFor="empresa-nome">Razão Social / Nome da Empresa</label>
          <input
            id="empresa-nome"
            type="text"
            className="sped-input"
            placeholder="Ex.: Empresa Exemplo Ltda"
            value={nomeEmpresa}
            onChange={(e) => onChangeNomeEmpresa(e.target.value)}
            onKeyDown={handleKeyDownEmpresa}
          />
        </div>

        <div className="sped-form-group">
          <label htmlFor="empresa-cnpj">CNPJ</label>
          <input
            ref={cnpjRef}
            id="empresa-cnpj"
            type="text"
            inputMode="numeric"
            maxLength={18}
            className="sped-input"
            placeholder="00.000.000/0000-00"
            value={cnpjEmpresa}
            onChange={(e) => onChangeCnpjEmpresa(formatarCnpj(e.target.value))}
            onKeyDown={handleKeyDownCnpj}
          />
        </div>
      </div>
    </div>
  );
};