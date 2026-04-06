import { useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { createLobby } from '../lib/appData';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useLang } from '../contexts/LanguageContext';
import { buildLobbyDateTime, validateCreateLobbyDraft } from '../lib/validation';
import type { GameType } from '../types';

const TEAM_OPTIONS = [2, 3, 4];

export default function CreateLobbyPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, lang } = useLang();
  const [gameType, setGameType] = useState<GameType>('friendly');
  const [form, setForm] = useState({
    title: '',
    fieldName: '',
    address: '',
    city: '',
    date: '',
    time: '',
    numTeams: 2,
    playersPerTeam: 5,
    minRating: '1',
    price: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const currentUserId = currentUser.id;
  const maxPlayers = form.numTeams * form.playersPerTeam;

  function setField(key: 'title' | 'fieldName' | 'address' | 'city' | 'date' | 'time' | 'minRating' | 'price' | 'description') {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const numericPrice = form.price ? Number(form.price) : undefined;
    const minRating = gameType === 'competitive' ? Number(form.minRating) : undefined;
    const validationErrors = validateCreateLobbyDraft({
      title: form.title,
      fieldName: form.fieldName,
      address: form.address,
      city: form.city,
      date: form.date,
      time: form.time,
      numTeams: form.numTeams,
      playersPerTeam: form.playersPerTeam,
      minRating,
      price: numericPrice,
      description: form.description,
    });

    const datetime = buildLobbyDateTime(form.date, form.time);
    if (validationErrors.length > 0 || !datetime) {
      setError(validationErrors[0] ?? 'Choose a valid date and time.');
      setSubmitting(false);
      return;
    }

    try {
      const lobbyId = await createLobby({
        title: form.title,
        fieldName: form.fieldName,
        address: form.address,
        city: form.city,
        datetime: datetime.toISOString(),
        maxPlayers,
        numTeams: form.numTeams,
        playersPerTeam: form.playersPerTeam,
        minRating,
        price: numericPrice,
        description: form.description || undefined,
        createdBy: currentUserId,
        gameType,
      });

      navigate(`/lobby/${lobbyId}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to create game');
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.create.title}</h1>
        <p className="text-gray-500 mt-1">{t.create.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'he' ? 'סוג משחק' : 'Game type'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGameType('friendly')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  gameType === 'friendly'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                }`}
              >
                {lang === 'he' ? '⚽ ידידותי' : '⚽ Friendly'}
              </button>
              <button
                type="button"
                onClick={() => setGameType('competitive')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  gameType === 'competitive'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                }`}
              >
                {lang === 'he' ? '🏆 תחרותי' : '🏆 Competitive'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {gameType === 'friendly'
                ? (lang === 'he' ? 'משחק ידידותי — ללא השפעה על דירוג' : 'Friendly game — no effect on ratings')
                : (lang === 'he' ? 'משחק תחרותי — שחקנים מדרגים אחד את השני בסיום' : 'Competitive — players rate each other anonymously after the game')}
            </p>
          </div>
        </Card>

        <Card>
          <Field label={lang === 'he' ? 'שם המשחק / הלובי' : 'Game / Lobby name'}>
            <Input
              placeholder={lang === 'he' ? 'למשל: משחק ערב בגורדון' : 'e.g. Evening game at Gordon'}
              value={form.title}
              onChange={setField('title')}
              required
            />
          </Field>
        </Card>

        <Card>
          <Field label={t.create.fieldName}>
            <Input placeholder={t.create.fieldNamePlaceholder} value={form.fieldName} onChange={setField('fieldName')} required />
          </Field>
          <Field label={t.create.address}>
            <Input placeholder={t.create.addressPlaceholder} value={form.address} onChange={setField('address')} required />
          </Field>
          <Field label={t.create.city}>
            <Input placeholder={t.create.cityPlaceholder} value={form.city} onChange={setField('city')} required />
          </Field>
        </Card>

        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.create.date}>
              <Input type="date" value={form.date} onChange={setField('date')} required />
            </Field>
            <Field label={t.create.time}>
              <Input type="time" value={form.time} onChange={setField('time')} required />
            </Field>
          </div>
        </Card>

        <Card>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'he' ? 'מספר קבוצות' : 'Number of teams'}
            </label>
            <div className="flex gap-2">
              {TEAM_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, numTeams: count }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    form.numTeams === count
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {count} {lang === 'he' ? 'קבוצות' : 'teams'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                {lang === 'he' ? 'שחקנים לקבוצה' : 'Players per team'}
              </label>
              <span className="text-sm font-bold text-primary-600">{form.playersPerTeam}</span>
            </div>
            <input
              type="range"
              min="3"
              max="11"
              step="1"
              value={form.playersPerTeam}
              onChange={(event) => setForm((prev) => ({ ...prev, playersPerTeam: Number(event.target.value) }))}
              className="w-full accent-primary-600"
            />
          </div>

          <div className="bg-primary-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-primary-700 font-medium">
              {lang === 'he' ? 'סה"כ שחקנים מקסימלי:' : 'Total max players:'}
            </span>
            <span className="text-lg font-bold text-primary-700">{maxPlayers}</span>
          </div>
        </Card>

        <Card>
          {gameType === 'competitive' && (
            <Field label={lang === 'he' ? `דירוג מינימלי: ★ ${Number(form.minRating).toFixed(1)}` : `Min rating: ★ ${Number(form.minRating).toFixed(1)}`}>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={form.minRating}
                onChange={setField('minRating')}
                className="w-full accent-primary-600 mt-1"
              />
            </Field>
          )}
          <Field label={t.create.price}>
            <Input type="number" min="0" value={form.price} onChange={setField('price')} placeholder={t.create.pricePlaceholder} />
          </Field>
        </Card>

        <Card>
          <Field label={t.create.description}>
            <textarea
              value={form.description}
              onChange={setField('description')}
              rows={3}
              placeholder={t.create.descriptionPlaceholder}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </Field>
        </Card>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-2xl text-base transition-colors shadow-md hover:shadow-lg"
        >
          {submitting ? (lang === 'he' ? 'מפרסם משחק...' : 'Publishing game...') : t.create.submit}
        </button>
      </form>
    </main>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
    />
  );
}
