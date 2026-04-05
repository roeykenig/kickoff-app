import { useState } from 'react';
import { SkillLevel } from '../types';
import { useLang } from '../contexts/LanguageContext';
import { mockLobbies } from '../data/mockData';
import LobbyCard from '../components/LobbyCard';

type Filter = SkillLevel | 'all';

const FILTERS: Filter[] = ['all', 'beginner', 'intermediate', 'advanced', 'mixed'];

export default function Home() {
  const { t } = useLang();
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  const filtered = activeFilter === 'all'
    ? mockLobbies
    : mockLobbies.filter(l => l.skillLevel === activeFilter);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.home.title}</h1>
        <p className="text-gray-500 text-base">{t.home.subtitle}</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-6 justify-center">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              activeFilter === f
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {f === 'all' ? t.filters.all : t.skillLevel[f]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-16 text-lg">{t.home.noResults}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(lobby => (
            <LobbyCard key={lobby.id} lobby={lobby} />
          ))}
        </div>
      )}
    </main>
  );
}
