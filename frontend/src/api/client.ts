export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const rawText = await response.text();
  let payload: ApiResponse<T> | null = null;

  if (rawText.trim()) {
    try {
      payload = JSON.parse(rawText) as ApiResponse<T>;
    } catch {
      throw new Error(
        `Resposta não-JSON do servidor (HTTP ${response.status}): ${rawText.slice(0, 180)}`
      );
    }
  }

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || `Erro HTTP ${response.status} (resposta vazia ou inválida)`
    );
  }

  return payload.data;
}