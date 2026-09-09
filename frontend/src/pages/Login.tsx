import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Dumbbell, Eye, EyeOff, Loader2, ChevronRight, ArrowLeft, Lock } from 'lucide-react';
import axios from 'axios';
import api from '../api/client';
import { useAuthStore } from '../store/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface GymInfo { name: string; logo: string | null; coverImage: string | null; accentColor: string; gymCode: string; }
interface LoginForm { email: string; password: string; }

export default function Login() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showPass, setShowPass] = useState(false);
  const [gymCode, setGymCode] = useState('');
  const [gymInfo, setGymInfo] = useState<GymInfo | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [rememberGym, setRememberGym] = useState(true);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  useEffect(() => {
    const saved = localStorage.getItem('gymos_gym_code');
    if (saved) setGymCode(saved);
  }, []);

  useEffect(() => {
    if (gymInfo?.accentColor) {
      document.documentElement.style.setProperty('--accent', gymInfo.accentColor);
    }
  }, [gymInfo]);

  const handleGymLookup = async () => {
    if (!gymCode.trim()) return;
    setLookingUp(true);
    try {
      const res = await axios.get(`${API}/gym/lookup/${gymCode.trim().toUpperCase()}`);
      setGymInfo(res.data);
      if (rememberGym) localStorage.setItem('gymos_gym_code', gymCode.trim().toUpperCase());
    } catch {
      toast.error('Gym code not found. Please check and try again.');
    } finally { setLookingUp(false); }
  };

  const login = useMutation({
    mutationFn: (d: LoginForm) => api.post('/auth/login', { ...d, gymCode: gymCode.toUpperCase() }).then(r => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      if (data.user.accentColor) document.documentElement.style.setProperty('--accent', data.user.accentColor);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      navigate(data.user.role === 'MEMBER' ? '/member' : '/admin');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Invalid credentials';
      toast.error(msg, { duration: err.response?.status === 429 ? 6000 : 3000 });
    },
  });

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f5f7' }}>
      {/* Left panel — desktop only, only when no gym selected */}
      {!gymInfo && (
        <div className="hidden lg:flex flex-col justify-between w-5/12 p-14 relative overflow-hidden"
          style={{ background: '#1d1d1f' }}>
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80"
              alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'var(--accent)' }}>
                <Dumbbell className="w-5 h-5" />
              </div>
              <span className="text-white text-xl font-bold tracking-tight">GymOS</span>
            </div>
            <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
              Your gym,<br />elevated.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: 1.7 }}>
              Complete gym management — members, attendance, AI workouts, loyalty rewards, and real-time insights.
            </p>
          </div>
          <div className="relative z-10">
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8125rem' }}>
              Demo: <code style={{ color: 'rgba(255,255,255,0.5)' }}>DEMO01</code> · admin@fitzone.com · admin123
            </p>
          </div>
        </div>
      )}

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* STEP 1 */}
          {!gymInfo ? (
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: 'var(--accent)' }}>
                  <Dumbbell className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>GymOS</span>
              </div>

              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>
                Enter gym code
              </h1>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', marginBottom: '2rem' }}>
                Get your gym code from your gym owner or manager
              </p>

              <div className="space-y-4">
                <div>
                  <label className="label">{t('login.gymCode')}</label>
                  <input
                    className="input text-center font-black uppercase"
                    style={{ fontSize: '1.5rem', letterSpacing: '0.2em', height: 64 }}
                    placeholder="DEMO01"
                    value={gymCode}
                    maxLength={10}
                    onChange={e => setGymCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleGymLookup()}
                    autoFocus
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0"
                    style={{ borderColor: rememberGym ? 'var(--accent)' : 'var(--border-medium)', background: rememberGym ? 'var(--accent)' : 'transparent' }}
                    onClick={() => setRememberGym(r => !r)}>
                    {rememberGym && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>{t('login.rememberGym')}</span>
                </label>

                <button onClick={handleGymLookup} disabled={!gymCode || lookingUp}
                  className="btn-primary w-full gap-2"
                  style={{ height: 48, fontSize: '1rem' }}>
                  {lookingUp ? <><Loader2 className="w-5 h-5 animate-spin" /> Looking up...</> : <>{t('login.continue')} <ChevronRight className="w-5 h-5" /></>}
                </button>
              </div>

              <p className="text-center mt-8" style={{ fontSize: '0.9375rem', color: 'var(--text-tertiary)' }}>
                {t('login.noGym')}{' '}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                  {t('login.registerGym')}
                </Link>
              </p>
            </div>

          ) : (
            /* STEP 2 */
            <div>
              {gymInfo.coverImage && (
                <div className="relative h-44 rounded-2xl overflow-hidden mb-6"
                  style={{ boxShadow: 'var(--shadow-md)' }}>
                  <img src={gymInfo.coverImage} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%)' }} />
                  {gymInfo.logo && (
                    <img src={gymInfo.logo} alt="Logo"
                      className="absolute bottom-4 left-4 w-12 h-12 rounded-xl object-cover border-2 border-white"
                      style={{ boxShadow: 'var(--shadow-md)' }} />
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 mb-2">
                {!gymInfo.coverImage && gymInfo.logo && (
                  <img src={gymInfo.logo} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
                )}
                {!gymInfo.coverImage && !gymInfo.logo && (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    <Dumbbell className="w-5 h-5" />
                  </div>
                )}
                <button onClick={() => setGymInfo(null)}
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: 'var(--text-tertiary)' }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> {t('login.back')}
                </button>
              </div>

              <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 }}>
                {gymInfo.name}
              </h1>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', marginBottom: '2rem' }}>
                Sign in to your account
              </p>

              <form onSubmit={handleSubmit(d => login.mutate(d))} className="space-y-4">
                <div>
                  <label className="label">{t('login.email')}</label>
                  <input type="email"
                    className="input"
                    style={{ height: 48, fontSize: '1rem', borderColor: errors.email ? '#ff3b30' : undefined }}
                    placeholder="you@example.com"
                    {...register('email', { required: 'Email required' })} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="label">{t('login.password')}</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'}
                      className="input"
                      style={{ height: 48, fontSize: '1rem', paddingRight: 48, borderColor: errors.password ? '#ff3b30' : undefined }}
                      placeholder="••••••••"
                      {...register('password', { required: 'Password required' })} />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1"
                      style={{ color: 'var(--text-tertiary)' }}>
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={login.isPending}
                  className="btn-primary w-full gap-2"
                  style={{ height: 48, fontSize: '1rem', marginTop: 8 }}>
                  {login.isPending
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
                    : <><Lock className="w-4 h-4" /> {t('login.signIn')}</>}
                </button>
              </form>

              <p className="text-center mt-8" style={{ fontSize: '0.9375rem', color: 'var(--text-tertiary)' }}>
                New gym?{' '}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                  Register here
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
