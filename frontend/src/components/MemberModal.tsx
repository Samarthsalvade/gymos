import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Upload, Camera, User, Shield } from 'lucide-react';
import api from '../api/client';
import { useI18n } from '../i18n/context';

const GOVT_IDS = [
  { value: 'AADHAR', label: 'Aadhaar Card', placeholder: '1234 5678 9012', hint: '12-digit number' },
  { value: 'PASSPORT', label: 'Passport', placeholder: 'A1234567', hint: 'Letter + 7 digits' },
  { value: 'VOTER_ID', label: 'Voter ID', placeholder: 'ABC1234567', hint: '3 letters + 7 digits' },
  { value: 'PAN', label: 'PAN Card', placeholder: 'ABCDE1234F', hint: '10 alphanumeric' },
  { value: 'DRIVING_LICENSE', label: "Driver's Licence", placeholder: 'MH0120100012345', hint: 'State code + number' },
];

const MODULE_ICONS: Record<string, string> = {
  dashboard: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png',
  workout: 'https://cdn-icons-png.flaticon.com/512/2827/2827920.png',
  checkin: 'https://cdn-icons-png.flaticon.com/512/1380/1380338.png',
  progress: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  badges: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png',
  membership: 'https://cdn-icons-png.flaticon.com/512/2534/2534230.png',
  events: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
};

const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'workout', label: 'Workout Plan' },
  { key: 'checkin', label: 'Check In / QR' },
  { key: 'progress', label: 'Progress Tracker' },
  { key: 'badges', label: 'Badges & Loyalty' },
  { key: 'membership', label: 'Membership' },
  { key: 'events', label: 'Events & Classes' },
];

interface Props {
  member?: any;
  onClose: () => void;
  mode: 'add' | 'edit';
}

export default function MemberModal({ member, onClose, mode }: Props) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const photoRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'basic' | 'id' | 'access'>('basic');

  const [form, setForm] = useState({
    firstName: member?.firstName || '',
    lastName: member?.lastName || '',
    email: member?.email || '',
    phone: member?.phone || '',
    password: '',
    role: member?.role || 'MEMBER',
    goals: member?.profile?.goals || '',
    fitnessLevel: member?.profile?.fitnessLevel || 'BEGINNER',
    gender: member?.profile?.gender || '',
    photoUrl: member?.photoUrl || '',
    govtIdType: member?.govtIdType || '',
    govtIdNumber: member?.govtIdNumber || '',
    selfCheckInEnabled: member?.selfCheckInEnabled || false,
    enabledModules: member?.enabledModules
      ? (typeof member.enabledModules === 'string' ? JSON.parse(member.enabledModules) : member.enabledModules)
      : ['dashboard','workout','checkin','progress','badges','membership','events'],
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const toggleModule = (key: string) => {
    setForm(f => ({
      ...f,
      enabledModules: f.enabledModules.includes(key)
        ? f.enabledModules.filter((m: string) => m !== key)
        : [...f.enabledModules, key],
    }));
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form };
      if (!payload.password) delete (payload as any).password;
      if (mode === 'add') return api.post('/members', payload).then(r => r.data);
      return api.put(`/members/${member.id}`, payload).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success(mode === 'add' ? 'Member added!' : 'Member updated!');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save'),
  });

  const selectedIdDef = GOVT_IDS.find(g => g.value === form.govtIdType);

  const TABS = [
    { key: 'basic', label: 'Basic Info', Icon: User },
    { key: 'id', label: 'ID & Photo', Icon: Camera },
    { key: 'access', label: 'Access Control', Icon: Shield },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'add' ? t('members.addMember') : t('members.editMember')}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all border-b-2"
              style={{
                color: tab === key ? 'var(--accent)' : 'var(--text-tertiary)',
                borderBottomColor: tab === key ? 'var(--accent)' : 'transparent',
                marginBottom: -1,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
              }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Basic Info ─── */}
          {tab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First name" />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last name" />
                </div>
              </div>
              {mode === 'add' && (
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="member@email.com" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="label">Role</label>
                  <div className="select-wrapper">
                    <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      <option value="MEMBER">Member</option>
                      <option value="TRAINER">Trainer</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                </div>
              </div>
              {mode === 'add' && (
                <div>
                  <label className="label">Password *</label>
                  <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimum 6 characters" />
                </div>
              )}
              <div>
                <label className="label">Fitness Goals</label>
                <textarea className="input resize-none" style={{ height: 80 }} value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} placeholder="e.g. Build muscle, lose weight, improve endurance..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fitness Level</label>
                  <div className="select-wrapper">
                    <select className="input" value={form.fitnessLevel} onChange={e => setForm(f => ({ ...f, fitnessLevel: e.target.value }))}>
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Gender</label>
                  <div className="select-wrapper">
                    <select className="input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                      <option value="">Prefer not to say</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ID & Photo ─── */}
          {tab === 'id' && (
            <div className="space-y-5">
              <div>
                <label className="label">{t('members.photo')} <span style={{ color: 'var(--text-tertiary)', textTransform: 'none' }}>(optional, max 2MB)</span></label>
                <div className="flex items-center gap-5">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    style={{ border: '2px dashed var(--border-medium)', background: 'var(--bg-base)' }}
                    onClick={() => photoRef.current?.click()}>
                    {form.photoUrl ? (
                      <img src={form.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--text-tertiary)' }} />
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Add photo</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Member photo</p>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Used for identity verification. Not shared with other members.</p>
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary btn-sm" onClick={() => photoRef.current?.click()}>
                        <Upload className="w-3.5 h-3.5" /> Upload
                      </button>
                      {form.photoUrl && <button type="button" className="btn-ghost btn-sm text-red-500" onClick={() => setForm(f => ({ ...f, photoUrl: '' }))}>Remove</button>}
                    </div>
                    <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <label className="label">{t('members.govtId')} <span style={{ color: 'var(--text-tertiary)', textTransform: 'none' }}>(optional)</span></label>
                <div className="space-y-3">
                  <div>
                    <label className="label">ID Type</label>
                    <div className="select-wrapper">
                      <select className="input" value={form.govtIdType} onChange={e => setForm(f => ({ ...f, govtIdType: e.target.value, govtIdNumber: '' }))}>
                        <option value="">— Select ID type —</option>
                        {GOVT_IDS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {form.govtIdType && (
                    <div>
                      <label className="label">{selectedIdDef?.label} Number</label>
                      <input className="input font-mono tracking-wider"
                        value={form.govtIdNumber}
                        onChange={e => setForm(f => ({ ...f, govtIdNumber: e.target.value }))}
                        placeholder={selectedIdDef?.placeholder} />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Format: {selectedIdDef?.hint}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 rounded-xl p-3 flex gap-2.5" style={{ background: 'rgba(var(--accent-rgb),0.05)', border: '1px solid rgba(var(--accent-rgb),0.12)' }}>
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Government ID is stored securely and only visible to gym admins. Never shared with third parties.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Access Control ─── */}
          {tab === 'access' && (
            <div className="space-y-5">
              {/* Self check-in toggle */}
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{t('members.selfCheckIn')}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Member can tap "Self Check-In" on their device</p>
                  </div>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, selfCheckInEnabled: !f.selfCheckInEnabled }))}
                    className="relative w-12 h-6 rounded-full transition-all duration-200"
                    style={{ background: form.selfCheckInEnabled ? 'var(--accent)' : '#d1d5db' }}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.selfCheckInEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                {!form.selfCheckInEnabled && (
                  <p className="text-amber-600 text-xs mt-2">Member must show QR at front desk to check in</p>
                )}
              </div>

              {/* Module access */}
              <div>
                <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{t('members.modules')}</p>
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>Control which sections this member can access</p>
                <div className="space-y-2">
                  {ALL_MODULES.map(m => {
                    const enabled = form.enabledModules.includes(m.key);
                    return (
                      <div key={m.key}
                        onClick={() => m.key !== 'dashboard' && toggleModule(m.key)}
                        className="flex items-center justify-between p-3.5 rounded-xl transition-all"
                        style={{
                          background: enabled ? 'rgba(var(--accent-rgb),0.06)' : 'var(--bg-base)',
                          border: `1px solid ${enabled ? 'rgba(var(--accent-rgb),0.2)' : 'var(--border)'}`,
                          cursor: m.key === 'dashboard' ? 'not-allowed' : 'pointer',
                          opacity: m.key === 'dashboard' ? 0.65 : 1,
                        }}>
                        <div className="flex items-center gap-3">
                          <img src={MODULE_ICONS[m.key]} alt={m.label} className="w-6 h-6" />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.label}</p>
                            {m.key === 'dashboard' && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Always visible</p>}
                          </div>
                        </div>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all"
                          style={enabled ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : { borderColor: 'var(--border-medium)' }}>
                          {enabled && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary flex-1">
            {save.isPending ? 'Saving...' : mode === 'add' ? t('members.addMember') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
