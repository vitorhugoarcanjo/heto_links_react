import { useEffect, useState } from 'react';
import { SidebarLayout } from './components/layout/SidebarLayout';
import { ToastProvider } from './components/ui/ToastContext';
import type { AppConfig } from './features/links-board/types';
import { LinksBoardPage } from './features/links-board/pages/LinksBoardPage';
import { PreenchimentoNfeNfcePage } from './features/fiscal/pages/PreenchimentoNfeNfcePage';
import { SpedFiscalPage } from './features/fiscal/pages/SpedFiscalPage';
import type { RotaMenu } from './types/navigation';

const STORAGE_ROTA_KEY = 'busca_ajuda_rota_ativa_v1';
const ROTAS_VALIDAS: RotaMenu[] = [
  'links',
  'sped_fiscal',
  'sped_contribuicoes',
  'preenchimento_nfe_nfce',
  'clientes',
];

const CONFIG_PADRAO: AppConfig = {
  empresa: 'Busca de Ajuda',
  nome_sistema: 'Portal Fiscal',
  versao: '1.0.0',
};

function lerRotaSalva(): RotaMenu {
  try {
    const valor = localStorage.getItem(STORAGE_ROTA_KEY) as RotaMenu | null;
    if (valor && ROTAS_VALIDAS.includes(valor)) {
      return valor;
    }
  } catch {
    // fallback seguro se storage não estiver acessível
  }
  return 'links';
}

export function App() {
  const [rotaAtiva, setRotaAtiva] = useState<RotaMenu>(lerRotaSalva);
  const [config, setConfig] = useState<AppConfig>(CONFIG_PADRAO);
  const [erroApi, setErroApi] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarConfig() {
      try {
        const resposta = await fetch('/api/settings');
        if (!resposta.ok) {
          throw new Error(`HTTP ${resposta.status}`);
        }
        const raw = (await resposta.json()) as Record<string, unknown>;
        const dados = ((raw.data as Partial<AppConfig> | undefined) ??
          (raw as Partial<AppConfig>));

        if (!ativo) return;
        setConfig({
          empresa: dados.empresa || CONFIG_PADRAO.empresa,
          nome_sistema: dados.nome_sistema || CONFIG_PADRAO.nome_sistema,
          versao: dados.versao || CONFIG_PADRAO.versao,
        });
        setErroApi(null);
      } catch (err) {
        if (!ativo) return;
        setErroApi(err instanceof Error ? err.message : 'Falha ao conectar na API');
      }
    }

    carregarConfig();
    return () => {
      ativo = false;
    };
  }, []);

  function handleSelecionarRota(novaRota: RotaMenu) {
    setRotaAtiva(novaRota);
    try {
      localStorage.setItem(STORAGE_ROTA_KEY, novaRota);
    } catch {
      // fallback seguro se storage não estiver acessível
    }
  }

  return (
    <ToastProvider>
      <SidebarLayout
        config={config}
        rotaAtiva={rotaAtiva}
        onSelecionarRota={handleSelecionarRota}
        erroApi={erroApi}
      >
        {rotaAtiva === 'links' && <LinksBoardPage />}
        {rotaAtiva === 'sped_fiscal' && <SpedFiscalPage />}
        {rotaAtiva === 'preenchimento_nfe_nfce' && <PreenchimentoNfeNfcePage />}
        {rotaAtiva === 'sped_contribuicoes' && (
          <section className="sped-page">
            <div className="sped-card">
              <h3>SPED Contribuições</h3>
              <p className="sped-subtitle">Módulo planejado para próximas etapas.</p>
            </div>
          </section>
        )}
        {rotaAtiva === 'clientes' && (
          <section className="sped-page">
            <div className="sped-card">
              <h3>Clientes</h3>
              <p className="sped-subtitle">Módulo em breve.</p>
            </div>
          </section>
        )}
      </SidebarLayout>
    </ToastProvider>
  );
}

export default App;