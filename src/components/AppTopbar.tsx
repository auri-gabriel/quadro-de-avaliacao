interface AppTopbarProps {
  lastUpdated: string;
}

export function AppTopbar({ lastUpdated }: AppTopbarProps) {
  return (
    <header className='app-topbar'>
      <div className='container-fluid board-layout d-flex justify-content-between align-items-center py-2'>
        <div className='app-brand'>
          <i className='bi bi-kanban me-2' aria-hidden='true' />
          Quadro de Avaliação
        </div>
        <div className='app-topbar-meta'>
          <i className='bi bi-clock-history me-1' aria-hidden='true' />
          Atualizado em {lastUpdated}
        </div>
      </div>
    </header>
  );
}
