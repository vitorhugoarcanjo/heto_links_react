export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const ENDPOINTS = {
  SETTINGS: `${API_BASE_URL}/api/settings`,
  LINKS_BOARD: `${API_BASE_URL}/api/links/board`,
  LINKS: `${API_BASE_URL}/api/links`,
  LINK_BY_ID: (id: number) => `${API_BASE_URL}/api/links/${id}`,
  GRUPOS: `${API_BASE_URL}/api/links/grupos`,
  GRUPO_BY_ID: (id: number) => `${API_BASE_URL}/api/links/grupos/${id}`,
} as const;