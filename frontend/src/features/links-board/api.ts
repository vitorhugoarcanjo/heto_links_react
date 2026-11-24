import { apiRequest } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import type { AppConfig, GrupoLinks, GrupoPayload, LinkItem, LinkPayload } from './types';

export const FALLBACK_CONFIG: AppConfig = {
  nome_sistema: 'HETOSOFT • Central de Links',
  empresa: 'Hetosoft Sistemas',
  versao: 'v1.0.0',
};

function normalizarUrl(raw: string): string {
  const limpa = raw.trim();
  if (!limpa) return 'https://';
  if (/^https?:\/\//i.test(limpa)) return limpa;
  return `https://${limpa}`;
}

export const linksApi = {
  async obterConfig(): Promise<AppConfig> {
    try {
      return await apiRequest<AppConfig>(ENDPOINTS.SETTINGS);
    } catch {
      return FALLBACK_CONFIG;
    }
  },

  async carregarBoard(): Promise<GrupoLinks[]> {
    return apiRequest<GrupoLinks[]>(ENDPOINTS.LINKS_BOARD);
  },

  async criarLink(payload: LinkPayload): Promise<LinkItem> {
    return apiRequest<LinkItem>(ENDPOINTS.LINKS, {
      method: 'POST',
      body: JSON.stringify({ ...payload, url: normalizarUrl(payload.url) }),
    });
  },

  async editarLink(id: number, payload: LinkPayload): Promise<LinkItem> {
    return apiRequest<LinkItem>(ENDPOINTS.LINK_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify({ ...payload, url: normalizarUrl(payload.url) }),
    });
  },

  async excluirLink(id: number): Promise<void> {
    await apiRequest<null>(ENDPOINTS.LINK_BY_ID(id), { method: 'DELETE' });
  },

  async criarGrupo(payload: GrupoPayload): Promise<GrupoLinks> {
    return apiRequest<GrupoLinks>(ENDPOINTS.GRUPOS, {
      method: 'POST',
      body: JSON.stringify({ ...payload, titulo: payload.titulo.trim().toUpperCase() }),
    });
  },

  async editarGrupo(id: number, payload: GrupoPayload): Promise<GrupoLinks> {
    return apiRequest<GrupoLinks>(ENDPOINTS.GRUPO_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify({ ...payload, titulo: payload.titulo.trim().toUpperCase() }),
    });
  },

  async excluirGrupo(id: number): Promise<void> {
    await apiRequest<null>(ENDPOINTS.GRUPO_BY_ID(id), { method: 'DELETE' });
  },
};