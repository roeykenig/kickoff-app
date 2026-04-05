import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, toggleLanguage } = useLang();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-bold text-xl text-gray-900 hover:text-primary-600 transition-colors"
        >
          <span className="text-2xl">⚽</span>
          <span>{t.app.name}</span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {lang === 'he' ? 'EN' : 'עב'}
          </button>

          {/* Home link (hidden on home) */}
          {!isActive('/') && (
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t.nav.home}
            </button>
          )}

          {/* Create game */}
          <button
            onClick={() => navigate('/create')}
            className="text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            {t.nav.createGame}
          </button>
        </div>
      </div>
    </header>
  );
}
