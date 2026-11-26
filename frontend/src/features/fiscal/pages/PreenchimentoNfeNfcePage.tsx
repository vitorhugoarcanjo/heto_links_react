import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../components/ui/ToastContext';
import type { ModeloDocumentoFiscal } from '../../../types/navigation';
import { EmpresaModeloCard } from '../components/preenc_nfe_nfce/EmpresaModeloCard';
import { LancamentoDocumentosCard } from '../components/preenc_nfe_nfce/LancamentoDocumentosCard';
import { ListaAgrupadaCard } from '../components/preenc_nfe_nfce/ListaAgrupadaCard';
import { baixarSequenciaDocx } from '../services/nfeNfceDocxService';
import { CONFIG_MODELO_FISCAL, type RegistroDocItem } from '../types/nfeNfce';
import {
  agruparRegistrosParaWord,
  cnpjTem14Digitos,
  montarLinhasPayloadWord,
  normalizarChaveGrupo,
  parsearNumerosDocumento,
} from '../utils/nfeNfceUtils';
import './SpedFiscalPage.css';

interface PreenchimentoNfeNfcePageProps {
  modeloInicial?: ModeloDocumentoFiscal;
}

function sanitizarParteArquivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export const PreenchimentoNfeNfcePage: React.FC<PreenchimentoNfeNfcePageProps> = ({
  modeloInicial = 'NF-E',
}) => {
  const { toastWarning, toastSuccess, toastError, toastInfo } = useToast();

  const [modeloDocumento, setModeloDocumento] = useState<ModeloDocumentoFiscal>(modeloInicial);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpjEmpresa, setCnpjEmpresa] = useState('');

  const [serie, setSerie] = useState('');
  const [mesAnoEmissao, setMesAnoEmissao] = useState('');
  const [mesAnoProtocolo, setMesAnoProtocolo] = useState('');
  const [numerosTexto, setNumerosTexto] = useState('');

  const [registros, setRegistros] = useState<RegistroDocItem[]>([]);
  const [ordemChaves, setOrdemChaves] = useState<string[]>([]);
  const [gerando, setGerando] = useState(false);

  const geracaoIdRef = useRef(0);
  const emExecucaoRef = useRef(false);
  const timeoutGeracaoRef = useRef<number | null>(null);

  function liberarGeracao() {
    if (timeoutGeracaoRef.current !== null) {
      window.clearTimeout(timeoutGeracaoRef.current);
      timeoutGeracaoRef.current = null;
    }
    emExecucaoRef.current = false;
    setGerando(false);
  }

  useEffect(() => {
    setModeloDocumento(modeloInicial);
  }, [modeloInicial]);

  useEffect(() => {
    geracaoIdRef.current += 1;
    liberarGeracao();
  }, [modeloDocumento]);

  useEffect(() => () => liberarGeracao(), []);

  const configAtual = CONFIG_MODELO_FISCAL[modeloDocumento];
  const linhasAgrupadas = useMemo(
    () => agruparRegistrosParaWord(registros, ordemChaves),
    [registros, ordemChaves],
  );

  function limparCamposLancamento() {
    setSerie('');
    setMesAnoEmissao('');
    setMesAnoProtocolo('');
    setNumerosTexto('');

    window.requestAnimationFrame(() => {
      const campoSerie = document.getElementById('doc-serie') as HTMLInputElement | null;
      campoSerie?.focus();
    });
  }

  function handleAdicionar(e: React.FormEvent) {
    e.preventDefault();

    const serieLimpa = serie.trim();
    const emissaoLimpa = mesAnoEmissao.trim();
    const protocoloLimpa = mesAnoProtocolo.trim();
    const candidatos = parsearNumerosDocumento(numerosTexto);

    if (!serieLimpa) {
      toastWarning('Informe a Série (até 3 dígitos, ex.: 001).');
      return;
    }
    if (candidatos.length === 0) {
      toastWarning('Informe os números dos documentos (ex.: 1, 4 ou 1 a 4).');
      return;
    }

    const chaveAlvo = normalizarChaveGrupo(serieLimpa, emissaoLimpa, protocoloLimpa);
    const jaExistentes = new Set(
      registros
        .filter(
          (r) =>
            normalizarChaveGrupo(r.serie, r.mesAnoEmissao, r.mesAnoProtocolo) === chaveAlvo,
        )
        .map((r) => r.numeroDoc.trim().toLowerCase()),
    );

    const duplicados: string[] = [];
    const novos: RegistroDocItem[] = [];
    const vistosAgora = new Set<string>();

    for (const num of candidatos) {
      const chaveNum = num.toLowerCase();
      if (jaExistentes.has(chaveNum) || vistosAgora.has(chaveNum)) {
        duplicados.push(num);
      } else {
        vistosAgora.add(chaveNum);
        novos.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${novos.length}`,
          serie: serieLimpa,
          numeroDoc: num,
          mesAnoEmissao: emissaoLimpa,
          mesAnoProtocolo: protocoloLimpa,
        });
      }
    }

    if (novos.length > 0) {
      setRegistros((prev) => [...prev, ...novos]);
      setOrdemChaves((prev) => (prev.includes(chaveAlvo) ? prev : [...prev, chaveAlvo]));
      limparCamposLancamento();
      toastSuccess(`${novos.length} item(ns) adicionado(s).`);
    }

    if (duplicados.length > 0) {
      toastWarning(`Ignorado(s) por já existir(em): ${duplicados.join(', ')}.`);
    }
  }

  function handleRemoverDocumento(id: string) {
    setRegistros((prev) => prev.filter((item) => item.id !== id));
  }

  function handleRemoverLinha(chaveGrupo: string) {
    setRegistros((prev) =>
      prev.filter(
        (item) =>
          normalizarChaveGrupo(item.serie, item.mesAnoEmissao, item.mesAnoProtocolo) !==
          chaveGrupo,
      ),
    );
    setOrdemChaves((prev) => prev.filter((c) => c !== chaveGrupo));
  }

  function handleLimparTudo() {
    geracaoIdRef.current += 1;
    liberarGeracao();
    setRegistros([]);
    setOrdemChaves([]);
    toastInfo('Lista limpa.');
  }

  async function handleGerarDocx() {
    if (emExecucaoRef.current) return;

    if (!nomeEmpresa.trim()) {
      toastWarning('Informe o nome da Empresa antes de gerar o Word.');
      return;
    }
    if (!cnpjTem14Digitos(cnpjEmpresa)) {
      toastWarning('Informe um CNPJ válido com 14 dígitos antes de gerar o Word.');
      return;
    }
    if (linhasAgrupadas.length === 0) {
      toastWarning('Adicione ao menos um documento na lista antes de gerar o Word.');
      return;
    }

    const idExecucao = ++geracaoIdRef.current;
    emExecucaoRef.current = true;
    setGerando(true);

    timeoutGeracaoRef.current = window.setTimeout(() => {
      if (idExecucao === geracaoIdRef.current) {
        liberarGeracao();
      }
    }, 15000);

    try {
      const empresaSlug = sanitizarParteArquivo(nomeEmpresa.trim()) || 'Empresa';
      const nomeArquivo = `Sequencia_Faltante_${configAtual.sufixoArquivo}_${empresaSlug}.docx`;

      await baixarSequenciaDocx(
        {
          modelo: modeloDocumento,
          variaveis: {
            NOME_EMPRESA: nomeEmpresa.trim(),
            CNPJ_EMPRESA: cnpjEmpresa.trim(),
          },
          linhas_word: montarLinhasPayloadWord(linhasAgrupadas),
        },
        nomeArquivo,
      );
      if (idExecucao !== geracaoIdRef.current) return;
      toastSuccess(`Arquivo ${nomeArquivo} gerado com ${linhasAgrupadas.length} linha(s).`);
    } catch (err) {
      if (idExecucao !== geracaoIdRef.current) return;
      toastError(err instanceof Error ? err.message : 'Erro ao gerar o .docx.');
    } finally {
      if (idExecucao === geracaoIdRef.current) {
        liberarGeracao();
      }
    }
  }

  return (
    <section className="sped-page">
      <header className="sped-header">
        <div>
          <h2>Preenchimento NF-e e NFC-e</h2>
          <p className="sped-subtitle">
            <strong>{configAtual.titulo}</strong> · Coluna:{' '}
            <strong>{configAtual.colunaSequencia}</strong>
          </p>
        </div>
        <div className="sped-stats">
          <div className="sped-stat-pill">
            <span className="sped-stat-label">Docs</span>
            <strong>{registros.length}</strong>
          </div>
          <div className="sped-stat-pill">
            <span className="sped-stat-label">Linhas Word</span>
            <strong>{linhasAgrupadas.length}</strong>
          </div>
        </div>
      </header>

      <EmpresaModeloCard
        modeloDocumento={modeloDocumento}
        onChangeModelo={setModeloDocumento}
        nomeEmpresa={nomeEmpresa}
        onChangeNomeEmpresa={setNomeEmpresa}
        cnpjEmpresa={cnpjEmpresa}
        onChangeCnpjEmpresa={setCnpjEmpresa}
      />

      <LancamentoDocumentosCard
        serie={serie}
        onChangeSerie={setSerie}
        onExcedeuSerie={() => toastWarning('A Série aceita no máximo 3 dígitos.')}
        mesAnoEmissao={mesAnoEmissao}
        onChangeMesAnoEmissao={setMesAnoEmissao}
        mesAnoProtocolo={mesAnoProtocolo}
        onChangeMesAnoProtocolo={setMesAnoProtocolo}
        numerosTexto={numerosTexto}
        onChangeNumerosTexto={setNumerosTexto}
        onAdicionar={handleAdicionar}
      />

      <ListaAgrupadaCard
        linhasAgrupadas={linhasAgrupadas}
        temRegistros={registros.length > 0}
        gerando={gerando}
        onRemoverDocumento={handleRemoverDocumento}
        onRemoverLinha={handleRemoverLinha}
        onReordenarLinhas={setOrdemChaves}
        onLimparTudo={handleLimparTudo}
        onGerarDocx={handleGerarDocx}
      />
    </section>
  );
};