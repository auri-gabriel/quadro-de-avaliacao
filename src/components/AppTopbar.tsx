import { type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY } from '../i18n';

interface AppTopbarProps {
  lastUpdated: string;
}

export function AppTopbar({ lastUpdated }: AppTopbarProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  };

  return (
    <nav className='app-topbar navbar navbar-expand-lg navbar-light bg-light border-bottom'>
      <div className='container-fluid board-layout py-2'>
        <a
          className='navbar-brand d-flex align-items-center fw-bold text-decoration-none'
          href='#'
          title={t('topbar.brandTitle')}
        >
          <span className='app-brand-acronym me-3'>QDA</span>
          <span className='app-brand-text d-none d-xl-block'>
            {t('app.title')}
          </span>
        </a>

        <div className='d-flex align-items-center gap-3'>
          <div className='app-topbar-meta d-flex align-items-center'>
            <i className='bi bi-clock-history me-1' aria-hidden='true' />
            <span>{t('topbar.updatedAt', { date: lastUpdated })}</span>
          </div>

          <div className='d-flex align-items-center gap-2'>
            <label
              htmlFor='language-select'
              className='small text-body-secondary'
            >
              {t('topbar.language')}
            </label>
            <select
              id='language-select'
              className='form-select form-select-sm'
              value={i18n.language}
              onChange={handleLanguageChange}
              aria-label={t('topbar.language')}
            >
              <option value='pt-BR'>{t('topbar.portuguese')}</option>
              <option value='en'>{t('topbar.english')}</option>
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}
