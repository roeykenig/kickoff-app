import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';

const TEAM_OPTIONS = [2, 3, 4];

export default function CreateLobby() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [submitted, setSubmitted] = useState(false);

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

  const maxPlayers = form.numTeams * form.playersPerTeam;

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.create.successTitle}</h2>
        <p className="text-gray-500 mb-8">{t.create.successMsg}</p>
        <button onClick={() => navigate('/')} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
          {t.create.backToFeed}
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.create.title}</h1>
        <p className="text-gray-500 mt-1">{t.create.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Game name */}
        <Card>
          <Field label={lang === 'he' ? 'שם המשחק / הלובי' : 'Game / Lobby name'}>
            <Input
              placeholder={lang === 'he' ? 'למשל: משחק ערב בגורדון' : 'e.g. Evening game at Gordon'}
              value={form.title} onChange={set('title')} required
            />
          </Field>
        </Card>

        {/* Location */}
        <Card>
          <Field label={t.create.fieldName}>
            <Input placeholder={t.create.fieldNamePlaceholder} value={form.fieldName} onChange={set('fieldName')} required />
          </Field>
          <Field label={t.create.address}>
            <Input placeholder={t.create.addressPlaceholder} value={form.address} onChange={set('address')} required />
          </Field>
          <Field label={t.create.city}>
            <Input placeholder={t.create.cityPlaceholder} value={form.city} onChange={set('city')} required />
          </Field>
        </Card>

        {/* Time */}
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.create.date}>
              <Input type="date" value={form.date} onChange={set('date')} required />
            </Field>
            <Field label={t.create.time}>
              <Input type="time" value={form.time} onChange={set('time')} required />
            </Field>
          </div>
        </Card>

        {/* Teams configuration */}
        <Card>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'he' ? 'מספר קבוצות' : 'Number of teams'}
            </label>
            <div className="flex gap-2">
              {TEAM_OPTIONS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, numTeams: n }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    form.numTeams === n
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {n} {lang === 'he' ? 'קבוצות' : 'teams'}
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
              type="range" min="3" max="11" step="1"
              value={form.playersPerTeam}
              onChange={e => setForm(prev => ({ ...prev, playersPerTeam: parseInt(e.target.value) }))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>3</span><span>11</span>
            </div>
          </div>

          {/* Derived max players */}
          <div className="bg-primary-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-primary-700 font-medium">
              {lang === 'he' ? 'סה"כ שחקנים מקסימלי:' : 'Total max players:'}
            </span>
            <span className="text-lg font-bold text-primary-700">
              {form.numTeams} × {form.playersPerTeam} = <span className="text-primary-600">{maxPlayers}</span>
            </span>
          </div>
        </Card>

        {/* Rating + price */}
        <Card>
          <Field label={lang === 'he' ? `דירוג מינימלי: ★ ${parseFloat(form.minRating).toFixed(1)}` : `Min rating: ★ ${parseFloat(form.minRating).toFixed(1)}`}>
            <input
              type="range" min="1" max="10" step="0.5"
              value={form.minRating}
              onChange={set('minRating')}
              className="w-full accent-primary-600 mt-1"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>{lang === 'he' ? 'ללא הגבלה (1.0)' : 'No limit (1.0)'}</span>
              <span>10.0</span>
            </div>
          </Field>
          <Field label={t.create.price}>
            <Input type="number" min="0" placeholder={t.create.pricePlaceholder} value={form.price} onChange={set('price')} />
          </Field>
        </Card>

        {/* Description */}
        <Card>
          <Field label={t.create.description}>
            <textarea
              placeholder={t.create.descriptionPlaceholder}
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </Field>
        </Card>

        <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl text-base transition-colors shadow-md hover:shadow-lg">
          {t.create.submit}
        </button>
      </form>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>{children}</div>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent" />;
}
