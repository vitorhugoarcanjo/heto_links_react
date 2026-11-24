import { type FormEvent, useEffect, useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import type { GrupoLinks, LinkItem, LinkPayload } from '../types';
import './ModalForm.css';

interface ModalLinkProps {
  aberto: boolean;
  grupos: GrupoLinks[];
  linkEmEdicao: LinkItem | null;
  onFechar: () => void;
  onSalvar: (payload: LinkPayload, linkId?: number) => Promise<void>;
}

export function ModalLink({
  aberto,
  grupos,
  linkEmEdicao,
  onFechar,
  onSalvar,
}: ModalLinkProps) {
  const [grupoId, setGrupoId] = useState<number>(0);
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [descricao, setDescricao] = useState('');
  const [abrirNovaAba, setAbrirNovaAba] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);
    if (linkEmEdicao) {
      setGrupoId(linkEmEdicao.grupo_id);
      setTitulo(linkEmEdicao.titulo);
      setUrl(linkEmEdicao.url);
      setDescricao(linkEmEdicao.descricao || '');
      setAbrirNovaAba(linkEmEdicao.abrir_nova_aba);
    } else {
      setGrupoId(grupos[0]?.id ?? 0);
      setTitulo('');
      setUrl('');
      setDescricao('');
      setAbrirNovaAba(true);
    }
  }, [aberto, linkEmEdicao, grupos]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!grupoId) {
      setErro('Crie ou selecione um grupo antes de salvar o link.');
      return;
    }
    if (!titulo.trim() || !url.trim()) {
      setErro('Preencha o título e a URL do link.');
      return;
    }

    setSalvando(true);
    try {
      await onSalvar(
        {
          grupo_id: grupoId,
          titulo: titulo.trim(),
          url: url.trim(),
          descricao: descricao.trim() || undefined,
          abrir_nova_aba: abrirNovaAba,
        },
        linkEmEdicao?.id
      );
      onFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar link.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto={aberto}
      titulo={linkEmEdicao ? 'Editar Link' : 'Novo Link'}
      onFechar={onFechar}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="link-grupo">Grupo</label>
          <select
            id="link-grupo"
            className="form-control"
            value={grupoId}
            onChange={(e) => setGrupoId(Number(e.target.value))}
          >
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.titulo}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="link-titulo">Título</label>
          <input
            id="link-titulo"
            type="text"
            className="form-control"
            placeholder="Ex.: Portal SEFAZ MT"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="link-url">URL</label>
          <input
            id="link-url"
            type="text"
            className="form-control"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="link-desc">Descrição curta (opcional)</label>
          <input
            id="link-desc"
            type="text"
            className="form-control"
            placeholder="Ex.: Consulta de disponibilidade e notas"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <label className="form-check">
          <input
            type="checkbox"
            checked={abrirNovaAba}
            onChange={(e) => setAbrirNovaAba(e.target.checked)}
          />
          <span>Abrir em nova aba</span>
        </label>

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