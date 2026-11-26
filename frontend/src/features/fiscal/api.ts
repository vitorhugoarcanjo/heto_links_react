import { apiRequest } from '../../api/client';
import type {
  ColunaFiscal,
  DiagnosticoFiscalResultado,
  FiltroRelevancia,
  RespostaColunasFiscal,
} from './types';

const BASE = '/api/sped_fiscal';

export const spedFiscalApi = {
  async listarColunas(params: {
    tabela?: string;
    relevancia?: FiltroRelevancia;
    categoria?: string;
    busca?: string;
  }): Promise<RespostaColunasFiscal> {
    const qs = new URLSearchParams();
    if (params.tabela && params.tabela !== 'TODAS') qs.set('tabela', params.tabela);
    if (params.relevancia && params.relevancia !== 'TODAS') qs.set('relevancia', params.relevancia);
    if (params.categoria) qs.set('categoria', params.categoria);
    if (params.busca) qs.set('busca', params.busca);
    const query = qs.toString();
    return apiRequest<RespostaColunasFiscal>(`${BASE}/colunas${query ? `?${query}` : ''}`);
  },

  async importarJson(payload: unknown): Promise<void> {
    await apiRequest(`${BASE}/colunas/importar`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async editarColuna(payload: {
    tabela: string;
    coluna: string;
    relevante_sped?: boolean;
    categoria?: string;
    descricao?: string;
  }): Promise<ColunaFiscal> {
    const data = await apiRequest<{ coluna: ColunaFiscal }>(`${BASE}/colunas`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return data.coluna;
  },

  async excluirColuna(tabela: string, coluna: string): Promise<void> {
    const qs = new URLSearchParams({ tabela, coluna });
    await apiRequest(`${BASE}/colunas?${qs.toString()}`, { method: 'DELETE' });
  },

  async diagnosticar(payload: {
    mensagem_erro?: string;
    erros_pva?: string[];
    registro_sped?: string;
    conteudo_txt?: string;
  }): Promise<DiagnosticoFiscalResultado> {
    return apiRequest<DiagnosticoFiscalResultado>(`${BASE}/diagnosticar`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};