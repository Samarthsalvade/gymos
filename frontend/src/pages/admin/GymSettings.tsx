import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { useEffect, useRef, useState } from 'react';
import { Upload, Dumbbell, Copy, Check, Key, Image } from 'lucide-react';
import { useI18n } from '../../i18n/context';

interface SettingsForm {
  name: string; accentColor: string; address: string; phone: string; email: string;
  logo: string; coverImage: string; description: string; website: string;
  selfCheckInDefault: boolean; defaultModules: string[];
}

const ACCENT_PRESETS = [
  { label: 'Indigo', value: '#6366f1' }, { label: 'Blue', value: '#3b82f6' },
  { label: 'Violet', value: '#8b5cf6' }, { label: 'Rose', value: '#f43f5e' },
  { label: 'Emerald', value: '#10b981' }, { label: 'Amber', value: '#f59e0b' },
  { label: 'Cyan', value: '#06b6d4' }, { label: 'Orange', value: '#f97316' },
];

const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard', always: true },
  { key: 'workout', label: 'Workout Plan' },
  { key: 'checkin', label: 'Check In / QR' },
  { key: 'progress', label: 'Progress Tracker' },
  { key: 'badges', label: 'Badges & Loyalty' },
  { key: 'membership', label: 'My Membership' },
  { key: 'events', label: 'Events & Classes' },
];

export default function GymSettings() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const { user, setAuth, tokens } = useAuthStore();
  const { register, handleSubmit, reset, watch, setValue } = useForm<SettingsForm>({
    defaultValues: { defaultModules: ['dashboard','workout','checkin','progress','badges','membership','events'] },
  });
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const logoPreview = watch('logo');
  const coverPreview = watch('coverImage');
  const selfCheckInDefault = watch('selfCheckInDefault');
  const defaultModules: string[] = watch('defaultModules') || [];

  const { data: gym } = useQuery({
    queryKey: ['gym-settings'],
    queryFn: () => api.get('/gym/settings').then(r => r.data),
  });

  useEffect(() => {
    if (gym) {
      reset({
        ...gym,
        defaultModules: gym.defaultModules
          ? (typeof gym.defaultModules === 'string' ? JSON.parse(gym.defaultModules) : gym.defaultModules)
          : ['dashboard','workout','checkin','progress','badges','membership','events'],
      });
    }
  }, [gym, reset]);

  const update = useMutation({
    mutationFn: (d: SettingsForm) => api.put('/gym/settings', d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['gym-settings'] });
      document.documentElement.style.setProperty('--accent', res.data.accentColor);
      if (user && tokens) {
        setAuth({ ...user, accentColor: res.data.accentColor, gymName: res.data.name, gymLogo: res.data.logo }, tokens);
      }
      toast.success('Settings saved!');
    },
    onError: () => toast.error('Failed to save'),
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast.error('Logo must be under 500KB'); return; }
    const reader = new FileReader();
    reader.onload = () => setValue('logo', reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Cover image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setValue('coverImage', reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleModule = (key: string) => {
    if (key === 'dashboard') return;
    const mods = defaultModules.includes(key)
      ? defaultModules.filter(m => m !== key)
      : [...defaultModules, key];
    setValue('defaultModules', mods);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(user?.gymCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Gym code copied!');
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">{t('settings.title')}</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', marginTop: 4 }}>Customize your gym's branding and member experience</p>
      </div>

      {/* Gym Code Card */}
      <div className="card" style={{ background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="label">Your Gym Code</p>
            <p className="text-4xl font-black tracking-widest gradient-text">{user?.gymCode}</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Share this with members so they can log in</p>
          </div>
          <button onClick={copyCode} className="btn-secondary gap-2">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => update.mutate(d))} className="space-y-5">
        {/* Logo + Cover */}
        <div className="card">
          <h3 className="section-title mb-4">{t('settings.branding')}</h3>
          <div className="space-y-5">
            {/* Logo */}
            <div>
              <label className="label">{t('settings.logo')}</label>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--border-medium)] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--border-strong)] transition-colors"
                  onClick={() => fileRef.current?.click()}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Dumbbell className="w-8 h-8" style={{ color: "var(--text-tertiary)" }} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-2" style={{ color: "var(--text-tertiary)" }}>Displayed in sidebar and member portal. Max 500KB.</p>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                    {logoPreview && <button type="button" className="btn-ghost btn-sm text-red-400" onClick={() => setValue('logo', '')}>Remove</button>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <input className="input mt-2 text-sm" placeholder="Or paste logo URL" {...register('logo')} />
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <label className="label">{t('settings.coverImage')}</label>
              <p className="text-sm mb-3" style={{ color: "var(--text-tertiary)" }}>Displayed on the login page for members. Recommended: 1200×400px, max 2MB.</p>
              {coverPreview ? (
                <div className="relative rounded-xl overflow-hidden mb-3" style={{ height: 140 }}>
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <button type="button"
                    className="absolute top-2 right-2 btn-secondary btn-sm text-red-400"
                    onClick={() => setValue('coverImage', '')}>Remove</button>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center h-28 mb-3 cursor-pointer hover:border-[var(--border-medium)] transition-colors"
                  onClick={() => coverRef.current?.click()}>
                  <Image className="w-6 h-6 mb-1" style={{ color: "var(--text-tertiary)" }} />
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Click to upload cover image</p>
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" className="btn-secondary btn-sm" onClick={() => coverRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5" /> Upload Cover
                </button>
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              <input className="input mt-2 text-sm" placeholder="Or paste cover image URL" {...register('coverImage')} />
            </div>
          </div>
        </div>

        {/* Gym Info */}
        <div className="card">
          <h3 className="section-title mb-4">Gym Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label">{t('settings.gymName')}</label>
              <input className="input text-base" placeholder="FitZone Gym" {...register('name', { required: true })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input h-20 resize-none text-sm" placeholder="Brief description of your gym..." {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Website</label>
                <input className="input text-sm" placeholder="https://yourgym.com" {...register('website')} />
              </div>
              <div>
                <label className="label">Address</label>
                <input className="input text-sm" placeholder="123 Fitness Street" {...register('address')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input className="input text-sm" placeholder="+91 98765 43210" {...register('phone')} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input text-sm" placeholder="gym@email.com" {...register('email')} />
              </div>
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div className="card">
          <h3 className="section-title mb-4">{t('settings.accentColor')}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {ACCENT_PRESETS.map(p => (
              <button key={p.value} type="button" title={p.label}
                onClick={() => { setValue('accentColor', p.value); document.documentElement.style.setProperty('--accent', p.value); }}
                className="w-9 h-9 rounded-xl border-2 transition-all duration-150 hover:scale-110"
                style={{ background: p.value, borderColor: watch('accentColor') === p.value ? 'white' : 'transparent' }} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="color" className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-[var(--border)] p-0.5"
              value={watch('accentColor') || '#6366f1'} onChange={e => { setValue('accentColor', e.target.value); document.documentElement.style.setProperty('--accent', e.target.value); }} />
            <input className="input text-sm" placeholder="#6366f1" {...register('accentColor')} />
          </div>
        </div>

        {/* Member Access Defaults */}
        <div className="card">
          <h3 className="section-title mb-1">Member Access Defaults</h3>
          <p className="text-sm mb-5" style={{ color: "var(--text-tertiary)" }}>These apply to newly registered members. Existing member settings override these.</p>

          {/* Self check-in default */}
          <div className="flex items-center justify-between p-4 rounded-xl mb-4"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
            <div>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{t('settings.selfCheckInDefault')}</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', marginTop: 4 }}>New members can self check-in from their device</p>
            </div>
            <button type="button"
              onClick={() => setValue('selfCheckInDefault', !selfCheckInDefault)}
              className={`relative w-12 h-6 rounded-full transition-all duration-200 ${selfCheckInDefault ? '' : 'bg-[var(--bg-hover)]'}`}
              style={selfCheckInDefault ? { background: 'var(--accent)' } : {}}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${selfCheckInDefault ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Default modules */}
          <div>
            <label className="label">{t('settings.defaultModules')}</label>
            <div className="space-y-2">
              {ALL_MODULES.map(m => {
                const enabled = defaultModules.includes(m.key);
                return (
                  <div key={m.key}
                    onClick={() => toggleModule(m.key)}
                    className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${m.always ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--bg-hover)]'}`}
                    style={{ background: enabled ? 'rgba(var(--accent-rgb),0.07)' : 'var(--bg-base)', border: `1px solid ${enabled ? 'rgba(var(--accent-rgb),0.18)' : 'var(--border)'}` }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{m.label}</p>
                      {m.always && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Always enabled</p>}
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${enabled ? 'border-transparent' : 'border-[var(--border-medium)]'}`}
                      style={enabled ? { background: 'var(--accent)' } : {}}>
                      {enabled && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={update.isPending}>
          {update.isPending ? 'Saving...' : t('settings.saveAll')}
        </button>
      </form>

      {/* AI Config — info only, no key input */}
      <div className="card" style={{ border: '1px solid rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.05)' }}>
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="section-title">AI Features (Groq) — Active</h3>
            <p className="text-gray-500 text-sm mt-1">
              AI workout plans, progress summaries, and owner insights are enabled via your Groq API key in{' '}
              <code className="text-purple-400 bg-purple-900/20 px-1 py-0.5 rounded text-xs">backend/.env</code>.
            </p>
            <a href="https://console.groq.com" target="_blank" rel="noopener"
              className="text-purple-400 text-sm hover:underline mt-1 inline-block">
              Manage key at console.groq.com →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
