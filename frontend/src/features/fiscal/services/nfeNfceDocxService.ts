import type { GerarSequenciaDocxPayload } from '../types/nfeNfce';

export async function baixarSequenciaDocx(
  payload: GerarSequenciaDocxPayload,
  nomeArquivo: string,
): Promise<void> {
  const resposta = await fetch('/api/fiscal/gerar-sequencia-docx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    let detalhe = `HTTP ${resposta.status}`;
    try {
      const corpo = (await resposta.json()) as { erro?: string };
      if (corpo?.erro) detalhe = corpo.erro;
    } catch {
      // mantém status HTTP caso a resposta não seja JSON
    }
    throw new Error(`Falha ao gerar o Word (${detalhe}).`);
  }

  const blob = await resposta.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}