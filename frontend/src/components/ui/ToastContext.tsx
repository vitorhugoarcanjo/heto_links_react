import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type ToastTipo = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
}

interface ToastContextValue {
  mostrarToast: (mensagem: string, tipo?: ToastTipo, duracaoMs?: number) => void;
  toastSuccess: (mensagem: string, duracaoMs?: number) => void;
  toastError: (mensagem: string, duracaoMs?: number) => void;
  toastWarning: (mensagem: string, duracaoMs?: number) => void;
  toastInfo: (mensagem: string, duracaoMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ESTILO_TIPO: Record<ToastTipo, { border: string; badge: string; titulo: string }> = {
  success: { border: '#22c55e', badge: '#16a34a', titulo: 'Sucesso' },
  error: { border: '#ef4444', badge: '#dc2626', titulo: 'Erro' },
  warning: { border: '#f59e0b', badge: '#d97706', titulo: 'Aviso' },
  info: { border: '#3b82f6', badge: '#2563eb', titulo: 'Info' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  const limparTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const mostrarToast = useCallback(
    (mensagem: string, tipo: ToastTipo = 'info', duracaoMs = 3000) => {
      limparTimer();
      const id = Date.now();
      setToast({ id, tipo, mensagem });
      timerRef.current = window.setTimeout(() => {
        setToast((atual) => (atual?.id === id ? null : atual));
        timerRef.current = null;
      }, duracaoMs);
    },
    [limparTimer],
  );

  useEffect(() => () => limparTimer(), [limparTimer]);

  const toastSuccess = useCallback(
    (msg: string, ms = 3000) => mostrarToast(msg, 'success', ms),
    [mostrarToast],
  );
  const toastError = useCallback(
    (msg: string, ms = 3000) => mostrarToast(msg, 'error', ms),
    [mostrarToast],
  );
  const toastWarning = useCallback(
    (msg: string, ms = 3000) => mostrarToast(msg, 'warning', ms),
    [mostrarToast],
  );
  const toastInfo = useCallback(
    (msg: string, ms = 3000) => mostrarToast(msg, 'info', ms),
    [mostrarToast],
  );

  const estiloAtual = toast ? ESTILO_TIPO[toast.tipo] : null;

  return (
    <ToastContext.Provider
      value={{ mostrarToast, toastSuccess, toastError, toastWarning, toastInfo }}
    >
      {children}
      {toast && estiloAtual && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '24px',
            zIndex: 9999,
            maxWidth: '380px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#0f172a',
            color: '#f8fafc',
            border: `1px solid ${estiloAtual.border}`,
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.4)',
            fontSize: '0.9rem',
          }}
        >
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              background: estiloAtual.badge,
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            {estiloAtual.titulo}
          </span>
          <span style={{ lineHeight: 1.35 }}>{toast.mensagem}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de um <ToastProvider>.');
  }
  return ctx;
}