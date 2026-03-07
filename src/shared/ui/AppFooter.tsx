export function AppFooter() {
  const repositoryUrl = 'https://github.com/auri-gabriel/quadro-de-avaliacao';
  const issuesUrl = `${repositoryUrl}/issues`;

  return (
    <footer className='app-footer bg-dark text-white text-center py-5'>
      <div className='container-fluid board-layout'>
        <small>
          © 2025 TRAMAS. Todos os direitos reservados.{' '}
          <a
            href={repositoryUrl}
            target='_blank'
            rel='noreferrer'
            className='link-light'
          >
            Repositório
          </a>{' '}
          |{' '}
          <a
            href={issuesUrl}
            target='_blank'
            rel='noreferrer'
            className='link-light'
          >
            Reportar problema
          </a>
        </small>
      </div>
    </footer>
  );
}
