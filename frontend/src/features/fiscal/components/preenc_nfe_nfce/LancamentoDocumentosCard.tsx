import React, { useRef } from 'react';
import { formatarMesAno } from '../../utils/nfeNfceUtils';
import '../../pages/SpedFiscalPage.css';

interface LancamentoDocumentosCardProps {
  serie: string;
  onChangeSerie: (valor: string) => void;
  onExcedeuSerie: () => void;
  mesAnoEmissao: string;
  onChangeMesAnoEmissao: (valor: string) => void;
  mesAnoProtocolo: string;
  onChangeMesAnoProtocolo: (valor: string) => void;
  numerosTexto: string;
  onChangeNumerosTexto: (valor: string) => void;
  onAdicionar: (e: React.FormEvent) => void;
}

export const LancamentoDocumentosCard: React.FC<LancamentoDocumentosCardProps> = ({
  serie,
  onChangeSerie,
  onExcedeuSerie,
  mesAnoEmissao,
  onChangeMesAnoEmissao,
  mesAnoProtocolo,
  onChangeMesAnoProtocolo,
  numerosTexto,
  onChangeNumerosTexto,
  onAdicionar,
}) => {
  const emissaoRef = useRef<HTMLInputElement>(null);
  const protocoloRef = useRef<HTMLInputElement>(null);
  const numerosRef = useRef<HTMLTextAreaElement>(null);

  function handleSerieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, '');
    if (digitos.length > 3) {
      onExcedeuSerie();
    }
    onChangeSerie(digitos.slice(0, 3));
  }

  function handleKeyDownCampo(
    e: React.KeyboardEvent<HTMLInputElement>,
    proximo?: HTMLElement | null,
  ) {
    if (e.key === 'Enter') {
      e.preventDefault();
      proximo?.focus();
    }
  }

  function handleKeyDownTextarea(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className="sped-card" onSubmit={onAdicionar}>
      <div className="sped-section-title">
        <h3>Lançar Documentos</h3>
      </div>

      <div className="nfe-lancamento-grid">
        <div className="nfe-campo-bloco">
          <label htmlFor="doc-serie">Série (máx. 3)</label>
          <input
            id="doc-serie"
            type="text"
            inputMode="numeric"
            maxLength={3}
            className="sped-input"
            placeholder="001"
            value={serie}
            onChange={handleSerieChange}
            onKeyDown={(e) => handleKeyDownCampo(e, emissaoRef.current)}
          />
        </div>

        <div className="nfe-campo-bloco">
          <label htmlFor="doc-emissao">Emissão</label>
          <input
            ref={emissaoRef}
            id="doc-emissao"
            type="text"
            inputMode="numeric"
            maxLength={7}
            className="sped-input"
            placeholder="10/2026"
            value={mesAnoEmissao}
            onChange={(e) => onChangeMesAnoEmissao(formatarMesAno(e.target.value))}
            onKeyDown={(e) => handleKeyDownCampo(e, protocoloRef.current)}
          />
        </div>

        <div className="nfe-campo-bloco">
          <label htmlFor="doc-protocolo">Protocolo</label>
          <input
            ref={protocoloRef}
            id="doc-protocolo"
            type="text"
            inputMode="numeric"
            maxLength={7}
            className="sped-input"
            placeholder="11/2026"
            value={mesAnoProtocolo}
            onChange={(e) => onChangeMesAnoProtocolo(formatarMesAno(e.target.value))}
            onKeyDown={(e) => handleKeyDownCampo(e, numerosRef.current)}
          />
        </div>

        <div className="nfe-campo-bloco nfe-campo-numeros-wrap">
          <label htmlFor="doc-numeros">Números (1, 4 ou 1 a 4)</label>
          <textarea
            ref={numerosRef}
            id="doc-numeros"
            rows={1}
            className="nfe-textarea-numeros"
            placeholder="Ex.: 1, 4 ou 1 a 4"
            value={numerosTexto}
            onChange={(e) => onChangeNumerosTexto(e.target.value)}
            onKeyDown={handleKeyDownTextarea}
          />
        </div>

        <div className="nfe-btn-adicionar-wrap">
          <button type="submit" className="sped-btn sped-btn-primary">
            + Adicionar
          </button>
        </div>
      </div>

      <span className="nfe-dica-texto">
        <code>Enter</code> avança os campos e adiciona · <code>Shift+Enter</code> quebra linha · vírgula
        separa avulsos (<code>1, 4</code>) · <code>1 a 4</code> entra como faixa única.
      </span>
    </form>
  );
};