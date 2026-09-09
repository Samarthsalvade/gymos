import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, QrCode, Clock, Calendar, Loader2, LogOut, Lock, Shield, Flame, Trophy, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isToday } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { useI18n } from '../../i18n/context';

export default function CheckIn() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);

  const selfCheckInEnabled = user?.selfCheckInEnabled ?? false;

  const { data: attendance = [], refetch } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => api.get('/attendance/me').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => api.get(`/members/${user?.id}/stats`).then(r => r.data),
  });

  const todayRecord = (attendance as any[]).find((a: any) => isToday(new Date(a.checkInTime)));
  const recent = (attendance as any[]).slice(0, 12);

  const checkIn = useMutation({
    mutationFn: () => api.post('/attendance/checkin', {}),
    onMutate: () => setChecking(true),
    onSuccess: () => {
      refetch();
      qc.invalidateQueries({ queryKey: ['my-stats'] });
      toast.success('Checked in! Keep it up!');
      setChecking(false);
    },
    onError: (err: any) => {
      setChecking(false);
      if (err.response?.status === 409) toast('Already checked in today!', { icon: '✅' });
      else toast.error(err.response?.data?.error || 'Check-in failed');
    },
  });

  const checkOut = useMutation({
    mutationFn: () => api.post('/attendance/checkout', {}),
    onSuccess: () => { refetch(); toast.success('Checked out! See you next time'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'No active check-in'),
  });

  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const hasCheckin = (attendance as any[]).some((a: any) => new Date(a.checkInTime).toDateString() === d.toDateString());
    return { date: d, hasCheckin, isToday: isToday(d) };
  });

  const statCards = [
    { label: 'Current Streak', value: stats?.currentStreak || 0, unit: 'days', Icon: Flame, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    { label: 'Total Visits', value: stats?.totalCheckIns || 0, unit: 'visits', Icon: MapPin, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Best Streak', value: stats?.longestStreak || 0, unit: 'days', Icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="page-title">{t('nav.checkin')}</h1>
        <p className="page-subtitle">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="card text-center p-4">
            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: s.bg }}>
              <s.Icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* QR / Checked In state */}
      {todayRecord ? (
        <div className="card" style={{ border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.05)' }}>
          <div className="relative rounded-xl overflow-hidden mb-5" style={{ height: 120 }}>
            <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80" alt="Gym" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.5)' }}>
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('attendance.checkedIn')}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Since {format(new Date(todayRecord.checkInTime), 'hh:mm a')}
            </p>
            {!todayRecord.checkOutTime && (
              <button className="btn-secondary mt-4 gap-2" onClick={() => checkOut.mutate()} disabled={checkOut.isPending}>
                <LogOut className="w-4 h-4" /> Check Out
              </button>
            )}
            {todayRecord.checkOutTime && (
              <p className="text-sm mt-3" style={{ color: 'var(--text-tertiary)' }}>
                Checked out at {format(new Date(todayRecord.checkOutTime), 'hh:mm a')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          {/* Hero */}
          <div className="relative rounded-xl overflow-hidden mb-5" style={{ height: 130 }}>
            <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" alt="Gym entrance" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <p className="text-white font-bold text-lg">{t('attendance.showQR')}</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Show this at the entrance counter</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-5">
            <div className="p-4 rounded-2xl" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: '1px solid var(--border)' }}>
              {user?.qrCode ? (
                <img src={user.qrCode} alt="My QR" className="w-44 h-44" />
              ) : (
                <QRCodeSVG value={JSON.stringify({ userId: user?.id, gymId: user?.gymId })} size={176} level="M" bgColor="#ffffff" fgColor="#111827" />
              )}
            </div>
          </div>

          {/* Self check-in */}
          {selfCheckInEnabled ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>or self check-in</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <button className="btn-primary w-full gap-2" style={{ height: 52, fontSize: '1rem' }} onClick={() => checkIn.mutate()} disabled={checking}>
                {checking
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Checking in...</>
                  : <><QrCode className="w-5 h-5" /> {t('attendance.selfCheckIn')}</>}
              </button>
              <p className="text-xs text-center mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Tap to mark your attendance without scanning
              </p>
            </div>
          ) : (
            <div className="rounded-xl px-4 py-3.5 flex items-start gap-3"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#92400e' }}>Self check-in not available</p>
                <p className="text-xs mt-0.5" style={{ color: '#a16207' }}>Show your QR at the front desk. Contact your gym admin to enable self check-in.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Your QR code is unique and refreshes automatically for security</span>
      </div>

      {/* 30-day calendar heatmap */}
      <div className="card">
        <h3 className="section-title mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Last 30 Days
        </h3>
        <div className="grid grid-cols-10 gap-1.5">
          {calendarDays.map((d, i) => (
            <div key={i} title={format(d.date, 'dd MMM')}
              className="aspect-square rounded-md transition-all"
              style={{
                background: d.hasCheckin
                  ? `rgba(var(--accent-rgb), ${d.isToday ? 1 : 0.7})`
                  : d.isToday ? 'rgba(var(--accent-rgb),0.15)' : 'var(--bg-base)',
                border: d.isToday ? '1.5px solid rgba(var(--accent-rgb),0.5)' : '1px solid var(--border)',
              }} />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No visit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(var(--accent-rgb),0.7)' }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Checked in</span>
          </div>
        </div>
      </div>

      {/* Recent visits */}
      <div className="card">
        <h3 className="section-title mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Recent Visits
        </h3>
        <div>
          {recent.map((a: any, i: number) => (
            <div key={a.id} className="flex items-center justify-between py-3"
              style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: isToday(new Date(a.checkInTime)) ? 'rgba(var(--accent-rgb),0.1)' : 'var(--bg-base)',
                    color: isToday(new Date(a.checkInTime)) ? 'var(--accent)' : 'var(--text-secondary)',
                  }}>
                  {format(new Date(a.checkInTime), 'dd')}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {format(new Date(a.checkInTime), 'EEEE')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {format(new Date(a.checkInTime), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {format(new Date(a.checkInTime), 'hh:mm a')}
                </p>
                {a.checkOutTime && (
                  <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    out {format(new Date(a.checkOutTime), 'hh:mm a')}
                  </p>
                )}
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="py-10 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                <CheckCircle className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No visits yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Check in today to start your streak!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
