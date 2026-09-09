import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/client';

const typeColor: Record<string, string> = {
  RENEWAL: 'text-yellow-400',
  BADGE: 'text-purple-400',
  STREAK: 'text-orange-400',
  EVENT: 'text-blue-400',
  INFO: '',
};

export default function Notifications() {
  const qc = useQueryClient();
  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/gym/notifications').then(r => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => api.put(`/gym/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="page-title">Notifications</h1>

      <div className="space-y-2">
        {notifs.map((n: any) => (
          <div key={n.id} className={`card flex items-start gap-3 ${!n.isRead ? 'border-[var(--accent)]/30' : 'opacity-60'}`}>
            <Bell className={`w-4 h-4 mt-0.5 shrink-0 ${typeColor[n.type] || ''}`} />
            <div className="flex-1 min-w-0">
              <p className=" text-sm font-medium">{n.title}</p>
              <p className=" text-xs mt-0.5">{n.message}</p>
              <p className=" text-xs mt-1">{format(new Date(n.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
            </div>
            {!n.isRead && (
              <button onClick={() => markRead.mutate(n.id)} className=" hover: shrink-0" title="Mark as read">
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {notifs.length === 0 && (
          <div className="card text-center ">No notifications yet</div>
        )}
      </div>
    </div>
  );
}
