import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, TrendingUp, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../api/client';

interface LogForm {
  weight: number; waistCm: number; chestCm: number; armsCm: number; notes: string;
}

export default function Progress() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<LogForm>();

  const { data: logs = [] } = useQuery({
    queryKey: ['progress'],
    queryFn: () => api.get('/progress').then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => api.get('/ai/progress-summary').then(r => r.data),
    retry: false,
  });

  const create = useMutation({
    mutationFn: (d: LogForm) => api.post('/progress', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['progress'] }); reset(); setShowForm(false); toast.success('Progress logged!'); },
    onError: () => toast.error('Failed to log'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/progress/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress'] }),
  });

  const chartData = [...logs].reverse().map((l: any) => ({
    date: format(new Date(l.logDate), 'dd/MM'),
    weight: l.weight,
    waist: l.waistCm,
  }));

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Progress Tracker</h1>
          <p className="page-subtitle">Track your body measurements and gains</p>
        </div>
        <button className="btn-primary gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Log Entry
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ border: '1px solid rgba(var(--accent-rgb),0.2)', background: 'rgba(var(--accent-rgb),0.03)' }}>
          <h3 className="section-title mb-4">New Progress Entry</h3>
          <form onSubmit={handleSubmit(d => create.mutate(d))} className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.1" className="input" placeholder="72.5" {...register('weight', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Waist (cm)</label>
              <input type="number" step="0.1" className="input" placeholder="82" {...register('waistCm', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Chest (cm)</label>
              <input type="number" step="0.1" className="input" placeholder="96" {...register('chestCm', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Arms (cm)</label>
              <input type="number" step="0.1" className="input" placeholder="35" {...register('armsCm', { valueAsNumber: true })} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <input className="input" placeholder="How did you feel today?" {...register('notes')} />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={create.isPending}>
                {create.isPending ? 'Saving...' : 'Save Entry'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="card">
          <h3 className="section-title flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Weight Over Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: '#1d1d1f' }}
                labelStyle={{ color: '#515154', fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="card" style={{ border: '1px solid rgba(var(--accent-rgb),0.18)', background: 'rgba(var(--accent-rgb),0.04)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Progress Summary</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.65 }}>{summary.summary}</p>
          {summary.recommendation && (
            <div className="mt-3 pt-3 flex items-start gap-2" style={{ borderTop: '1px solid rgba(var(--accent-rgb),0.1)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <p style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>{summary.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* Log history */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="section-title">Log History</h3>
        </div>
        <div>
          {(logs as any[]).map((log: any, i: number) => (
            <div key={log.id} className="flex items-center gap-4 px-5 py-3.5"
              style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                style={{ background: 'rgba(var(--accent-rgb),0.08)', color: 'var(--accent)' }}>
                {format(new Date(log.logDate), 'dd')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {format(new Date(log.logDate), 'dd MMM yyyy')}
                </p>
                <div className="flex flex-wrap gap-3 mt-0.5">
                  {log.weight && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>⚖ {log.weight}kg</span>}
                  {log.waistCm && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Waist {log.waistCm}cm</span>}
                  {log.chestCm && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Chest {log.chestCm}cm</span>}
                  {log.armsCm && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Arms {log.armsCm}cm</span>}
                  {log.notes && <span className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>{log.notes}</span>}
                </div>
              </div>
              <button onClick={() => remove.mutate(log.id)}
                className="p-2 rounded-lg transition-colors hover:bg-red-50"
                style={{ color: '#ff3b30' }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {(logs as any[]).length === 0 && (
            <div className="px-5 py-12 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                <TrendingUp className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No progress logged yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Start tracking your measurements to see your progress over time</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
