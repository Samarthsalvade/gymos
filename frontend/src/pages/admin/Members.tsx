import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UserCheck, UserX, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry, type ColDef } from '@ag-grid-community/core';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import api from '../../api/client';
import MemberModal from '../../components/MemberModal';
import { useI18n } from '../../i18n/context';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const roleBadge: Record<string, string> = {
  ADMIN: 'badge-purple', MANAGER: 'badge-blue', TRAINER: 'badge-green', MEMBER: 'badge-gray',
};

export default function Members() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const gridRef = useRef<AgGridReact>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedQr, setSelectedQr] = useState<any>(null);
  const [pageSize, setPageSize] = useState(25);

  // Load ALL members client-side (no server pagination)
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/members?limit=10000').then(r => r.data),
    staleTime: 30_000,
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => api.delete(`/members/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); toast.success('Member deactivated'); },
  });

  // Client-side filtered rows
  const filteredMembers = useMemo(() => {
    let data = members as any[];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((m: any) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.includes(q)
      );
    }
    if (roleFilter) data = data.filter((m: any) => m.role === roleFilter);
    return data;
  }, [members, search, roleFilter]);

  const activeCount = (members as any[]).filter((m: any) => m.isActive).length;

  // AG Grid column definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'Member',
      field: 'firstName',
      flex: 2,
      minWidth: 220,
      cellRenderer: (p: any) => {
        const m = p.data;
        return (
          <div className="flex items-center gap-3 h-full">
            {m.photoUrl ? (
              <img src={m.photoUrl} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                {m.firstName?.[0]}{m.lastName?.[0]}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{m.firstName} {m.lastName}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'Role',
      field: 'role',
      width: 110,
      cellRenderer: (p: any) => (
        <span className={`badge ${roleBadge[p.value] || 'badge-gray'}`}>{p.value}</span>
      ),
    },
    {
      headerName: 'Active Plan',
      field: 'memberships',
      flex: 1.5,
      minWidth: 160,
      cellRenderer: (p: any) => {
        const plan = p.data?.memberships?.[0];
        if (!plan) return <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No plan</span>;
        return (
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.planName}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>until {format(new Date(plan.endDate), 'dd MMM yyyy')}</p>
          </div>
        );
      },
    },
    {
      headerName: 'Self Check-In',
      field: 'selfCheckInEnabled',
      width: 130,
      cellRenderer: (p: any) => (
        <span className={`text-xs font-semibold ${p.value ? 'text-emerald-600' : ''}`} style={!p.value ? { color: 'var(--text-tertiary)' } : {}}>
          {p.value ? '✓ Enabled' : '— Desk only'}
        </span>
      ),
    },
    {
      headerName: 'Joined',
      field: 'createdAt',
      width: 120,
      valueFormatter: (p: any) => format(new Date(p.value), 'dd MMM yyyy'),
      cellStyle: { color: 'var(--text-tertiary)', fontSize: '12px' },
    },
    {
      headerName: 'Status',
      field: 'isActive',
      width: 110,
      cellRenderer: (p: any) => (
        p.value
          ? <span className="badge badge-green"><UserCheck className="w-3 h-3 inline mr-1" />Active</span>
          : <span className="badge badge-red"><UserX className="w-3 h-3 inline mr-1" />Inactive</span>
      ),
    },
    {
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => {
        const m = p.data;
        return (
          <div className="flex items-center gap-1 h-full">
            {m.qrCode && (
              <button className="btn-ghost btn-sm px-2 py-1" title="View QR"
                onClick={e => { e.stopPropagation(); setSelectedQr(m); }}>
                <QrCode className="w-3.5 h-3.5" />
              </button>
            )}
            {m.isActive && (
              <button className="btn-ghost btn-sm px-2 py-1 text-red-400 hover:text-red-300 text-xs"
                onClick={e => { e.stopPropagation(); deactivate.mutate(m.id); }}>
                Off
              </button>
            )}
          </div>
        );
      },
    },
  ], [deactivate]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: false,
  }), []);

  const onRowClicked = useCallback((e: any) => {
    if (e.data) setSelectedMember(e.data);
  }, []);

  return (
    <div className="space-y-5 max-w-full h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('members.title')}</h1>
          <p className="page-subtitle">{(members as any[]).length} total · {activeCount} active</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> {t('members.addMember')}
        </button>
      </div>

      {/* Filters + page size */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input className="input pl-9 h-10 text-base" placeholder={`${t('common.search')} name, email, phone...`}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Role filter */}
        <div className="pill-tabs">
          {['', 'MEMBER', 'TRAINER', 'MANAGER'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`pill-tab ${roleFilter === r ? 'active' : ''}`}>
              {r || 'All'}
            </button>
          ))}
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Show:</span>
          <div className="pill-tabs">
            {[10, 25, 50, 100].map(n => (
              <button key={n} onClick={() => {
                setPageSize(n);
                if (gridRef.current?.api) gridRef.current.api.updateGridOptions({ paginationPageSize: n });
              }}
                className={`pill-tab ${pageSize === n ? 'active' : ''}`}>
                {n}
              </button>
            ))}
          </div>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{filteredMembers.length} rows</span>
        </div>
      </div>

      {/* AG Grid */}
      <div className="flex-1 ag-theme-quartz rounded-2xl overflow-hidden"
        style={{ minHeight: 480, border: '1px solid var(--border)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-tertiary)' }}>
            <div className="animate-spin w-6 h-6 border-2 border-gray-700 rounded-full" style={{ borderTopColor: 'var(--accent)' }} />
          </div>
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={filteredMembers}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={pageSize}
            paginationPageSizeSelector={false}
            rowHeight={64}
            headerHeight={44}
            onRowClicked={onRowClicked}
            rowClass="cursor-pointer"
            overlayNoRowsTemplate={`<div style="color:#4b5563;text-align:center;padding:48px"><div style="font-size:2rem;margin-bottom:8px">👥</div>No members found</div>`}
            suppressCellFocus={true}
            animateRows={true}
          />
        )}
      </div>

      {/* Tip */}
      <p className="text-gray-700 text-xs">Click any row to view and edit member details</p>

      {/* Modals */}
      {showAddModal && <MemberModal mode="add" onClose={() => setShowAddModal(false)} />}
      {selectedMember && (
        <MemberModal mode="edit" member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}

      {/* QR Modal */}
      {selectedQr && (
        <div className="modal-backdrop" onClick={() => setSelectedQr(null)}>
          <div className="card text-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selectedQr.firstName} {selectedQr.lastName}</p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{selectedQr.email}</p>
              </div>
              <span className={`badge ${roleBadge[selectedQr.role]}`}>{selectedQr.role}</span>
            </div>
            <div className="flex justify-center p-4 rounded-2xl bg-white mb-3">
              <img src={selectedQr.qrCode} alt="QR Code" className="w-56 h-56" />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Member shows this QR at entrance to check in</p>
            <button className="btn-secondary mt-4 w-full" onClick={() => setSelectedQr(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
