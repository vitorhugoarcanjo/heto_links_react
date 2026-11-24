import { useState } from 'react';
import { SidebarLayout } from './components/layout/SidebarLayout';
import { useLinksBoard } from './features/links-board/hooks';
import { LinksBoardPage } from './features/links-board/pages/LinksBoardPage';
import type { RotaMenu } from './features/links-board/types';

export function App() {
  const [rotaAtiva, setRotaAtiva] = useState<RotaMenu>('links');
  const boardState = useLinksBoard();

  return (
    <SidebarLayout
      config={boardState.config}
      rotaAtiva={rotaAtiva}
      onSelecionarRota={setRotaAtiva}
      erroApi={boardState.erroApi}
    >
      {rotaAtiva === 'links' ? (
        <LinksBoardPage boardState={boardState} />
      ) : (
        <main className="clientes-placeholder">
          <h1>Clientes e Conexões</h1>
          <p>Módulo reservado para evolução do sistema Hetosoft.</p>
        </main>
      )}
    </SidebarLayout>
  );
}

export default App;