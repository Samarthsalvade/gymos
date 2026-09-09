import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../api/client';

interface EventForm { title: string; description: string; eventDate: string; type: string; }

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  ANNOUNCEMENT: { bg: '#dbeafe', color: '#1e40af' },
  MAINTENANCE:  { bg: '#fef3c7', color: '#92400e' },
  CLASS:        { bg: '#d1fae5', color: '#065f46' },
  HOLIDAY:      { bg: '#ede9fe', color: '#5b21b6' },
};

export default function Events() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<EventForm>({ defaultValues: { type: 'ANNOUNCEMENT' } });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (d: EventForm) => api.post('/events', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); reset(); setShowForm(false); toast.success('Event created & members notified!'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Deleted'); },
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Events & Announcements</h1>
          <p className="page-subtitle">Post announcements, classes, and holidays to all members</p>
        </div>
        <button className="btn-primary gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Post Event
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ border: '1px solid rgba(var(--accent-rgb),0.2)', background: 'rgba(var(--accent-rgb),0.03)' }}>
          <h3 className="section-title mb-4">New Event</h3>
          <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Title</label>
                <input className="input" {...register('title', { required: true })} placeholder="e.g. Yoga class this Saturday" />
              </div>
              <div>
                <label className="label">Type</label>
                <div className="select-wrapper">
                  <select className="input" {...register('type')}>
                    {Object.keys(TYPE_STYLES).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={3} {...register('description')} placeholder="Additional details..." />
            </div>
            <div>
              <label className="label">Event Date & Time</label>
              <input type="datetime-local" className="input" {...register('eventDate', { required: true })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={create.isPending}>
                {create.isPending ? 'Posting...' : 'Post & Notify Members'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {(events as any[]).map((e: any) => {
          const style = TYPE_STYLES[e.type] || { bg: '#f3f4f6', color: '#374151' };
          return (
            <div key={e.id} className="card flex items-start gap-4">
              <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: style.bg, color: style.color }}>
                {e.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{e.title}</p>
                {e.description && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{e.description}</p>}
                <div className="flex items-center gap-1.5 mt-2">
                  <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {format(new Date(e.eventDate), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
              </div>
              <button onClick={() => remove.mutate(e.id)} className="text-red-400 hover:text-red-500 shrink-0 p-1 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        {(events as any[]).length === 0 && (
          <div className="card text-center py-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--bg-base)' }}>
              <Calendar className="w-7 h-7" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No events posted yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Post an event to notify all members instantly</p>
          </div>
        )}
      </div>
    </div>
  );
}
