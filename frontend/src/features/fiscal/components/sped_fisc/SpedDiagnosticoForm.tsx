import React, { useEffect, useRef, useState } from 'react';
import { AjudaBloco } from './AjudaBloco';

interface SpedDiagnosticoFormProps {
  diagnosticando: boolean;
  importandoTxt?: boolean;
  onImportacaoInicio?: (nomeArquivo: string) => void;
  onImportacaoFim?: () => void;
  abrirJson: boolean;
  onToggleJson: () => void;
  onAnalisar: (params: {
    mensagemErro: string;
    errosPva: string[];
    registroSped: string;
    conteudoTxt: string;
  }) => Promise<void>;
}

async function decodificarArquivoTxt(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('iso-8859-1').decode(buffer);
  }
}

export const SpedDiagnosticoForm: React.FC<SpedDiagnosticoFormProps> = ({
  diagnosticando,
  importandoTxt = false,
  onImportacaoInicio,
  onImportacaoFim,
  abrirJson,
  onToggleJson,
  onAnalisar,
}) => {
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [conteudoTxt, setConteudoTxt] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [registroSped, setRegistroSped] = useState('');

  const arquivoPendenteRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const linhasErro = mensagemErro
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bloqueado = diagnosticando || importandoTxt;

  useEffect(() => {
    if (!importandoTxt || !arquivoPendenteRef.current) return;

    let cancelado = false;
    const arquivo = arquivoPendenteRef.current;
    arquivoPendenteRef.current = null;

    decodificarArquivoTxt(arquivo)
      .then((texto) => {
        if (cancelado) return;
        setNomeArquivo(arquivo.name);
        setConteudoTxt(texto);
      })
      .finally(() => {
        if (inputRef.current) inputRef.current.value = '';
        if (!cancelado) onImportacaoFim?.();
      });

    return () => {
      cancelado = true;
    };
  }, [importandoTxt, onImportacaoFim]);

  function handleSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file || bloqueado) return;

    arquivoPendenteRef.current = file;
    onImportacaoInicio?.(file.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado) return;
    await onAnalisar({
      mensagemErro,
      errosPva: linhasErro,
      registroSped,
      conteudoTxt,
    });
  }

  return (
    <form className="sped-card" onSubmit={handleSubmit}>
      <div className="sped-section-title">
        <div className="sped-titulo-com-ajuda">
          <h3>1. Arquivo SPED e Erros do PVA</h3>
          <AjudaBloco texto="Envie ou cole o .txt e cole quantos erros do PVA precisar (um por linha). O filtro de registro/chave/ID é opcional." />
        </div>
        {linhasErro.length > 0 && (
          <span className="sped-badge">{linhasErro.length} erro(s) detectado(s)</span>
        )}
      </div>

      <div className="sped-form-group">
        <div className="sped-label-row">
          <label htmlFor="sped-arquivo-txt">Arquivo .txt do SPED Fiscal</label>
          <label htmlFor="sped-arquivo-txt" className="sped-file-btn">
            {importandoTxt
              ? `Importando ${nomeArquivo}...`
              : nomeArquivo
                ? `Arquivo: ${nomeArquivo}`
                : 'Selecionar arquivo .txt'}
          </label>
          <input
            ref={inputRef}
            id="sped-arquivo-txt"
            type="file"
            accept=".txt,text/plain"
            className="sped-file-hidden"
            disabled={bloqueado}
            onChange={handleSelecionarArquivo}
          />
        </div>
        <textarea
          className="sped-textarea sped-textarea--compact"
          placeholder="Selecione um .txt acima ou cole aqui as linhas do SPED Fiscal..."
          value={conteudoTxt}
          disabled={bloqueado}
          onChange={(e) => setConteudoTxt(e.target.value)}
        />
      </div>

      <div className="sped-grid-2">
        <div className="sped-form-group">
          <label htmlFor="sped-erro-pva">Erros do PVA (opcional — 1 erro por linha)</label>
          <textarea
            id="sped-erro-pva"
            className="sped-textarea sped-textarea--erros"
            placeholder="Cole os erros do PVA aqui (pode colar vários, um por linha). Se deixar vazio, faz varredura no .txt..."
            value={mensagemErro}
            disabled={bloqueado}
            onChange={(e) => setMensagemErro(e.target.value)}
          />
        </div>

        <div className="sped-form-group">
          <label htmlFor="sped-registro">Filtro rápido: Registro, Chave ou ID (opcional)</label>
          <input
            id="sped-registro"
            type="text"
            className="sped-input"
            placeholder="Ex.: C170, C100, chave de acesso ou ID da nota..."
            value={registroSped}
            disabled={bloqueado}
            onChange={(e) => setRegistroSped(e.target.value)}
          />
          <p className="sped-hint">
            Foca a busca em uma nota, registro ou movimento específico quando preenchido.
          </p>
        </div>
      </div>

      <div className="sped-actions">
        <button type="submit" className="sped-btn sped-btn-primary" disabled={bloqueado}>
          {diagnosticando
            ? 'Analisando arquivo...'
            : importandoTxt
              ? 'Importando .txt...'
              : 'Analisar SPED com IA'}
        </button>
        <button type="button" className="sped-btn" disabled={bloqueado} onClick={onToggleJson}>
          {abrirJson ? 'Fechar importação de JSON' : 'Importar lista de colunas (JSON)'}
        </button>
      </div>
    </form>
  );
};