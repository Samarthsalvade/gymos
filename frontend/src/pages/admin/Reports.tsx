import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-sm" style={{ background: '#1a1b23', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className=" text-xs mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="font-bold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name.includes('₹') ? `₹${p.value.toLocaleString('en-IN')}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { data: revenue } = useQuery({ queryKey: ['revenue'], queryFn: () => api.get('/memberships/revenue').then(r => r.data) });
  const { data: insights, isLoading: aiLoading, error: aiError } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => api.get('/ai/owner-insights').then(r => r.data),
    retry: false,
  });
  const { data: summary } = useQuery({ queryKey: ['attendance-summary'], queryFn: () => api.get('/attendance/summary').then(r => r.data) });

  const planData = Object.entries(revenue?.byPlan || {}).map(([name, value]) => ({ name, value: Number(value) }));
  const hourData = Object.entries(summary?.hourDistribution || {})
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([h, count]) => ({ hour: `${h}:00`, count: Number(count) }));

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="page-title">Reports & Analytics</h1>
        <p className=" text-sm mt-0.5">Revenue, attendance trends, and AI insights</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${(revenue?.totalRevenue || 0).toLocaleString('en-IN')}`, color: 'text-emerald-400', sub: 'All time' },
          { label: 'Active Plans', value: revenue?.activeCount || 0, color: 'text-blue-400', sub: 'Currently active' },
          { label: 'Lapsed Plans', value: revenue?.expiredCount || 0, color: 'text-red-400', sub: 'Expired / cancelled' },
          { label: 'Total Plans Sold', value: revenue?.totalMemberships || 0, color: 'text-purple-400', sub: 'All time' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-sm  font-medium mt-1">{s.label}</p>
            <p className="text-xs ">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {planData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold  mb-4 text-sm">Revenue by Plan (₹)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={planData} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-hover)" />
                <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="₹ Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold  mb-4 text-sm">Plan Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" paddingAngle={3}
                  label={(p: any) => `${p.name} ${((p.percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attendance peak hours */}
      {hourData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold  mb-4 text-sm">Peak Hours (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourData} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-base)" />
              <XAxis dataKey="hour" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2}
                fill="url(#areaGrad)" name="Check-ins" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Insights */}
      <div className="card" style={{ border: '1px solid rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.04)' }}>
        <h3 className="font-semibold  mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" /> AI Business Insights (Groq)
        </h3>
        {aiLoading && (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />)}
          </div>
        )}
        {(aiError || !insights) && !aiLoading && (
          <div className="text-center py-4">
            <p className=" text-sm">Add <code className="text-purple-400 bg-purple-900/20 px-1 rounded">GROQ_API_KEY</code> to <code className="text-purple-400 bg-purple-900/20 px-1 rounded">backend/.env</code> to enable AI insights</p>
            <a href="https://console.groq.com" target="_blank" rel="noopener" className="text-purple-400 text-xs hover:underline mt-1 inline-block">Get free key at console.groq.com →</a>
          </div>
        )}
        {insights && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <p className="text-xs  uppercase tracking-wider font-semibold">Insights</p>
              </div>
              <ul className="space-y-2">
                {insights.insights?.map((item: string, i: number) => (
                  <li key={i} className=" text-sm flex gap-2">
                    <span className="text-purple-400 mt-0.5 shrink-0">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <p className="text-xs  uppercase tracking-wider font-semibold">Priority Actions</p>
              </div>
              <ul className="space-y-2">
                {insights.priorityActions?.map((item: string, i: number) => (
                  <li key={i} className="text-amber-300 text-sm flex gap-2">
                    <span className="shrink-0">→</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p className="text-xs  uppercase tracking-wider font-semibold">Revenue Opportunity</p>
              </div>
              <p className="text-emerald-300 text-sm">{insights.revenueOpportunity}</p>
              {insights.positives?.map((item: string, i: number) => (
                <p key={i} className=" text-sm mt-2 flex gap-2"><span className="text-emerald-500">✓</span>{item}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
