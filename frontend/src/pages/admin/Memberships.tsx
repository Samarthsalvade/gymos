import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import api from '../../api/client';

interface MembershipForm {
  userId: number; planName: string; price: number;
  startDate: string; endDate: string; paymentMethod: string; notes: string;
}
interface RefundForm { refundAmount: number; refundMethod: string; refundReason: string; }
interface RenewForm { planName: string; price: number; paymentMethod: string; }

const statusBadge: Record<string, string> = {
  ACTIVE: 'badge-green', EXPIRED: 'badge-red', CANCELLED: 'badge-gray', PENDING: 'badge-yellow',
};

export default function Memberships() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [refundTarget, setRefundTarget] = useState<any>(null);
  const [renewTarget, setRenewTarget] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [search, setSearch] = useState('');

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['memberships', statusFilter],
    queryFn: () => api.get(`/memberships?status=${statusFilter}`).then(r => r.data),
  });
  const { data: members = [] } = useQuery({ queryKey: ['members-list'], queryFn: () => api.get('/members').then(r => r.data) });
  const { data: plans = [] } = useQuery({ queryKey: ['membership-plans'], queryFn: () => api.get('/membership-plans').then(r => r.data) });

  const { register, handleSubmit, watch, setValue, reset } = useForm<MembershipForm>();
  const { register: rRef, handleSubmit: hsRef, setValue: svRef } = useForm<RefundForm>();
  const { register: rRen, handleSubmit: hsRen, setValue: svRen } = useForm<RenewForm>();



  // Autofill price+days when plan selected
  const handlePlanSelect = (planName: string) => {
    const p = plans.find((pl: any) => pl.name === planName);
    if (p) {
      setValue('price', p.price);
      const start = watch('startDate') || new Date().toISOString().slice(0, 10);
      const endDate = new Date(new Date(start).getTime() + p.days * 86400000);
      setValue('startDate', start);
      setValue('endDate', endDate.toISOString().slice(0, 10));
    }
  };

  const create = useMutation({
    mutationFn: (d: MembershipForm) => api.post('/memberships', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['memberships'] }); reset(); setShowModal(false); toast.success('Membership created!'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const refund = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RefundForm }) => api.post(`/memberships/${id}/refund`, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['memberships'] });
      toast.success(`Refund of ₹${res.data.refundAmount} processed!`);
      setRefundTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const renew = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RenewForm }) => api.post(`/memberships/${id}/renew`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memberships'] });
      toast.success('Membership renewed!');
      setRenewTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const filtered = memberships.filter((m: any) =>
    !search || `${m.user?.firstName} ${m.user?.lastName} ${m.user?.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate default refund for refund modal
  const defaultRefund = refundTarget ? (() => {
    const total = differenceInDays(new Date(refundTarget.endDate), new Date(refundTarget.startDate));
    const used = Math.max(0, differenceInDays(new Date(), new Date(refundTarget.startDate)));
    const remaining = Math.max(0, total - used);
    return Math.round((remaining / total) * refundTarget.price);
  })() : 0;

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Memberships</h1>
          <p className=" text-sm mt-0.5">Manage member plans, renewals and refunds</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Membership
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
          {['ACTIVE', 'EXPIRED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${statusFilter === s ? 'text-white' : ' hover:'}`}
              style={statusFilter === s ? { background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' } : {}}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 " />
          <input className="input pl-9 h-9 text-xs" placeholder="Search member..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <p className="text-xs ">{filtered.length} records</p>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid var(--border)' }}>
              <tr>
                {['Member', 'Plan', 'Price', 'Validity', 'Days Left', 'Payment', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-head">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="table-cell text-center  py-12">Loading...</td></tr>}
              {filtered.map((m: any) => {
                const daysLeft = differenceInDays(new Date(m.endDate), new Date());
                return (
                  <tr key={m.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold  shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                          {m.user?.firstName?.[0]}{m.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className=" font-semibold text-sm">{m.user?.firstName} {m.user?.lastName}</p>
                          <p className=" text-xs">{m.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell  font-medium text-sm">{m.planName}</td>
                    <td className="table-cell font-bold text-emerald-400">₹{m.price?.toLocaleString('en-IN')}</td>
                    <td className="table-cell  text-xs">
                      <p>{format(new Date(m.startDate), 'dd MMM yy')}</p>
                      <p className="">→ {format(new Date(m.endDate), 'dd MMM yy')}</p>
                    </td>
                    <td className="table-cell">
                      {m.status === 'ACTIVE' ? (
                        <span className={`text-xs font-bold ${daysLeft <= 7 ? 'text-red-400' : daysLeft <= 15 ? 'text-amber-400' : ''}`}>
                          {daysLeft > 0 ? `${daysLeft}d` : 'Expired'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-cell  text-xs">{m.paymentMethod || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${statusBadge[m.status] || 'badge-gray'}`}>{m.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setRenewTarget(m); svRen('planName', m.planName); svRen('price', m.price); }}
                          className="btn-ghost btn-sm text-blue-400 hover:text-blue-300" title="Renew">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {m.status === 'ACTIVE' && (
                          <button onClick={() => { setRefundTarget(m); svRef('refundAmount', defaultRefund); svRef('refundMethod', 'Cash'); }}
                            className="btn-ghost btn-sm text-red-400 hover:text-red-300" title="Refund">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="table-cell text-center  py-12">No memberships found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ border: '1px solid var(--border-medium)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">New Membership</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Member</label>
                <div className="select-wrapper">
                  <select className="input pr-8" {...register('userId', { required: true, valueAsNumber: true })}>
                    <option value="">Select member...</option>
                    {members.filter((m: any) => m.role === 'MEMBER').map((m: any) => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {m.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Membership Plan</label>
                <div className="select-wrapper">
                  <select className="input pr-8" {...register('planName', { required: true })}
                    onChange={e => { handlePlanSelect(e.target.value); }}>
                    <option value="">Select plan (auto-fills price & dates)</option>
                    {plans.map((p: any) => (
                      <option key={p.name} value={p.name}>{p.name} — ₹{p.price.toLocaleString('en-IN')} ({p.days} days)</option>
                    ))}
                    <option value="Custom">Custom Plan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (₹)</label>
                  <input type="number" className="input" placeholder="Auto-filled" {...register('price', { required: true, valueAsNumber: true })} />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <div className="select-wrapper">
                    <select className="input pr-8" {...register('paymentMethod')}>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="NEFT">NEFT/Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" {...register('startDate', { required: true })}
                    defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input" {...register('endDate', { required: true })} />
                </div>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input className="input" placeholder="e.g. referred by Arjun" {...register('notes')} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={create.isPending}>
                  {create.isPending ? 'Creating...' : 'Create Membership'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundTarget && (
        <div className="modal-backdrop">
          <div className="card w-full max-w-md" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Process Refund</h2>
              <button onClick={() => setRefundTarget(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className=" font-semibold">{refundTarget.user?.firstName} {refundTarget.user?.lastName}</p>
              <p className=" text-xs mt-0.5">{refundTarget.planName} · ₹{refundTarget.price?.toLocaleString('en-IN')}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <div>
                  <p className="">Days remaining</p>
                  <p className="text-amber-400 font-bold">{Math.max(0, differenceInDays(new Date(refundTarget.endDate), new Date()))} days</p>
                </div>
                <div>
                  <p className="">Calculated refund</p>
                  <p className="text-emerald-400 font-bold">₹{defaultRefund.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            <form onSubmit={hsRef(d => refund.mutate({ id: refundTarget.id, data: d }))} className="space-y-4">
              <div>
                <label className="label">Refund Amount (₹) <span className=" normal-case font-normal">— editable</span></label>
                <input type="number" className="input" defaultValue={defaultRefund} {...rRef('refundAmount', { required: true, valueAsNumber: true })} />
                <p className="text-xs  mt-1">Default calculated from {Math.max(0, differenceInDays(new Date(refundTarget.endDate), new Date()))} remaining days. You can change this.</p>
              </div>
              <div>
                <label className="label">Refund Method</label>
                <div className="select-wrapper">
                  <select className="input pr-8" {...rRef('refundMethod')}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card Reversal">Card Reversal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Reason</label>
                <input className="input" placeholder="e.g. Member relocation" {...rRef('refundReason')} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1" onClick={() => setRefundTarget(null)}>Cancel</button>
                <button type="submit" className="btn-danger flex-1" disabled={refund.isPending}>
                  {refund.isPending ? 'Processing...' : 'Process Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {renewTarget && (
        <div className="modal-backdrop">
          <div className="card w-full max-w-md" style={{ border: '1px solid rgba(var(--accent-rgb),0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Renew Membership</h2>
              <button onClick={() => setRenewTarget(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.15)' }}>
              <p className=" font-semibold">{renewTarget.user?.firstName} {renewTarget.user?.lastName}</p>
              <p className=" text-xs mt-0.5">Current: {renewTarget.planName} · until {format(new Date(renewTarget.endDate), 'dd MMM yyyy')}</p>
            </div>
            <form onSubmit={hsRen(d => renew.mutate({ id: renewTarget.id, data: d }))} className="space-y-4">
              <div>
                <label className="label">Plan</label>
                <div className="select-wrapper">
                  <select className="input pr-8" {...rRen('planName')}
                    onChange={e => {
                      const p = plans.find((pl: any) => pl.name === e.target.value);
                      if (p) svRen('price', p.price);
                    }}>
                    {plans.map((p: any) => (
                      <option key={p.name} value={p.name}>{p.name} — ₹{p.price.toLocaleString('en-IN')} ({p.days} days)</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Price (₹)</label>
                  <input type="number" className="input" {...rRen('price', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="label">Payment</label>
                  <div className="select-wrapper">
                    <select className="input pr-8" {...rRen('paymentMethod')}>
                      <option>Cash</option><option>UPI</option><option>Card</option><option>NEFT</option>
                    </select>
                  </div>
                </div>
              </div>
              <p className="text-xs ">Renewal starts when current membership ends (or today if expired)</p>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1" onClick={() => setRenewTarget(null)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={renew.isPending}>
                  {renew.isPending ? 'Renewing...' : 'Renew Membership'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
