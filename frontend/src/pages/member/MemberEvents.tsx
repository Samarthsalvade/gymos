import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { BookOpen, Calendar } from 'lucide-react';
import api from '../../api/client';

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  ANNOUNCEMENT: { bg: '#dbeafe', color: '#1e40af' },
  MAINTENANCE:  { bg: '#fef3c7', color: '#92400e' },
  CLASS:        { bg: '#d1fae5', color: '#065f46' },
  HOLIDAY:      { bg: '#ede9fe', color: '#5b21b6' },
};

export default function MemberEvents() {
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data),
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Events & Announcements</h1>
        <p className="page-subtitle">Stay up to date with your gym</p>
      </div>

      <div className="space-y-3">
        {(events as any[]).map((e: any) => {
          const style = TYPE_STYLES[e.type] || { bg: '#f3f4f6', color: '#374151' };
          return (
            <div key={e.id} className="card">
              <div className="flex items-start gap-3">
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
              </div>
            </div>
          );
        })}
        {(events as any[]).length === 0 && (
          <div className="card text-center py-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--bg-base)' }}>
              <BookOpen className="w-7 h-7" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No events posted yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Your gym hasn't posted any events yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
