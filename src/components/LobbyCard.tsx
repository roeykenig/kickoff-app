import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, Lock } from 'lucide-react';
import { Lobby } from '../types';
import { useLang } from '../contexts/LanguageContext';
import { formatDateTime } from '../utils/format';
import SkillBadge from './SkillBadge';
import PlayerAvatarStack from './PlayerAvatarStack';

interface Props {
  lobby: Lobby;
}

export default function LobbyCard({ lobby }: Props) {
  const navigate = useNavigate();
  const { t, lang } = useLang();

  const isFull = lobby.players.length >= lobby.maxPlayers;
  const spotsLeft = lobby.maxPlayers - lobby.players.length;
  const dateStr = formatDateTime(lobby.datetime, lang, t.common.today, t.common.tomorrow);

  return (
    <div
      onClick={() => navigate(`/lobby/${lobby.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {lobby.isPrivate && (
              <Lock size={13} className="text-gray-400 shrink-0" />
            )}
            <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">
              {lobby.title}
            </h3>
          </div>
          <p className="text-sm text-gray-500">{lobby.city}</p>
        </div>
        <SkillBadge level={lobby.skillLevel} size="sm" />
      </div>

      {/* Info rows */}
      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-gray-400 shrink-0" />
          <span className="truncate">{lobby.fieldName}</span>
          <span className="text-gray-400 shrink-0 ms-auto">
            {lobby.distanceKm} {t.common.km}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400 shrink-0" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-gray-400 shrink-0" />
          <span>
            {lobby.players.length}/{lobby.maxPlayers} {t.lobby.players}
          </span>
          {!isFull && (
            <span className="text-primary-600 font-medium ms-auto">
              {spotsLeft} {t.lobby.spotsLeft}
            </span>
          )}
          {isFull && (
            <span className="text-red-500 font-medium ms-auto">{t.lobby.full}</span>
          )}
        </div>
      </div>

      {/* Price + players */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <PlayerAvatarStack players={lobby.players} />
        <div className="text-sm font-semibold text-gray-700">
          {lobby.price && lobby.price > 0
            ? `${lobby.price} ${t.lobby.perPerson}`
            : <span className="text-primary-600">{t.lobby.free}</span>
          }
        </div>
      </div>
    </div>
  );
}
