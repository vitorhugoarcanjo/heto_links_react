import { type FormEvent, useEffect, useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import type { GrupoLinks, GrupoPayload } from '../types';
import './ModalForm.css';

interface ModalGrupoProps {
  aberto: boolean;
  grupoEmEdicao: GrupoLinks | null;
  onFechar: () => void;
  onSalvar: (payload: GrupoPayload, grupoId?: number) => Promise<void>;
}

export function ModalGrupo({
  aberto,
  grupoEmEdicao,
  onFechar,
  onSalvar,
}: ModalGrupoProps) {
  const [titulo, setTitulo] = useState('');
  const [corTopo, setCorTopo] = useState('#38bdf8');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);
    if (grupoEmEdicao) {
      setTitulo(grupoEmEdicao.titulo);
      setCorTopo(grupoEmEdicao.cor_topo || '#38bdf8');
    } else {
      setTitulo('');
      setCorTopo('#38bdf8');
    }
  }, [aberto, grupoEmEdicao]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!titulo.trim()) {
      setErro('Informe o nome do grupo.');
      return;
    }

    setSalvando(true);
    try {
      await onSalvar(
        { titulo: titulo.trim(), cor_topo: corTopo },
        grupoEmEdicao?.id
      );
      onFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar grupo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto={aberto}
      titulo={grupoEmEdicao ? 'Editar Grupo' : 'Novo Grupo'}
      onFechar={onFechar}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="grupo-titulo">Nome do Grupo</label>
          <input
            id="grupo-titulo"
            type="text"
            className="form-control"
            placeholder="Ex.: PORTAIS PREFEITURA"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="grupo-cor">Cor de destaque da coluna</label>
          <div className="form-color-row">
            <input
              id="grupo-cor"
              type="color"
              className="form-color-input"
              value={corTopo}
              onChange={(e) => setCorTopo(e.target.value)}
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
              {corTopo.toUpperCase()}
            </span>
          </div>
        </div>

        {erro && <div className="form-error">{erro}</div>}

        <div className="modal-form__footer">
          <button type="button" className="btn-secondary" onClick={onFechar}>
            Cancelar
          </button>
          <button type="submit" className="btn-submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}