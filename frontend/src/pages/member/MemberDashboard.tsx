import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import api from '../../api/client';
import { Flame, Calendar, Trophy, CheckCircle, Bell, Zap, CreditCard, ChevronRight, ArrowRight } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';

export default function MemberDashboard() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const enabledModules: string[] = (user as any)?.enabledModules || [];
  const hasModule = (mod: string) => enabledModules.length === 0 || enabledModules.includes(mod);

  const { data: stats } = useQuery({ queryKey: ['my-stats'], queryFn: () => api.get(`/members/${user?.id}/stats`).then(r => r.data) });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) });
  const { data: notifs = [] } = useQuery({ queryKey: ['notifications'], queryFn: () => api.get('/gym/notifications').then(r => r.data) });
  const { data: memberships = [] } = useQuery({ queryKey: ['my-memberships'], queryFn: () => api.get('/memberships/me').then(r => r.data) });

  const unreadNotifs = (notifs as any[]).filter((n: any) => !n.isRead).slice(0, 3);
  const activeMembership = (memberships as any[]).find((m: any) => m.status === 'ACTIVE' && !isPast(new Date(m.endDate)));
  const daysLeft = activeMembership ? differenceInDays(new Date(activeMembership.endDate), new Date()) : 0;
  const totalDays = activeMembership ? differenceInDays(new Date(activeMembership.endDate), new Date(activeMembership.startDate)) : 0;
  const pct = totalDays > 0 ? Math.min(100, ((totalDays - daysLeft) / totalDays) * 100) : 0;

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const kpis = [
    { label: 'Check-ins', value: stats?.totalCheckIns ?? 0, icon: CheckCircle, color: '#0071e3', bg: '#dbeafe' },
    { label: 'This Week', value: stats?.checkInsThisWeek ?? 0, icon: Calendar, color: '#34d399', bg: '#d1fae5' },
    { label: 'Best Streak', value: stats?.longestStreak ?? 0, icon: Trophy, color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Badges', value: stats?.badges?.length ?? 0, icon: Trophy, color: '#8b5cf6', bg: '#ede9fe' },
  ];

  return (
    <div className="max-w-3xl space-y-6">

      {/* Greeting row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{greeting}, {user?.firstName}</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, dd MMMM')} · {user?.gymName}</p>
        </div>
        {hasModule('checkin') && (
          <Link to="/member/checkin" className="btn-primary shrink-0 gap-2">
            <Zap className="w-4 h-4" /> {t('attendance.checkIn')}
          </Link>
        )}
      </div>

      {/* Streak banner */}
      {(stats?.currentStreak ?? 0) > 1 && (
        <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(249,115,22,0.2)' }}>
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=70" alt="" className="w-full h-full object-cover opacity-15" />
          </div>
          <div className="relative flex items-center gap-4 px-5 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.15)' }}>
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-600">Active Streak</p>
              <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                {stats.currentStreak} <span className="text-base font-normal" style={{ color: 'var(--text-tertiary)' }}>days in a row</span>
              </p>
            </div>
            {stats.currentStreak >= 7 && (
              <div className="ml-auto text-right">
                <img src="https://cdn-icons-png.flaticon.com/512/2583/2583344.png" alt="streak" className="w-10 h-10 ml-auto" />
                <p className="text-xs font-bold text-amber-600 mt-1">{stats.currentStreak >= 30 ? 'Elite' : '7-Day Goal!'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="card p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
              <k.icon className="w-5 h-5" style={{ color: k.color }} />
            </div>
            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{k.value}</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Membership progress */}
      {activeMembership ? (
        <Link to="/member/membership" className="card block hover:shadow-md transition-shadow"
          style={{ border: '1px solid rgba(var(--accent-rgb),0.15)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Active Membership</span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="flex items-end justify-between mt-3 mb-4">
            <div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeMembership.planName}</p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Expires {format(new Date(activeMembership.endDate), 'dd MMM yyyy')}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black" style={{ color: daysLeft <= 7 ? '#ff3b30' : daysLeft <= 14 ? '#f59e0b' : 'var(--text-primary)' }}>
                {daysLeft}
              </span>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>days left</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: daysLeft <= 7 ? '#ff3b30' : 'var(--accent)' }} />
          </div>
        </Link>
      ) : (
        <div className="card flex items-center gap-4 py-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#f3f4f6' }}>
            <CreditCard className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No active membership</p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Visit the gym counter to get a plan</p>
          </div>
        </div>
      )}

      {/* Quick actions — only show modules that are enabled */}
      {(() => {
        const actions = [
          { mod: 'workout', to: '/member/workout', label: 'My Workout Plan', sub: 'AI-personalised for you', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=70' },
          { mod: 'progress', to: '/member/progress', label: 'Track Progress', sub: 'Log and visualise gains', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=70' },
          { mod: 'badges', to: '/member/badges', label: 'Badges & Loyalty', sub: 'Earn rewards & rank up', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&q=70' },
          { mod: 'events', to: '/member/events', label: 'Events & Classes', sub: 'See what\'s happening', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=70' },
        ].filter(a => hasModule(a.mod));
        if (actions.length === 0) return null;
        return (
          <div className={`grid gap-3 ${actions.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {actions.map(a => (
              <Link key={a.to} to={a.to}
                className="relative rounded-2xl overflow-hidden group"
                style={{ minHeight: 110, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <img src={a.img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 flex flex-col justify-end p-4"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 100%)' }}>
                  <p className="text-white font-bold text-sm leading-tight">{a.label}</p>
                  <p className="text-white/60 text-xs mt-0.5">{a.sub}</p>
                </div>
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </Link>
            ))}
          </div>
        );
      })()}

      {/* Notifications + Events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-2"><Bell className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Notifications</h3>
            {unreadNotifs.length > 0 && <span className="badge badge-blue">{unreadNotifs.length} new</span>}
          </div>
          {unreadNotifs.length === 0 ? (
            <div className="flex flex-col items-center py-5 gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#d1fae5' }}>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>All caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unreadNotifs.map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-base)' }}>
                  <div className="w-1.5 h-1.5 mt-2 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="section-title flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Upcoming Events
          </h3>
          {(events as any[]).length === 0 ? (
            <div className="flex flex-col items-center py-5 gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#f3f4f6' }}>
                <Calendar className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(events as any[]).slice(0, 3).map((e: any) => (
                <div key={e.id} className="p-3 rounded-xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{e.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{format(new Date(e.eventDate), 'dd MMM · hh:mm a')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
