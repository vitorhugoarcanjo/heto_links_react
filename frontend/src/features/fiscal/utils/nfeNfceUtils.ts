import type { LinhaAgrupadaWord, LinhaWordPayload, RegistroDocItem } from '../types/nfeNfce';

export function formatarCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 14);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  if (digitos.length <= 8) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
  }
  if (digitos.length <= 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  }
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

export function cnpjTem14Digitos(cnpjFormatado: string): boolean {
  return cnpjFormatado.replace(/\D/g, '').length === 14;
}

export function formatarMesAno(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 6);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

export function normalizarChaveGrupo(
  serie: string,
  mesAnoEmissao: string,
  mesAnoProtocolo: string,
): string {
  return [
    serie.trim().toUpperCase(),
    mesAnoEmissao.trim().toLowerCase(),
    mesAnoProtocolo.trim().toLowerCase(),
  ].join('||');
}

export function parsearNumerosDocumento(texto: string): string[] {
  if (!texto || !texto.trim()) return [];

  const comIntervaloPadrao = texto
    .trim()
    .replace(/(\d+)\s*(?:a|-|\.\.|–|—)\s*(\d+)/gi, '$1 a $2');

  return comIntervaloPadrao
    .split(/[,;\n\r]+/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export function formatarNumerosParaWord(numeros: string[]): string {
  if (!Array.isArray(numeros) || numeros.length === 0) return '';
  if (numeros.length === 1) return numeros[0] ?? '';
  return numeros.join(', ');
}

export function agruparRegistrosParaWord(
  registros: RegistroDocItem[],
  ordemChaves?: string[],
): LinhaAgrupadaWord[] {
  if (!Array.isArray(registros) || registros.length === 0) return [];

  const mapa = new Map<string, LinhaAgrupadaWord>();

  for (const reg of registros) {
    const chave = normalizarChaveGrupo(reg.serie, reg.mesAnoEmissao, reg.mesAnoProtocolo);
    const existente = mapa.get(chave);

    if (existente) {
      existente.itens.push(reg);
      existente.numerosFormatados = formatarNumerosParaWord(
        existente.itens.map((i) => i.numeroDoc),
      );
    } else {
      mapa.set(chave, {
        chaveGrupo: chave,
        serie: reg.serie,
        mesAnoEmissao: reg.mesAnoEmissao,
        mesAnoProtocolo: reg.mesAnoProtocolo,
        itens: [reg],
        numerosFormatados: reg.numeroDoc,
      });
    }
  }

  const lista = Array.from(mapa.values());
  if (!ordemChaves || ordemChaves.length === 0) {
    return lista;
  }

  const posMap = new Map<string, number>();
  ordemChaves.forEach((chave, idx) => posMap.set(chave, idx));

  return lista.sort((a, b) => {
    const posA = posMap.get(a.chaveGrupo) ?? Number.MAX_SAFE_INTEGER;
    const posB = posMap.get(b.chaveGrupo) ?? Number.MAX_SAFE_INTEGER;
    return posA - posB;
  });
}

export function montarLinhasPayloadWord(linhas: LinhaAgrupadaWord[]): LinhaWordPayload[] {
  if (!Array.isArray(linhas) || linhas.length === 0) return [];

  return linhas.map((grupo) => ({
    SERIE: grupo.serie,
    NUM_DOC: grupo.numerosFormatados,
    MES_ANO_EMISSAO: grupo.mesAnoEmissao,
    MES_ANO_PROTOCOLO: grupo.mesAnoProtocolo,
  }));
}