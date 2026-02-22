interface AppTopbarProps {
  lastUpdated: string;
}

export function AppTopbar({ lastUpdated }: AppTopbarProps) {
  return (
    <header className='app-topbar'>
      <div className='container-fluid board-layout d-flex justify-content-between align-items-center py-2'>
        <div className='app-brand'>Quadro de Avaliação</div>
        <div className='app-topbar-meta'>Atualizado em {lastUpdated}</div>
      </div>
    </header>
  );
}
