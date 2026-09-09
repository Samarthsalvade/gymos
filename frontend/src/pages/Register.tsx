import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dumbbell, Eye, EyeOff, Loader2, Building2, User } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/auth';
import { useMutation } from '@tanstack/react-query';

interface RegisterForm {
  gymName: string; gymCode: string;
  adminFirstName: string; adminLastName: string; adminEmail: string; adminPassword: string;
}

export default function Register() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();

  const gymCode = watch('gymCode', '');

  const create = useMutation({
    mutationFn: (d: RegisterForm) => api.post('/auth/register-gym', d).then(r => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      toast.success(`Gym "${data.user.gymName}" created!`);
      navigate('/admin');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Registration failed'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f5f5f7' }}>
      <div className="w-full max-w-lg">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Create your gym</h1>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 6, fontSize: '0.9375rem' }}>
            Get started with GymOS in under 2 minutes
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-5">

            {/* Gym details section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
                  <Building2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Gym Details
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Gym Name</label>
                  <input className={`input ${errors.gymName ? 'border-red-400' : ''}`}
                    placeholder="FitZone Premium Gym"
                    {...register('gymName', { required: 'Gym name required' })} />
                  {errors.gymName && <p className="text-red-500 text-xs mt-1">{errors.gymName.message}</p>}
                </div>
                <div>
                  <label className="label">Gym Code</label>
                  <input className={`input font-mono tracking-widest uppercase ${errors.gymCode ? 'border-red-400' : ''}`}
                    placeholder="MYGYM"
                    maxLength={8}
                    {...register('gymCode', {
                      required: 'Gym code required',
                      minLength: { value: 4, message: 'Min 4 characters' },
                      pattern: { value: /^[A-Z0-9]+$/i, message: 'Letters and numbers only' },
                    })} />
                  {errors.gymCode && <p className="text-red-500 text-xs mt-1">{errors.gymCode.message}</p>}
                  {gymCode && !errors.gymCode && (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: 4 }}>
                      Members will login with: <code style={{ color: 'var(--accent)', fontWeight: 700 }}>{gymCode.toUpperCase()}</code>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Admin account section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
                  <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Admin Account
                </h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">First Name</label>
                    <input className="input" placeholder="John"
                      {...register('adminFirstName', { required: true })} />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input className="input" placeholder="Doe"
                      {...register('adminLastName', { required: true })} />
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" placeholder="admin@yourgym.com"
                    {...register('adminEmail', { required: 'Email required' })} />
                  {errors.adminEmail && <p className="text-red-500 text-xs mt-1">{errors.adminEmail.message}</p>}
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input"
                      style={{ paddingRight: 44 }}
                      placeholder="Choose a strong password"
                      {...register('adminPassword', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })} />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                      style={{ color: 'var(--text-tertiary)' }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.adminPassword && <p className="text-red-500 text-xs mt-1">{errors.adminPassword.message}</p>}
                </div>
              </div>
            </div>

            <button type="submit" disabled={create.isPending} className="btn-primary w-full" style={{ height: 48, fontSize: '1rem' }}>
              {create.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating gym...</>
                : 'Create My Gym'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6" style={{ fontSize: '0.9375rem', color: 'var(--text-tertiary)' }}>
          Already have a gym?{' '}
          <Link to="/" className="font-semibold" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
