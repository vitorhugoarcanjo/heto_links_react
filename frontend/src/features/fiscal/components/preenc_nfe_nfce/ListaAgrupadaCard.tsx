import React, { useState } from 'react';
import type { LinhaAgrupadaWord } from '../../types/nfeNfce';
import '../../pages/SpedFiscalPage.css';

interface ListaAgrupadaCardProps {
  linhasAgrupadas: LinhaAgrupadaWord[];
  temRegistros: boolean;
  gerando: boolean;
  onRemoverDocumento: (id: string) => void;
  onRemoverLinha: (chaveGrupo: string) => void;
  onReordenarLinhas: (novaOrdemChaves: string[]) => void;
  onLimparTudo: () => void;
  onGerarDocx: () => void;
}

export const ListaAgrupadaCard: React.FC<ListaAgrupadaCardProps> = ({
  linhasAgrupadas,
  temRegistros,
  gerando,
  onRemoverDocumento,
  onRemoverLinha,
  onReordenarLinhas,
  onLimparTudo,
  onGerarDocx,
}) => {
  const [indiceArrastando, setIndiceArrastando] = useState<number | null>(null);
  const [indiceSobre, setIndiceSobre] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, idx: number) {
    setIndiceArrastando(idx);
    setIndiceSobre(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (indiceArrastando !== null && indiceSobre !== idx) {
      setIndiceSobre(idx);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, idxDestino: number) {
    e.preventDefault();
    const origem = indiceArrastando ?? Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(origem) || origem < 0 || origem === idxDestino) {
      setIndiceArrastando(null);
      setIndiceSobre(null);
      return;
    }

    const copia = [...linhasAgrupadas];
    const [movido] = copia.splice(origem, 1);
    copia.splice(idxDestino, 0, movido);

    onReordenarLinhas(copia.map((item) => item.chaveGrupo));
    setIndiceArrastando(null);
    setIndiceSobre(null);
  }

  function handleDragEnd() {
    setIndiceArrastando(null);
    setIndiceSobre(null);
  }

  return (
    <div className="sped-card">
      <div className="sped-section-title">
        <div>
          <h3>Lista ({linhasAgrupadas.length} linha(s) no Word)</h3>
          {linhasAgrupadas.length > 1 && (
            <span className="sped-hint">Arraste qualquer linha para cima ou para baixo.</span>
          )}
        </div>
        <div className="sped-actions" style={{ marginTop: 0 }}>
          {temRegistros && (
            <button type="button" className="sped-btn sped-btn-sm" onClick={onLimparTudo}>
              Limpar
            </button>
          )}
          <button
            type="button"
            className="sped-btn sped-btn-primary"
            disabled={gerando || linhasAgrupadas.length === 0}
            onClick={onGerarDocx}
          >
            {gerando ? 'Gerando...' : 'Gerar Word (.docx)'}
          </button>
        </div>
      </div>

      {linhasAgrupadas.length === 0 ? (
        <p className="sped-hint">Nenhum documento adicionado.</p>
      ) : (
        <div className="nfe-lista-compacta">
          {linhasAgrupadas.map((grupo, idx) => {
            const estaArrastando = indiceArrastando === idx;
            const abreEmbaixo =
              indiceArrastando !== null &&
              indiceSobre !== null &&
              indiceArrastando > indiceSobre &&
              idx >= indiceSobre &&
              idx < indiceArrastando;
            const abreEmcima =
              indiceArrastando !== null &&
              indiceSobre !== null &&
              indiceArrastando < indiceSobre &&
              idx > indiceArrastando &&
              idx <= indiceSobre;

            return (
              <div
                key={grupo.chaveGrupo}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={[
                  'nfe-linha-card',
                  estaArrastando ? 'nfe-linha-card--arrastando' : '',
                  abreEmbaixo ? 'nfe-linha-card--abre-embaixo' : '',
                  abreEmcima ? 'nfe-linha-card--abre-emcima' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="nfe-linha-header">
                  <div className="nfe-linha-identidade">
                    <span className="nfe-linha-numero">{idx + 1}</span>

                    <div>
                      <div className="nfe-linha-titulo">
                        <strong>Linha {idx + 1}</strong>
                        <span>·</span>
                        <span>Série</span>
                        <code>{grupo.serie}</code>
                      </div>
                      <div className="nfe-linha-meta">
                        <span>
                          Emissão: <strong>{grupo.mesAnoEmissao || '—'}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Protocolo: <strong>{grupo.mesAnoProtocolo || '—'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remover linha ${idx + 1}`}
                    title="Remover linha"
                    className="nfe-btn-remover-linha"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoverLinha(grupo.chaveGrupo);
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div className="nfe-tags-lista">
                  {grupo.itens.map((item) => (
                    <span key={item.id} className="sped-badge nfe-tag-item">
                      <span>{item.numeroDoc}</span>
                      <button
                        type="button"
                        aria-label={`Remover documento ${item.numeroDoc}`}
                        title={`Remover ${item.numeroDoc}`}
                        className="nfe-btn-remover-tag"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoverDocumento(item.id);
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <p className="nfe-linha-word">
                  <span>Word:</span>
                  <code>{grupo.numerosFormatados}</code>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};