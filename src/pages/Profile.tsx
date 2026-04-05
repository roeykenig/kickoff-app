import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, TrendingUp, TrendingDown, Minus, UserPlus, UserCheck, UserX, Clock } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { mockPlayers } from '../data/mockData';
import { Player, AuthUser } from '../types';
import RatingDisplay from '../components/RatingDisplay';

type AnyPlayer = Player | AuthUser;

function useResolvePlayer(id: string): AnyPlayer | null {
  const { getAllUsers } = useAuth();
  const mock = mockPlayers.find(p => p.id === id);
  if (mock) return mock;
  return getAllUsers().find(u => u.id === id) ?? null;
}

function getPlayerInfo(id: string, getAllUsers: () => AuthUser[]) {
  const mock = mockPlayers.find(p => p.id === id);
  if (mock) return { name: mock.name, initials: mock.initials, avatarColor: mock.avatarColor, photoUrl: mock.photoUrl };
  const user = getAllUsers().find(u => u.id === id);
  if (user) return { name: user.name, initials: user.initials, avatarColor: user.avatarColor, photoUrl: user.photoUrl };
  return null;
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const { currentUser, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, getAllUsers } = useAuth();

  const raw = useResolvePlayer(id ?? '');
  const isMe = currentUser?.id === id;
  const isMockP = id?.startsWith('p') ?? false;

  if (!raw) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">{lang === 'he' ? 'משתמש לא נמצא' : 'User not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary-600 underline">{lang === 'he' ? 'חזרה' : 'Back'}</button>
      </div>
    );
  }

  const p = raw as Player; // Both Player and AuthUser share display fields

  const ratingColor = (r: number) => r >= 7 ? 'text-green-600' : r >= 4 ? 'text-amber-500' : 'text-red-500';
  const ratingBg = (r: number) => r >= 7 ? 'bg-green-50' : r >= 4 ? 'bg-amber-50' : 'bg-red-50';

  // Friend status relative to currentUser
  type FriendStatus = 'self' | 'friend' | 'sent' | 'pending' | 'none';
  const friendStatus: FriendStatus = (() => {
    if (!currentUser || !id) return 'none';
    if (isMe) return 'self';
    if (currentUser.friends.includes(id)) return 'friend';
    if (currentUser.sentRequests.includes(id)) return 'sent';
    if (currentUser.pendingRequests.includes(id)) return 'pending';
    return 'none';
  })();

  // Pending friend requests for MY profile
  const pendingRequests = isMe && currentUser
    ? currentUser.pendingRequests.map(rid => ({ id: rid, ...getPlayerInfo(rid, getAllUsers) })).filter(r => r.name)
    : [];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
        <ChevronLeft size={16} />{lang === 'he' ? 'חזרה' : 'Back'}
      </button>

      {/* Pending friend requests (on my profile) */}
      {pendingRequests.length > 0 && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 mb-4">
          <h3 className="font-semibold text-blue-800 mb-3">
            {lang === 'he' ? `בקשות חברות (${pendingRequests.length})` : `Friend Requests (${pendingRequests.length})`}
          </h3>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${req.avatarColor ?? 'bg-gray-400'} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {req.initials ?? '?'}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800">{req.name}</span>
                <button
                  onClick={() => acceptFriendRequest(req.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {lang === 'he' ? 'אשר' : 'Accept'}
                </button>
                <button
                  onClick={() => declineFriendRequest(req.id)}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                >
                  {lang === 'he' ? 'דחה' : 'Decline'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="shrink-0">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt={p.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className={`w-20 h-20 rounded-full ${p.avatarColor} flex items-center justify-center text-white text-2xl font-bold`}>
                {p.initials}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{p.name}</h1>
                {p.position && <p className="text-sm text-gray-500 mt-0.5">{p.position}</p>}
                {isMe && (
                  <span className="inline-block mt-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                    {lang === 'he' ? 'הפרופיל שלי' : 'My Profile'}
                  </span>
                )}
              </div>
              <div className={`rounded-2xl p-3 text-center ${ratingBg(p.rating)}`}>
                <RatingDisplay rating={p.rating} size="lg" />
                <p className="text-xs text-gray-500 mt-0.5">{lang === 'he' ? 'דירוג' : 'Rating'}</p>
              </div>
            </div>
            {p.bio && <p className="text-sm text-gray-600 mt-3">{p.bio}</p>}

            {/* Friend button */}
            {!isMe && currentUser && (
              <div className="mt-3">
                {friendStatus === 'none' && (
                  <button
                    onClick={() => sendFriendRequest(id!)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <UserPlus size={14} />
                    {isMockP
                      ? (lang === 'he' ? 'הוסף חבר' : 'Add Friend')
                      : (lang === 'he' ? 'שלח בקשת חברות' : 'Send Friend Request')}
                  </button>
                )}
                {friendStatus === 'sent' && (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-xl">
                    <Clock size={14} />
                    {lang === 'he' ? 'בקשה נשלחה' : 'Request sent'}
                  </div>
                )}
                {friendStatus === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptFriendRequest(id!)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <UserCheck size={14} />
                      {lang === 'he' ? 'אשר חברות' : 'Accept'}
                    </button>
                    <button
                      onClick={() => declineFriendRequest(id!)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <UserX size={14} />
                      {lang === 'he' ? 'דחה' : 'Decline'}
                    </button>
                  </div>
                )}
                {friendStatus === 'friend' && (
                  <button
                    onClick={() => removeFriend(id!)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-red-50 text-green-700 hover:text-red-600 text-sm font-semibold rounded-xl border border-green-200 hover:border-red-200 transition-colors"
                  >
                    <UserCheck size={14} />
                    {lang === 'he' ? 'חבר ✓' : 'Friends ✓'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <StatBox value={p.gamesPlayed} label={lang === 'he' ? 'משחקים' : 'Games'} />
          <StatBox value={p.rating.toFixed(1)} label={lang === 'he' ? 'דירוג' : 'Rating'} color={ratingColor(p.rating)} />
          <StatBox
            value={p.ratingHistory.length > 0
              ? (p.ratingHistory[0].change > 0 ? `+${p.ratingHistory[0].change.toFixed(1)}` : p.ratingHistory[0].change.toFixed(1))
              : '—'}
            label={lang === 'he' ? 'שינוי אחרון' : 'Last Δ'}
            color={p.ratingHistory[0]?.change > 0 ? 'text-green-600' : p.ratingHistory[0]?.change < 0 ? 'text-red-500' : 'text-gray-400'}
          />
        </div>
      </div>

      {/* Rating history */}
      {p.ratingHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">{lang === 'he' ? 'היסטוריית דירוג' : 'Rating History'}</h2>
          {/* Mini bar chart */}
          <div className="flex items-end gap-1 h-14 mb-4">
            {[...p.ratingHistory].reverse().map((entry, i) => (
              <div key={i} className="flex-1">
                <div
                  className={`w-full rounded-t-sm ${i === p.ratingHistory.length - 1 ? 'bg-primary-500' : 'bg-primary-200'}`}
                  style={{ height: `${Math.max(8, (entry.rating / 10) * 100)}%` }}
                  title={`★ ${entry.rating.toFixed(1)}`}
                />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {p.ratingHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="shrink-0">
                  {entry.change > 0 ? <TrendingUp size={15} className="text-green-500" />
                    : entry.change < 0 ? <TrendingDown size={15} className="text-red-500" />
                    : <Minus size={15} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{entry.lobbyTitle}</p>
                  <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US')}</p>
                </div>
                <div className="text-end shrink-0">
                  <span className={`text-sm font-semibold ${entry.change > 0 ? 'text-green-600' : entry.change < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {entry.change > 0 ? '+' : ''}{entry.change.toFixed(1)}
                  </span>
                  <p className="text-xs text-gray-400">★ {entry.rating.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lobby history */}
      {p.lobbyHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{lang === 'he' ? 'משחקים אחרונים' : 'Recent Games'}</h2>
          <div className="space-y-3">
            {p.lobbyHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={15} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{entry.lobbyTitle}</p>
                  <p className="text-xs text-gray-400">{entry.fieldName} · {entry.city}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US')}</p>
                  <span className={`text-xs font-medium ${entry.ratingChange > 0 ? 'text-green-600' : entry.ratingChange < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {entry.ratingChange > 0 ? '+' : ''}{entry.ratingChange.toFixed(1)} ★
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {p.ratingHistory.length === 0 && p.lobbyHistory.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <p className="text-3xl mb-2">⚽</p>
          <p>{lang === 'he' ? 'עדיין לא השתתף/ה במשחקים' : 'No games yet'}</p>
          <p className="text-sm mt-1">{lang === 'he' ? 'הצטרף/י למשחק ראשון!' : 'Join your first game!'}</p>
        </div>
      )}
    </main>
  );
}

function StatBox({ value, label, color = 'text-gray-900' }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
