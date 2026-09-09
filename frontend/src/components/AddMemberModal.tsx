import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface FormData {
  firstName: string; lastName: string; email: string;
  phone: string; password: string; role: string;
  goals: string; fitnessLevel: string;
}

export default function AddMemberModal({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ defaultValues: { role: 'MEMBER' } });
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (data: FormData) => api.post('/members', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member created!');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Member</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input className="input" {...register('firstName', { required: true })} />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" {...register('lastName')} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" {...register('email', { required: true })} />
            {errors.email && <p className="text-red-500 text-xs mt-1">Required</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" {...register('password', { required: true, minLength: 6 })} />
            {errors.password && <p className="text-red-500 text-xs mt-1">Min 6 chars</p>}
          </div>
          <div>
            <label className="label">Role</label>
            <div className="select-wrapper">
              <select className="input" {...register('role')}>
                <option value="MEMBER">Member</option>
                <option value="TRAINER">Trainer</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Goals</label>
            <input className="input" placeholder="e.g. Build muscle, lose weight" {...register('goals')} />
          </div>
          <div>
            <label className="label">Fitness Level</label>
            <div className="select-wrapper">
              <select className="input" {...register('fitnessLevel')}>
                <option value="">Select...</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={create.isPending}>
              {create.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
