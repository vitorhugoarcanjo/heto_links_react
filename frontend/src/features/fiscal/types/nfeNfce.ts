import type { ModeloDocumentoFiscal } from '../../../types/navigation';

export interface RegistroDocItem {
  id: string;
  serie: string;
  numeroDoc: string;
  mesAnoEmissao: string;
  mesAnoProtocolo: string;
}

export interface LinhaAgrupadaWord {
  chaveGrupo: string;
  serie: string;
  mesAnoEmissao: string;
  mesAnoProtocolo: string;
  itens: RegistroDocItem[];
  numerosFormatados: string;
}

export interface LinhaWordPayload {
  SERIE: string;
  NUM_DOC: string;
  MES_ANO_EMISSAO: string;
  MES_ANO_PROTOCOLO: string;
}

export interface GerarSequenciaDocxPayload {
  modelo: ModeloDocumentoFiscal;
  variaveis: {
    NOME_EMPRESA: string;
    CNPJ_EMPRESA: string;
  };
  linhas_word: LinhaWordPayload[];
}

export interface ConfigModeloFiscal {
  titulo: string;
  colunaSequencia: string;
  sufixoArquivo: string;
}

export const CONFIG_MODELO_FISCAL: Record<ModeloDocumentoFiscal, ConfigModeloFiscal> = {
  'NF-E': {
    titulo: 'NF-e DE EMISSÃO PRÓPRIA FALTANTES NA SEQUÊNCIA',
    colunaSequencia: 'NF-E INICIO / FIM',
    sufixoArquivo: 'NF-e',
  },
  'NFC-E': {
    titulo: 'NFC-e EMISSÃO PRÓPRIA FALTANTES NA SEQUÊNCIA',
    colunaSequencia: 'NFC-E INICIO / FIM',
    sufixoArquivo: 'NFC-e',
  },
};