import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/client';

const conditions = ['GOOD', 'FAIR', 'NEEDS_REPAIR', 'OUT_OF_ORDER'];
const condColor: Record<string, string> = {
  GOOD: 'bg-green-900/50 text-green-300',
  FAIR: 'bg-yellow-900/50 text-yellow-300',
  NEEDS_REPAIR: 'bg-orange-900/50 text-orange-300',
  OUT_OF_ORDER: 'bg-red-900/50 text-red-300',
};

interface FormData { name: string; category: string; quantity: number; condition: string; notes: string; }

export default function Equipment() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormData>({ defaultValues: { condition: 'GOOD', quantity: 1 } });

  const { data: items = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => api.get('/equipment').then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (d: FormData) => api.post('/equipment', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); reset(); setShowForm(false); toast.success('Added!'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/equipment/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Removed'); },
  });

  const byCategory = items.reduce((acc: Record<string, any[]>, item: any) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Equipment</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Add Equipment
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="section-title mb-3">New Equipment</h3>
          <form onSubmit={handleSubmit(d => create.mutate(d))} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" placeholder="e.g. Treadmill" {...register('name', { required: true })} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" placeholder="e.g. Cardio" {...register('category', { required: true })} />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input" {...register('quantity', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Condition</label>
              <select className="input" {...register('condition')}>
                {conditions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" {...register('notes')} />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={create.isPending}>Save</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(byCategory).map(([cat, catItems]) => (
          <div key={cat} className="card p-0 overflow-hidden">
            <div className="px-4 py-2 bg-gray-800/50 border-b border-[var(--border)]">
              <h3 className="font-semibold  text-sm">{cat} ({(catItems as any[]).length})</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[var(--border)]">
                {(catItems as any[]).map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-white">{item.name}</td>
                    <td className="px-4 py-3 ">Qty: {item.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${condColor[item.condition]}`}>{item.condition.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3  text-xs">{item.notes}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove.mutate(item.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {items.length === 0 && <div className="card text-center ">No equipment added yet</div>}
      </div>
    </div>
  );
}
