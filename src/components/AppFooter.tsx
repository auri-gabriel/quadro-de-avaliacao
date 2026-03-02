import { useTranslation } from 'react-i18next';

export function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className='app-footer bg-dark text-white text-center py-5'>
      <div className='container-fluid board-layout'>
        <small>{t('footer.rights', { year: new Date().getFullYear() })}</small>
      </div>
    </footer>
  );
}
