interface AppTopbarProps {
  lastUpdated: string;
}

export function AppTopbar({ lastUpdated }: AppTopbarProps) {
  return (
    <nav className='app-topbar navbar navbar-expand-lg navbar-light bg-light border-bottom'>
      <div className='container-fluid board-layout py-2'>
        <a
          className='navbar-brand d-flex align-items-center fw-bold text-decoration-none'
          href='#'
          title='Quadro de Avaliação desenvolvido pelo grupo TRAMAS'
        >
          <span className='app-brand-acronym me-3'>QDA</span>
          <span className='app-brand-text d-none d-xl-block'>
            Quadro de Avaliação
          </span>
        </a>

        <div className='app-topbar-meta d-flex align-items-center'>
          <i className='bi bi-clock-history me-1' aria-hidden='true' />
          <span>Atualizado em {lastUpdated}</span>
        </div>
      </div>
    </nav>
  );
}
