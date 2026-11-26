export type { RotaMenu } from '../../types/navigation';

export interface AppConfig {
  nome_sistema: string;
  empresa: string;
  versao: string;
}

export interface LinkItem {
  id: number;
  grupo_id: number;
  titulo: string;
  url: string;
  descricao?: string | null;
  ordem: number;
  abrir_nova_aba: boolean;
}

export interface GrupoLinks {
  id: number;
  titulo: string;
  cor_topo: string;
  ordem: number;
  links: LinkItem[];
}

export interface LinkPayload {
  grupo_id: number;
  titulo: string;
  url: string;
  descricao?: string;
  ordem?: number;
  abrir_nova_aba: boolean;
}

export interface GrupoPayload {
  titulo: string;
  cor_topo: string;
  ordem?: number;
}

export type ModoVisualizacao = 'colunas' | 'tabela';