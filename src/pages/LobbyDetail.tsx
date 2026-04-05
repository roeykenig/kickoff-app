import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, Star, ShieldCheck, Lock } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';
import { mockLobbies } from '../data/mockData';
import { formatDateTime } from '../utils/format';
import SkillBadge from '../components/SkillBadge';

export default function LobbyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [joined, setJoined] = useState(false);

  const lobby = mockLobbies.find(l => l.id === id);

  if (!lobby) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">המשחק לא נמצא</p>
        <button onClick={() => navigate('/')} className="mt-4 text-primary-600 underline">
          {t.lobby.back}
        </button>
      </div>
    );
  }

  const isFull = lobby.players.length >= lobby.maxPlayers;
  const dateStr = formatDateTime(lobby.datetime, lang, t.common.today, t.common.tomorrow);
  const organizer = lobby.players.find(p => p.id === lobby.createdBy) ?? lobby.players[0];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-primary-600 mb-6 flex items-center gap-1 transition-colors"
      >
        {t.lobby.back}
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
          <SkillBadge level={lobby.skillLevel} />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <InfoRow icon={<MapPin size={15} />} label={t.lobby.location}>
            {lobby.address}, {lobby.city}
            <span className="text-gray-400 block text-xs">{lobby.distanceKm} {t.common.km} {t.common.away}</span>
          </InfoRow>
          <InfoRow icon={<Clock size={15} />} label={t.lobby.dateTime}>
            {dateStr}
          </InfoRow>
          <InfoRow icon={<Users size={15} />} label={t.lobby.players}>
            <span className={isFull ? 'text-red-500 font-semibold' : 'text-primary-600 font-semibold'}>
              {lobby.players.length} / {lobby.maxPlayers}
            </span>
            {!isFull && (
              <span className="text-gray-400 text-xs block">
                {lobby.maxPlayers - lobby.players.length} {t.lobby.spotsLeft}
              </span>
            )}
          </InfoRow>
          <InfoRow icon={<ShieldCheck size={15} />} label={t.lobby.price}>
            {lobby.price && lobby.price > 0
              ? `${lobby.price} ${t.lobby.perPerson}`
              : <span className="text-primary-600 font-semibold">{t.lobby.free}</span>
            }
          </InfoRow>
        </div>

        {lobby.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">{t.lobby.description}</p>
            <p className="text-sm text-gray-700">{lobby.description}</p>
          </div>
        )}
      </div>

      {/* Map placeholder */}
      <div className="bg-gray-100 rounded-2xl h-40 flex items-center justify-center mb-4 border border-gray-200">
        <div className="text-center text-gray-400">
          <MapPin size={28} className="mx-auto mb-1 text-gray-300" />
          <p className="text-sm">{lobby.fieldName}</p>
          <p className="text-xs">{lobby.address}</p>
        </div>
      </div>

      {/* Players list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">
          {t.lobby.playerList} ({lobby.players.length})
        </h2>
        <div className="space-y-3">
          {lobby.players.map(player => (
            <div key={player.id} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${player.avatarColor} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                {player.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{player.name}</p>
                  {player.id === lobby.createdBy && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                      {t.lobby.organizer}
                    </span>
                  )}
                </div>
                {player.position && (
                  <p className="text-xs text-gray-400">{player.position}</p>
                )}
              </div>
              <div className="text-end shrink-0">
                <div className="flex items-center gap-1 text-amber-500 justify-end">
                  <Star size={12} fill="currentColor" />
                  <span className="text-sm font-medium text-gray-700">{player.rating}</span>
                </div>
                <p className="text-xs text-gray-400">{player.gamesPlayed} {t.lobby.gamesPlayed}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => setJoined(j => !j)}
        disabled={isFull && !joined}
        className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 ${
          joined
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            : isFull
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
        }`}
      >
        {joined ? t.lobby.leave : isFull ? t.lobby.full : t.lobby.join}
      </button>
    </main>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
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
