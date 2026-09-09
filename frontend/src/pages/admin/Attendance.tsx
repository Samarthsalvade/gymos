import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, Clock, AlertCircle, UserX, Camera } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../api/client';
import { format } from 'date-fns';
import QRScanner from '../../components/QRScanner';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-sm" style={{ background: '#1a1b23', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className=" text-xs">{label}</p>
        <p className="font-bold text-white">{payload[0].value} check-ins</p>
      </div>
    );
  }
  return null;
};

export default function Attendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showScanner, setShowScanner] = useState(false);
  const qc = useQueryClient();

  const { data: records = [] } = useQuery({
    queryKey: ['attendance', date],
    queryFn: () => api.get(`/attendance?date=${date}`).then(r => r.data),
  });
  const { data: summary } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: () => api.get('/attendance/summary').then(r => r.data),
  });

  const hours = Object.entries(summary?.hourDistribution || {})
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([h, count]) => ({ hour: `${h}:00`, count: Number(count) }));

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className=" text-sm mt-0.5">Track daily check-ins and peak hour trends</p>
        </div>
        <button className="btn-primary" onClick={() => setShowScanner(true)}>
          <Camera className="w-4 h-4" /> Scan QR Code
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: summary?.todayCount ?? 0, icon: Clock, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'This Week', value: summary?.weekCount ?? 0, icon: Calendar, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'This Month', value: summary?.monthCount ?? 0, icon: Users, color: 'var(--accent)', bg: 'rgba(var(--accent-rgb),0.1)' },
          { label: 'No-shows (7d)', value: summary?.noShowMembers?.length ?? 0, icon: UserX, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="page-title">{s.value}</p>
              <p className="text-xs ">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Peak hours chart */}
      {hours.length > 0 && (
        <div className="card">
          <h3 className="font-semibold  mb-4 text-sm">Peak Hours Distribution (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hours} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-base)" />
              <XAxis dataKey="hour" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="url(#barGrad2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* No-show members */}
      {summary?.noShowMembers?.length > 0 && (
        <div className="card" style={{ border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h3 className="font-semibold  text-sm">Members Not Seen in 7+ Days</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.noShowMembers.map((m: any) => (
              <div key={m.id} className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center  text-[10px] font-bold"
                  style={{ background: 'rgba(239,68,68,0.3)' }}>
                  {m.firstName?.[0]}
                </div>
                <span className="text-red-300">{m.firstName} {m.lastName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily records table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="section-title">Check-in Records</h3>
            <p className="text-xs  mt-0.5">{records.length} records for selected date</p>
          </div>
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid var(--bg-base)' }}>
              <tr>
                {['Member', 'Check-in', 'Check-out', 'Duration', 'Method'].map(h => (
                  <th key={h} className="table-head">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-cell text-center  py-16">
                    <Calendar className="w-8 h-8 mx-auto mb-2 " />
                    No check-ins on this date
                  </td>
                </tr>
              )}
              {records.map((r: any) => {
                const duration = r.checkOutTime
                  ? Math.round((new Date(r.checkOutTime).getTime() - new Date(r.checkInTime).getTime()) / 60000)
                  : null;
                return (
                  <tr key={r.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                          {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className=" text-sm font-medium">{r.user?.firstName} {r.user?.lastName}</p>
                          <p className=" text-xs">{r.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell  font-mono text-sm">
                      {format(new Date(r.checkInTime), 'hh:mm a')}
                    </td>
                    <td className="table-cell  font-mono text-sm">
                      {r.checkOutTime ? format(new Date(r.checkOutTime), 'hh:mm a') : <span className="">—</span>}
                    </td>
                    <td className="table-cell  text-sm">
                      {duration !== null ? `${duration} min` : <span className="">—</span>}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${r.method === 'QR' ? 'badge-green' : 'badge-blue'}`}>{r.method}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showScanner && (
        <QRScanner
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['attendance'] });
            qc.invalidateQueries({ queryKey: ['attendance-summary'] });
          }}
        />
      )}
    </div>
  );
}
