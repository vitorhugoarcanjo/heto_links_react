import React, { useState } from 'react';

interface AjudaBlocoProps {
  texto: string;
}

export const AjudaBloco: React.FC<AjudaBlocoProps> = ({ texto }) => {
  const [aberto, setAberto] = useState(false);

  return (
    <span className="sped-ajuda-wrap">
      <button
        type="button"
        className="sped-ajuda-btn"
        aria-label="Ver explicação deste bloco"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        ?
      </button>
      {aberto && (
        <span role="tooltip" className="sped-ajuda-popover">
          {texto}
        </span>
      )}
    </span>
  );
};