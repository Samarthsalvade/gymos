import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays, isPast } from 'date-fns';
import { CreditCard, AlertCircle, Clock, XCircle, CalendarDays } from 'lucide-react';
import api from '../../api/client';

export default function MemberMembership() {
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['my-memberships'],
    queryFn: () => api.get('/memberships/me').then(r => r.data),
  });

  const active = (memberships as any[]).filter((m: any) => m.status === 'ACTIVE' && !isPast(new Date(m.endDate)));
  const past = (memberships as any[]).filter((m: any) => m.status !== 'ACTIVE' || isPast(new Date(m.endDate)));

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <h1 className="page-title">My Membership</h1>
        <div className="card animate-pulse h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">My Membership</h1>
        <p className="page-subtitle">Your active plans and renewal history</p>
      </div>

      {/* Active memberships */}
      {active.map((m: any) => {
        const daysLeft = differenceInDays(new Date(m.endDate), new Date());
        const totalDays = differenceInDays(new Date(m.endDate), new Date(m.startDate));
        const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));
        const isUrgent = daysLeft <= 7;

        return (
          <div key={m.id} className="card relative overflow-hidden"
            style={{ border: `1.5px solid rgba(var(--accent-rgb),0.2)`, background: 'rgba(var(--accent-rgb),0.04)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
              style={{ background: 'var(--accent)' }} />

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="badge badge-green">Active</span>
                  {isUrgent && <span className="badge badge-red">Expiring Soon!</span>}
                </div>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{m.planName}</p>
              </div>
              <div className="text-right relative z-10">
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>₹{m.price?.toLocaleString('en-IN')}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>via {m.paymentMethod || 'Cash'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-center relative z-10">
              <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <CalendarDays className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{format(new Date(m.startDate), 'dd MMM yy')}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Started</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-black" style={{ color: isUrgent ? '#ff3b30' : daysLeft <= 15 ? '#f59e0b' : 'var(--text-primary)' }}>
                  {daysLeft}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>days left</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <CalendarDays className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{format(new Date(m.endDate), 'dd MMM yy')}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Expires</p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between text-xs mb-1.5 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                <span>Membership used</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: isUrgent ? '#ff3b30' : 'var(--accent)' }} />
              </div>
            </div>

            {isUrgent && (
              <div className="mt-4 flex items-center gap-2 text-sm rounded-xl p-3 relative z-10"
                style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#c0392b' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Contact the gym counter to renew.
              </div>
            )}
          </div>
        );
      })}

      {/* No active membership */}
      {active.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
            <CreditCard className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No Active Membership</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Visit the gym counter to get a plan</p>
        </div>
      )}

      {/* History */}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Membership History</p>
          <div className="space-y-2">
            {past.map((m: any) => (
              <div key={m.id} className="card p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {m.status === 'CANCELLED'
                      ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      : <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />}
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{m.planName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {format(new Date(m.startDate), 'dd MMM yy')} → {format(new Date(m.endDate), 'dd MMM yy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>₹{m.price?.toLocaleString('en-IN')}</p>
                    <span className={`badge ${m.status === 'CANCELLED' ? 'badge-red' : 'badge-gray'} text-[10px]`}>{m.status}</span>
                  </div>
                </div>
                {m.notes && m.notes.includes('Refund') && (
                  <p className="text-xs text-amber-600 mt-2 ml-7">{m.notes.split('|').find((s: string) => s.includes('Refund'))?.trim()}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
