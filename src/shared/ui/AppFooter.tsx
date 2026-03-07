export function AppFooter() {
  const repositoryUrl = 'https://github.com/auri-gabriel/quadro-de-avaliacao';

  return (
    <footer className='app-footer bg-dark text-white text-center py-5'>
      <div className='container'>
        <small className='d-flex flex-column gap-1'>
          <span>© 2025 GEInfoEdu.</span>
          <a
            href={repositoryUrl}
            target='_blank'
            rel='noreferrer'
            className='link-light'
          >
            Código-fonte no GitHub
          </a>
        </small>
      </div>
    </footer>
  );
}
