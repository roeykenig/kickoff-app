import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import { SkillLevel } from '../types';

const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'mixed'];

export default function CreateLobby() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    fieldName: '',
    address: '',
    city: '',
    date: '',
    time: '',
    maxPlayers: '10',
    skillLevel: 'intermediate' as SkillLevel,
    price: '',
    description: '',
  });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [key]: e.target.value }));

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
        <button
          onClick={() => navigate('/')}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
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
        <Card>
          <Field label={t.create.fieldName}>
            <Input
              placeholder={t.create.fieldNamePlaceholder}
              value={form.fieldName}
              onChange={set('fieldName')}
              required
            />
          </Field>
          <Field label={t.create.address}>
            <Input
              placeholder={t.create.addressPlaceholder}
              value={form.address}
              onChange={set('address')}
              required
            />
          </Field>
          <Field label={t.create.city}>
            <Input
              placeholder={t.create.cityPlaceholder}
              value={form.city}
              onChange={set('city')}
              required
            />
          </Field>
        </Card>

        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.create.date}>
              <Input
                type="date"
                value={form.date}
                onChange={set('date')}
                required
              />
            </Field>
            <Field label={t.create.time}>
              <Input
                type="time"
                value={form.time}
                onChange={set('time')}
                required
              />
            </Field>
          </div>
          <Field label={t.create.maxPlayers}>
            <Input
              type="number"
              min="4"
              max="22"
              value={form.maxPlayers}
              onChange={set('maxPlayers')}
              required
            />
          </Field>
        </Card>

        <Card>
          <Field label={t.create.skillLevel}>
            <select
              value={form.skillLevel}
              onChange={set('skillLevel')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            >
              {SKILL_LEVELS.map(lvl => (
                <option key={lvl} value={lvl}>{t.skillLevel[lvl]}</option>
              ))}
            </select>
          </Field>
          <Field label={t.create.price}>
            <Input
              type="number"
              min="0"
              placeholder={t.create.pricePlaceholder}
              value={form.price}
              onChange={set('price')}
            />
          </Field>
        </Card>

        <Card>
          <Field label={t.create.description}>
            <textarea
              placeholder={t.create.descriptionPlaceholder}
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />
          </Field>
        </Card>

        <button
          type="submit"
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl text-base transition-colors shadow-md hover:shadow-lg"
        >
          {t.create.submit}
        </button>
      </form>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
    />
  );
}
