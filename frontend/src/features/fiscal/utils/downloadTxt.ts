// Local sugerido: frontend/src/features/sped-fiscal/downloadTxt.ts
// Se o seu api/client.ts injeta token/base URL, troque o fetch abaixo por ele.

export interface CorrecaoPayload {
  indice: number;
  linha_original: string;
  linha_nova: string;
  numero_linha?: number | null;
}

export async function baixarTxtCorrigido(
  conteudoTxt: string,
  correcoes: CorrecaoPayload[],
  nomeArquivo = 'sped_corrigido.txt',
): Promise<void> {
  const resp = await fetch('/api/sped_fiscal/gerar_txt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conteudo_txt: conteudoTxt, correcoes }),
  });

  if (!resp.ok) {
    let msg = 'Falha ao gerar o .txt corrigido.';
    try {
      const j = await resp.json();
      msg = j.message || j.error || msg;
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(msg);
  }

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}