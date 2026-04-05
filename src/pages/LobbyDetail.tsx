import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, ShieldCheck, Lock, ChevronLeft, AlertCircle } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';
import { mockLobbies } from '../data/mockData';
import { Player } from '../types';
import { formatDateTime } from '../utils/format';
import RatingDisplay, { RatingBadge } from '../components/RatingDisplay';

type MyStatus = 'none' | 'joined' | 'waitlisted' | 'pending_confirm';

function avgRating(players: { rating: number }[]) {
  if (!players.length) return null;
  return players.reduce((s, p) => s + p.rating, 0) / players.length;
}

export default function LobbyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, lang } = useLang();

  const lobby = mockLobbies.find(l => l.id === id);

  // Local mutable state for demo
  const [players, setPlayers] = useState<Player[]>(lobby?.players ?? []);
  const [waitlist, setWaitlist] = useState<Player[]>(lobby?.waitlist ?? []);
  const [myStatus, setMyStatus] = useState<MyStatus>('none');

  if (!lobby) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">{lang === 'he' ? 'המשחק לא נמצא' : 'Game not found'}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-primary-600 underline">{t.lobby.back}</button>
      </div>
    );
  }

  const isFull = players.length >= lobby.maxPlayers;
  const dateStr = formatDateTime(lobby.datetime, lang, t.common.today, t.common.tomorrow);
  const avg = avgRating(players);

  const mockMe: Player = {
    id: 'me', name: lang === 'he' ? 'אני' : 'Me', initials: lang === 'he' ? 'אנ' : 'Me',
    avatarColor: 'bg-primary-500', rating: 5, gamesPlayed: 0,
    ratingHistory: [], lobbyHistory: [],
  };

  const handleJoin = () => {
    if (isFull) {
      setWaitlist(prev => [...prev, mockMe]);
      setMyStatus('waitlisted');
    } else {
      setPlayers(prev => [...prev, mockMe]);
      setMyStatus('joined');
    }
  };

  const handleLeave = () => {
    if (myStatus === 'joined') {
      setPlayers(prev => prev.filter(p => p.id !== 'me'));
      // Promote first in waitlist to pending_confirm
      if (waitlist.length > 0) {
        setWaitlist(prev => prev.slice(1));
        // In a real app, the first waiter would get a notification
      }
    } else if (myStatus === 'waitlisted') {
      setWaitlist(prev => prev.filter(p => p.id !== 'me'));
    } else if (myStatus === 'pending_confirm') {
      setMyStatus('none');
      return;
    }
    setMyStatus('none');
  };

  const handleConfirm = () => {
    setPlayers(prev => [...prev, mockMe]);
    setMyStatus('joined');
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
        <ChevronLeft size={16} />{t.lobby.back}
      </button>

      {/* Title card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {lobby.isPrivate && <Lock size={14} className="text-gray-400" />}
              <h1 className="text-2xl font-bold text-gray-900">{lobby.title}</h1>
            </div>
            <p className="text-gray-500">{lobby.fieldName}, {lobby.city}</p>
          </div>
          {avg !== null && (
            <div className="text-end">
              <RatingBadge rating={avg} />
              <p className="text-xs text-gray-400 mt-1">{lang === 'he' ? 'ממוצע שחקנים' : 'avg rating'}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <InfoRow icon={<MapPin size={15} />} label={t.lobby.location}>
            <span>{lobby.address}, {lobby.city}</span>
            <span className="text-gray-400 block text-xs">{lobby.distanceKm} {t.common.km} {t.common.away}</span>
          </InfoRow>
          <InfoRow icon={<Clock size={15} />} label={t.lobby.dateTime}>{dateStr}</InfoRow>
          <InfoRow icon={<Users size={15} />} label={t.lobby.players}>
            <span className={isFull ? 'text-red-500 font-semibold' : 'text-primary-600 font-semibold'}>
              {players.length} / {lobby.maxPlayers}
            </span>
            {lobby.numTeams && lobby.playersPerTeam && (
              <span className="text-gray-400 text-xs block">
                {lobby.numTeams} {lang === 'he' ? 'קבוצות' : 'teams'} × {lobby.playersPerTeam} {lang === 'he' ? 'שחקנים' : 'players'}
              </span>
            )}
          </InfoRow>
          <InfoRow icon={<ShieldCheck size={15} />} label={t.lobby.price}>
            {lobby.price && lobby.price > 0
              ? `${lobby.price} ${t.lobby.perPerson}`
              : <span className="text-primary-600 font-semibold">{t.lobby.free}</span>}
          </InfoRow>
        </div>

        {lobby.minRating && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-400">{lang === 'he' ? 'דירוג מינימלי:' : 'Min rating:'}</span>
            <RatingDisplay rating={lobby.minRating} size="sm" />
          </div>
        )}

        {lobby.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">{t.lobby.description}</p>
            <p className="text-sm text-gray-700">{lobby.description}</p>
          </div>
        )}
      </div>

      {/* Map placeholder */}
      <div className="bg-gray-100 rounded-2xl h-36 flex items-center justify-center mb-4 border border-gray-200">
        <div className="text-center text-gray-400">
          <MapPin size={24} className="mx-auto mb-1 text-gray-300" />
          <p className="text-sm">{lobby.fieldName}</p>
          <p className="text-xs">{lobby.address}</p>
        </div>
      </div>

      {/* Players */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">{t.lobby.playerList} ({players.length}/{lobby.maxPlayers})</h2>
        <div className="space-y-1">
          {players.map(player => (
            <button
              key={player.id}
              onClick={() => player.id !== 'me' && navigate(`/profile/${player.id}`)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-start ${player.id !== 'me' ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
            >
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-9 h-9 rounded-full ${player.avatarColor} flex items-center justify-center text-white font-semibold text-xs shrink-0`}>
                  {player.initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-gray-900 text-sm">{player.name}</p>
                  {player.id === lobby.createdBy && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">{t.lobby.organizer}</span>
                  )}
                  {player.id === 'me' && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{lang === 'he' ? 'אני' : 'me'}</span>
                  )}
                </div>
                {player.position && <p className="text-xs text-gray-400">{player.position}</p>}
              </div>
              {player.id !== 'me' && (
                <div className="shrink-0">
                  <RatingDisplay rating={player.rating} size="sm" />
                  <p className="text-xs text-gray-400 text-end">{player.gamesPlayed} {t.lobby.gamesPlayed}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 mb-4">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertCircle size={16} />
            {lang === 'he' ? `רשימת המתנה (${waitlist.length})` : `Waitlist (${waitlist.length})`}
          </h3>
          <div className="space-y-2">
            {waitlist.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="text-amber-600 font-semibold w-5 text-center">{i + 1}</span>
                <div className={`w-7 h-7 rounded-full ${p.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {p.initials}
                </div>
                <span className="text-gray-700 flex-1">{p.name}</span>
                <RatingDisplay rating={p.rating} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending confirmation banner */}
      {myStatus === 'pending_confirm' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 text-center">
          <p className="font-semibold text-green-800 mb-1">
            {lang === 'he' ? '🎉 יש לך מקום!' : '🎉 A spot opened for you!'}
          </p>
          <p className="text-sm text-green-700 mb-3">
            {lang === 'he' ? 'אשר הצטרפות כדי להבטיח את המקום שלך' : 'Confirm to secure your spot'}
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={handleConfirm} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors">
              {lang === 'he' ? 'אשר הצטרפות' : 'Confirm'}
            </button>
            <button onClick={handleLeave} className="px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-semibold text-sm transition-colors">
              {lang === 'he' ? 'דחה' : 'Decline'}
            </button>
          </div>
        </div>
      )}

      {/* Main CTA */}
      {myStatus !== 'pending_confirm' && (
        <>
          {myStatus === 'none' && (
            <button
              onClick={handleJoin}
              className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg ${
                isFull
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isFull
                ? (lang === 'he' ? '+ הצטרף לרשימת המתנה' : '+ Join Waitlist')
                : t.lobby.join}
            </button>
          )}

          {myStatus === 'joined' && (
            <button onClick={handleLeave} className="w-full py-4 rounded-2xl font-semibold text-base bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              {t.lobby.leave}
            </button>
          )}

          {myStatus === 'waitlisted' && (
            <div className="space-y-2">
              <div className="w-full py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-medium text-sm text-center">
                {lang === 'he'
                  ? `אתה במקום #${waitlist.findIndex(p => p.id === 'me') + 1} ברשימת המתנה`
                  : `You are #${waitlist.findIndex(p => p.id === 'me') + 1} on the waitlist`}
              </div>
              <button onClick={handleLeave} className="w-full py-3 rounded-2xl font-medium text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
                {lang === 'he' ? 'הסר אותי מהרשימה' : 'Remove me from waitlist'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-gray-400 text-xs mb-0.5">{label}</p>
        <div className="text-gray-800">{children}</div>
      </div>
    </div>
  );
}
