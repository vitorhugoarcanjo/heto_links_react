import React from 'react';

interface SpedCollapseBtnProps {
  aberto: boolean;
  onToggle: () => void;
  rotulo: string;
}

export const SpedCollapseBtn: React.FC<SpedCollapseBtnProps> = ({
  aberto,
  onToggle,
  rotulo,
}) => {
  return (
    <button
      type="button"
      className="sped-collapse-btn"
      aria-expanded={aberto}
      aria-label={aberto ? `Recolher ${rotulo}` : `Expandir ${rotulo}`}
      title={aberto ? `Recolher ${rotulo}` : `Expandir ${rotulo}`}
      onClick={onToggle}
    >
      <span className="sped-chevron" data-aberto={aberto ? 'true' : 'false'} aria-hidden="true" />
    </button>
  );
};