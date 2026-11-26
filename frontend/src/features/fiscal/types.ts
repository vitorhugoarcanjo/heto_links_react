export type TabelaFiscal = 'MOVIMENTOS' | 'MOVIMENTOS_ITENS';

export type FiltroRelevancia = 'TODAS' | 'RELEVANTES' | 'NAO_RELEVANTES';

export interface ColunaFiscal {
  tabela: TabelaFiscal;
  coluna: string;
  relevante_sped: boolean;
  categoria: string;
  descricao: string;
}

export interface RespostaColunasFiscal {
  totais: {
    MOVIMENTOS: number;
    MOVIMENTOS_ITENS: number;
    relevantes_movimentos: number;
    relevantes_itens: number;
    filtradas: number;
  };
  categorias: string[];
  colunas: ColunaFiscal[];
}

export interface ItemDiagnosticoVisual {
  erro: string;
  registro_alvo: string;
  significado: string;
  colunas_movimentos: string[];
  colunas_itens: string[];
  onde_procurar: string;
  sugestao_ajuste_txt: string;
  linha_txt_sugerida: string;
  // Novos (preenchidos pelo backend/IA)
  linha_txt_original?: string;
  numero_linha?: number;
  aplicavel?: boolean;
  motivo_nao_aplicavel?: string;
}

export interface DiagnosticoFiscalResultado {
  modo: 'ia' | 'estruturado_local';
  modelo?: string;
  motivo_fallback?: string;
  colunas_movimentos: number;
  colunas_itens: number;
  linhas_txt_analisadas?: number;
  resumo_geral?: string;
  txt_corrigido_sugerido?: string;
  itens?: ItemDiagnosticoVisual[];
  diagnostico: string;
}