import { useQuery } from '@tanstack/react-query';
import { Users, CalendarDays, CreditCard, TrendingUp, AlertTriangle, Zap, ArrowUpRight, Activity, Medal } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { format } from 'date-fns';


const RANK_IMGS = [
  'https://cdn-icons-png.flaticon.com/512/2583/2583344.png', // gold medal
  'https://cdn-icons-png.flaticon.com/512/2583/2583352.png', // silver medal
  'https://cdn-icons-png.flaticon.com/512/2583/2583434.png', // bronze medal
];

function StatCard({ label, value, icon: Icon, gradient, sub, trend, img }: any) {
  return (
    <div className="stat-card overflow-hidden">
      {img && (
        <div className="absolute inset-0 opacity-10">
          <img src={img} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: gradient }}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend !== undefined && (
            <span className={`text-xs font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <ArrowUpRight className={`w-3.5 h-3.5 ${trend < 0 ? 'rotate-90' : ''}`} />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </div>
  );
}

const GREETING_IMGS: Record<string, string> = {
  morning: 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=900&q=80',
  afternoon: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
  evening: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=80',
};

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/gym/dashboard').then(r => r.data) });
  const { data: expiring = [] } = useQuery({ queryKey: ['expiring'], queryFn: () => api.get('/memberships/expiring?days=7').then(r => r.data) });
  const { data: churn = [] } = useQuery({ queryKey: ['churn-risk'], queryFn: () => api.get('/memberships/churn-risk').then(r => r.data) });
  const { data: leaderboard = [] } = useQuery({ queryKey: ['leaderboard'], queryFn: () => api.get('/gym/leaderboard').then(r => r.data) });

  const h = new Date().getHours();
  const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Hero Banner — full background */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 240 }}>
        <img src={GREETING_IMGS[period]} alt="Gym" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.2) 100%)' }} />
        <div className="relative z-10 h-full flex flex-col justify-end p-7">
          <p className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Activity className="w-4 h-4 text-emerald-400" />
            {format(new Date(), 'EEEE, dd MMMM yyyy')} · Live Dashboard
          </p>
          <h1 className="text-4xl font-black text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Good {period},<br />{user?.firstName}
          </h1>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={stats?.totalMembers} icon={Users}
          gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
          sub={`${stats?.activeMembers} active`}
          img="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=60" />
        <StatCard label="Today's Check-ins" value={stats?.todayAttendance} icon={CalendarDays}
          gradient="linear-gradient(135deg, #10b981, #059669)"
          sub={`${stats?.monthlyAttendance} this month`}
          img="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=60" />
        <StatCard label="Active Memberships" value={stats?.activeMemberships} icon={CreditCard}
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          sub={`${stats?.expiringThisWeek} expiring soon`}
          img="https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&q=60" />
        <StatCard label="Total Revenue" value={`₹${stats?.totalRevenue?.toLocaleString('en-IN') || 0}`} icon={TrendingUp}
          gradient="linear-gradient(135deg, #ec4899, #db2777)"
          img="https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=400&q=60" />
      </div>

      {/* Three-column cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Expiring memberships */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Expiring This Week</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Memberships ending in 7 days</p>
            </div>
            {expiring.length > 0 && <span className="badge badge-yellow">{expiring.length}</span>}
          </div>
          {expiring.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="" className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All memberships are current</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expiring.slice(0, 5).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
                  <div className="flex items-center gap-2.5">
                    {m.user.photoUrl ? (
                      <img src={m.user.photoUrl} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        {m.user.firstName[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.user.firstName} {m.user.lastName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.planName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-500 text-xs font-bold">{format(new Date(m.endDate), 'dd MMM')}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>₹{m.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Churn risk */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Churn Risk</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No visit in 14+ days</p>
            </div>
            {churn.length > 0 && <span className="badge badge-red">{churn.length}</span>}
          </div>
          {churn.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="" className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All members are engaged</p>
            </div>
          ) : (
            <div className="space-y-2">
              {churn.slice(0, 5).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                  <div className="flex items-center gap-2.5">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                        {m.firstName[0]}
                      </div>
                    )}
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.firstName} {m.lastName}</p>
                  </div>
                  <span className="badge badge-red text-xs">No visit</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Top Members</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Most check-ins this month</p>
            </div>
          </div>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry: any, i: number) => (
              <div key={entry.rank} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ background: i === 0 ? 'rgba(245,158,11,0.08)' : 'var(--bg-card-hover)', border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.15)' : 'transparent'}` }}>
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  {entry.rank <= 3 ? (
                    <img src={RANK_IMGS[entry.rank - 1]} alt={`rank ${entry.rank}`} className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{entry.rank}</span>
                  )}
                </div>
                <span className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                  {entry.user?.firstName} {entry.user?.lastName}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent-light)' }}>
                  {entry.checkIns} visits
                </span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-center py-6">
                <Medal className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet this month</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Check-ins', value: stats?.monthlyAttendance ?? '—', color: 'text-blue-500', img: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=300&q=60' },
          { label: 'Equipment Items', value: stats?.equipmentCount ?? '—', color: 'text-purple-500', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=60' },
          { label: 'Expiring Soon', value: stats?.expiringThisWeek ?? '—', color: 'text-amber-500', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=60' },
          { label: 'Churn Risk', value: churn?.length ?? '—', color: 'text-red-500', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=60' },
        ].map((s, i) => (
          <div key={i} className="stat-card relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <img src={s.img} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10 text-center">
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
