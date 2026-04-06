import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import LobbyCard from '../components/LobbyCard';
import { fetchLobbies } from '../lib/appData';
import type { Lobby } from '../types';

type Tab = 'all' | 'friends';

function avgRating(players: { rating: number }[]) {
  if (!players.length) return 0;
  return players.reduce((sum, player) => sum + player.rating, 0) / players.length;
}

function isFuture(lobby: Lobby) {
  return new Date(lobby.datetime) > new Date();
}

export default function HomeLive() {
  const { t, lang } = useLang();
  const { currentUser } = useAuth();
  const [minRating, setMinRating] = useState(1);
  const [canJoinOnly, setCanJoinOnly] = useState(false);
  const [tab, setTab] = useState<Tab>('all');
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setLoadError(null);
        const nextLobbies = await fetchLobbies();
        if (!cancelled) {
          setLobbies(nextLobbies);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load games');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const futureLobbies = lobbies.filter(isFuture);

  const allFiltered = futureLobbies.filter((lobby) => {
    if (avgRating(lobby.players) < minRating && lobby.players.length > 0) {
      return false;
    }

    if (canJoinOnly && currentUser && lobby.minRating && currentUser.rating < lobby.minRating) {
      return false;
    }

    return true;
  });

  const friendLobbies = currentUser
    ? futureLobbies.filter((lobby) => lobby.players.some((player) => currentUser.friends.includes(player.id)))
    : [];

  const displayed = tab === 'friends' ? friendLobbies : allFiltered;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.home.title}</h1>
        <p className="text-gray-500 text-base">{t.home.subtitle}</p>
      </div>

      <div className="flex gap-2 justify-center mb-5">
        <TabBtn active={tab === 'all'} onClick={() => setTab('all')}>
          {lang === 'he' ? 'כל המשחקים' : 'All Games'}
        </TabBtn>
        <TabBtn active={tab === 'friends'} onClick={() => setTab('friends')}>
          <Users size={14} className="inline me-1" />
          {lang === 'he' ? 'חברים' : 'Friends'}
          {currentUser && friendLobbies.length > 0 && (
            <span className="ms-1.5 bg-primary-600 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
              {friendLobbies.length}
            </span>
          )}
        </TabBtn>
      </div>

      {tab === 'all' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 max-w-md mx-auto space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">
                {lang === 'he' ? 'דירוג ממוצע מינימלי' : 'Min average rating'}
              </span>
              <span className="text-sm font-bold text-primary-600">★ {minRating.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={minRating}
              onChange={(event) => setMinRating(parseFloat(event.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>1.0</span>
              <span>10.0</span>
            </div>
          </div>

          {currentUser && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setCanJoinOnly((value) => !value)}
                className={`relative w-10 h-5 rounded-full transition-colors ${canJoinOnly ? 'bg-primary-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${canJoinOnly ? 'start-5' : 'start-0.5'}`} />
              </div>
              <span className="text-sm text-gray-700">
                {lang === 'he'
                  ? `הצג רק משחקים שאני יכול להיכנס (★ ${currentUser.rating.toFixed(1)})`
                  : `Only games I can join (★ ${currentUser.rating.toFixed(1)})`}
              </span>
            </label>
          )}
        </div>
      )}

      {tab === 'friends' && !currentUser && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-2">👥</p>
          <p className="text-lg">{lang === 'he' ? 'התחבר כדי לראות משחקי חברים' : "Log in to see friends' games"}</p>
        </div>
      )}

      {tab === 'friends' && currentUser && friendLobbies.length === 0 && !loading && !loadError && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-2">👥</p>
          <p>{lang === 'he' ? 'אין לחברים שלך משחקים קרובים' : 'No upcoming games from your friends'}</p>
          <p className="text-sm mt-1">{lang === 'he' ? 'הוסף חברים מהפרופילים שלהם' : 'Add friends from their profiles'}</p>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-16 text-lg">{lang === 'he' ? 'טוען משחקים...' : 'Loading games...'}</p>
      ) : loadError ? (
        <p className="text-center text-red-500 py-16 text-lg">{loadError}</p>
      ) : displayed.length === 0 && tab === 'all' ? (
        <p className="text-center text-gray-400 py-16 text-lg">{t.home.noResults}</p>
      ) : displayed.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((lobby) => (
            <LobbyCard key={lobby.id} lobby={lobby} />
          ))}
        </div>
      ) : null}
    </main>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
      }`}
    >
      {children}
    </button>
  );
}
