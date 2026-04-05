import { useState, FormEvent, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';

const AVATAR_COLORS = [
  { value: 'bg-blue-500',   label: 'כחול' },
  { value: 'bg-red-500',    label: 'אדום' },
  { value: 'bg-green-600',  label: 'ירוק' },
  { value: 'bg-purple-500', label: 'סגול' },
  { value: 'bg-orange-500', label: 'כתום' },
  { value: 'bg-pink-500',   label: 'ורוד' },
  { value: 'bg-teal-500',   label: 'טורקיז' },
  { value: 'bg-indigo-500', label: 'אינדיגו' },
];

const POSITIONS_HE = ['חלוץ', 'קישור', 'בלם', 'שוער', 'אגף', 'כל עמדה'];
const POSITIONS_EN = ['Striker', 'Midfielder', 'Defender', 'Goalkeeper', 'Winger', 'Any'];

export default function Register() {
  const navigate = useNavigate();
  const { register, currentUser } = useAuth();
  const { lang } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    position: '', bio: '', avatarColor: 'bg-blue-500', photoUrl: '',
  });
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  if (currentUser) {
    navigate('/');
    return null;
  }

  const positions = lang === 'he' ? POSITIONS_HE : POSITIONS_EN;
  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setForm(prev => ({ ...prev, photoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError(lang === 'he' ? 'הסיסמאות אינן תואמות' : 'Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError(lang === 'he' ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : 'Password must be at least 6 characters');
      return;
    }
    register({
      name: form.name,
      email: form.email,
      password: form.password,
      initials: getInitials(form.name),
      avatarColor: form.avatarColor,
      position: form.position || undefined,
      bio: form.bio || undefined,
      photoUrl: form.photoUrl || undefined,
    });
    navigate('/');
  };

  const preview = form.name ? getInitials(form.name) : '?';

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <span className="text-4xl">⚽</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {lang === 'he' ? 'הצטרף ל-KickOff' : 'Join KickOff'}
        </h1>
        <p className="text-gray-500 mt-1">
          {lang === 'he' ? 'צור פרופיל ומצא משחקים קרובים' : 'Create a profile and find nearby games'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo + avatar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {lang === 'he' ? 'תמונת פרופיל' : 'Profile photo'}
          </label>
          <div className="flex items-center gap-4">
            {/* Avatar preview */}
            <div className="relative shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className={`w-16 h-16 rounded-full ${form.avatarColor} flex items-center justify-center text-white text-xl font-bold`}>
                  {preview}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -end-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors"
                title={lang === 'he' ? 'העלה תמונה' : 'Upload photo'}
              >
                <Camera size={13} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1">
              {/* File input (hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary-600 font-medium hover:underline mb-2 block"
              >
                {photoPreview
                  ? (lang === 'he' ? 'החלף תמונה' : 'Change photo')
                  : (lang === 'he' ? 'העלה תמונה מהמכשיר' : 'Upload from device')}
              </button>
              {/* Color picker */}
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => { setForm(prev => ({ ...prev, avatarColor: c.value })); setPhotoPreview(''); setForm(prev => ({ ...prev, avatarColor: c.value, photoUrl: '' })); }}
                    className={`w-6 h-6 rounded-full ${c.value} border-2 transition-all ${
                      form.avatarColor === c.value && !photoPreview ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {lang === 'he' ? 'או בחר צבע' : 'or choose a color'}
              </p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <Field label={lang === 'he' ? 'שם מלא' : 'Full name'}>
            <Input placeholder={lang === 'he' ? 'ישראל ישראלי' : 'John Doe'} value={form.name} onChange={set('name')} required />
          </Field>
          <Field label={lang === 'he' ? 'אימייל' : 'Email'}>
            <Input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </Field>
          <Field label={lang === 'he' ? 'סיסמה' : 'Password'}>
            <Input type="password" placeholder="••••••" value={form.password} onChange={set('password')} required />
          </Field>
          <Field label={lang === 'he' ? 'אימות סיסמה' : 'Confirm password'}>
            <Input type="password" placeholder="••••••" value={form.confirm} onChange={set('confirm')} required />
          </Field>
        </div>

        {/* Football info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <Field label={lang === 'he' ? 'עמדה (אופציונלי)' : 'Position (optional)'}>
            <select
              value={form.position}
              onChange={set('position')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">{lang === 'he' ? '— בחר עמדה —' : '— Select position —'}</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label={lang === 'he' ? 'ביו קצר (אופציונלי)' : 'Short bio (optional)'}>
            <textarea
              rows={2}
              placeholder={lang === 'he' ? 'ספר קצת על עצמך...' : 'Tell us a bit about yourself...'}
              value={form.bio}
              onChange={set('bio')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </Field>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl text-base transition-colors shadow-md">
          {lang === 'he' ? 'צור פרופיל' : 'Create Profile'}
        </button>

        <p className="text-center text-sm text-gray-500">
          {lang === 'he' ? 'כבר יש לך חשבון? ' : 'Already have an account? '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            {lang === 'he' ? 'התחבר' : 'Log in'}
          </Link>
        </p>
      </form>
    </main>
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
