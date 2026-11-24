import { type ReactNode, useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}

export function Modal({ aberto, titulo, onFechar, children }: ModalProps) {
  useEffect(() => {
    if (!aberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-card__header">
          <h3 className="modal-card__title">{titulo}</h3>
          <button type="button" className="modal-card__close" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="modal-card__body">{children}</div>
      </div>
    </div>
  );
}