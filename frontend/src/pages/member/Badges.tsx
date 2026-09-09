import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Star, Gift, TrendingUp, Award, Zap } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth';

const BADGE_DEFS = [
  { name: 'First Step', icon: 'https://cdn-icons-png.flaticon.com/512/3793/3793543.png', description: 'Completed your first check-in', color: '#10b981' },
  { name: 'Week Warrior', icon: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png', description: '7-day attendance streak', color: '#f97316' },
  { name: 'Month Master', icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', description: '30-day attendance streak', color: '#6366f1' },
  { name: 'Century Club', icon: 'https://cdn-icons-png.flaticon.com/512/2583/2583319.png', description: '100 total gym visits', color: '#f59e0b' },
  { name: 'Year Legend', icon: 'https://cdn-icons-png.flaticon.com/512/2827/2827920.png', description: '365-day member anniversary', color: '#ec4899' },
  { name: 'Early Bird', icon: 'https://cdn-icons-png.flaticon.com/512/2779/2779775.png', description: 'Checked in before 7am 5 times', color: '#06b6d4' },
];

const LOYALTY_TIERS = [
  { name: 'Bronze', minPoints: 0, color: '#cd7f32', imgSrc: 'https://cdn-icons-png.flaticon.com/512/2583/2583396.png' },
  { name: 'Silver', minPoints: 500, color: '#94a3b8', imgSrc: 'https://cdn-icons-png.flaticon.com/512/2583/2583371.png' },
  { name: 'Gold', minPoints: 1000, color: '#f59e0b', imgSrc: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png' },
  { name: 'Platinum', minPoints: 2000, color: '#8b5cf6', imgSrc: 'https://cdn-icons-png.flaticon.com/512/2583/2583319.png' },
];

export default function Badges() {
  const { user } = useAuthStore();

  const { data: badgeData } = useQuery({
    queryKey: ['badges', user?.id],
    queryFn: () => api.get(`/gym/badges/${user?.id}`).then(r => r.data),
  });

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty'],
    queryFn: () => api.get('/loyalty/me').then(r => r.data),
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['loyalty-leaderboard'],
    queryFn: () => api.get('/loyalty/leaderboard').then(r => r.data),
  });

  const points = loyalty?.points ?? 0;
  const tier = LOYALTY_TIERS.slice().reverse().find(t => points >= t.minPoints) || LOYALTY_TIERS[0];
  const nextTier = LOYALTY_TIERS.find(t => t.minPoints > points);
  const progressToNext = nextTier
    ? Math.round(((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
    : 100;

  const earnedBadges = badgeData?.badges || [];
  const myRank = (leaderboard as any[]).findIndex((l: any) => l.id === user?.id) + 1;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Badges & Loyalty</h1>
        <p className="page-subtitle">Your achievements and reward points</p>
      </div>

      {/* Loyalty tier card */}
      <div className="card relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${tier.color}10, ${tier.color}05)`, border: `1.5px solid ${tier.color}35` }}>
        <div className="absolute right-4 top-4 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: tier.color }} />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Loyalty Tier</p>
            <div className="flex items-center gap-3">
              <img src={tier.imgSrc} alt={tier.name} className="w-10 h-10" />
              <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{tier.name}</span>
            </div>
          </div>
          <div className="text-right relative z-10">
            <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{points.toLocaleString('en-IN')}</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>total points</p>
          </div>
        </div>
        {nextTier && (
          <div className="relative z-10">
            <div className="flex justify-between text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
              <span>{tier.name}</span>
              <span>{nextTier.name} in {(nextTier.minPoints - points).toLocaleString()} pts</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressToNext}%`, background: tier.color }} />
            </div>
          </div>
        )}
        {myRank > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs relative z-10">
            <span style={{ color: 'var(--text-tertiary)' }}>Your rank:</span>
            <span className="font-black" style={{ color: 'var(--text-primary)' }}>#{myRank}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>out of {(leaderboard as any[]).length} members</span>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="card">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-amber-400" /> How to Earn Points
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: 'https://cdn-icons-png.flaticon.com/512/2827/2827920.png', label: 'Daily Check-in', pts: '+10 pts' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/1256/1256650.png', label: 'Refer a Friend', pts: '+200 pts' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png', label: '1-Year Anniversary', pts: '+500 pts' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png', label: '30-Day Streak', pts: '+100 pts' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <img src={r.icon} alt="" className="w-8 h-8 shrink-0" />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{r.label}</p>
                <p className="text-xs font-bold text-amber-500">{r.pts}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Points Leaderboard
        </h3>
        <div className="space-y-2">
          {(leaderboard as any[]).slice(0, 5).map((m: any, i: number) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
              style={m.id === user?.id
                ? { background: 'rgba(var(--accent-rgb),0.08)', border: '1.5px solid rgba(var(--accent-rgb),0.2)' }
                : { background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <div className="w-7 text-center shrink-0">
                {i === 0 ? <img src="https://cdn-icons-png.flaticon.com/512/2583/2583344.png" alt="1st" className="w-6 h-6" />
                  : i === 1 ? <img src="https://cdn-icons-png.flaticon.com/512/2583/2583371.png" alt="2nd" className="w-6 h-6" />
                    : i === 2 ? <img src="https://cdn-icons-png.flaticon.com/512/2583/2583396.png" alt="3rd" className="w-6 h-6" />
                      : <span className="text-sm font-bold" style={{ color: 'var(--text-tertiary)' }}>#{i + 1}</span>}
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                {m.firstName[0]}{m.lastName[0]}
              </div>
              <span className="text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
                {m.firstName} {m.lastName}
                {m.id === user?.id && <span className="text-xs ml-1" style={{ color: 'var(--accent)' }}>(you)</span>}
              </span>
              <span className="font-bold text-sm text-amber-500">{m.loyaltyPoints?.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Earned badges */}
      <div className="card">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-amber-400" /> My Badges ({earnedBadges.length})
        </h3>
        {earnedBadges.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--bg-base)' }}>
              <Zap className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No badges yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Keep checking in to earn your first badge!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {earnedBadges.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
                <div className="text-2xl w-8 h-8 flex items-center justify-center">{b.icon}</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{format(new Date(b.earnedAt), 'dd MMM yyyy')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All possible badges */}
      <div className="card">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <Gift className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> All Badges to Unlock
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {BADGE_DEFS.map(b => {
            const earned = earnedBadges.some((e: any) => e.name === b.name);
            return (
              <div key={b.name} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${earned ? 'opacity-100' : 'opacity-45'}`}
                style={{ background: `${b.color}10`, border: `1px solid ${b.color}30` }}>
                <img src={b.icon} alt={b.name} className="w-8 h-8 shrink-0" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{b.description}</p>
                  {earned && <p className="text-xs mt-0.5 font-semibold text-emerald-600">Earned</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
