import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Dumbbell, CalendarDays, BarChart3, Settings,
  LogOut, Bell, Menu, QrCode, TrendingUp, Zap, Award,
  BookOpen, CreditCard, ChevronRight, Globe, X,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import api from '../api/client';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n/context';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'nav.dashboard', exact: true },
  { to: '/admin/members', icon: Users, labelKey: 'nav.members' },
  { to: '/admin/memberships', icon: CreditCard, labelKey: 'nav.memberships' },
  { to: '/admin/attendance', icon: CalendarDays, labelKey: 'nav.attendance' },
  { to: '/admin/equipment', icon: Dumbbell, labelKey: 'nav.equipment' },
  { to: '/admin/events', icon: BookOpen, labelKey: 'nav.events' },
  { to: '/admin/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { to: '/admin/settings', icon: Settings, labelKey: 'nav.settings' },
];

const memberNav = [
  { to: '/member', icon: LayoutDashboard, labelKey: 'nav.dashboard', exact: true, moduleKey: 'dashboard' },
  { to: '/member/workout', icon: Zap, labelKey: 'nav.workout', moduleKey: 'workout' },
  { to: '/member/checkin', icon: QrCode, labelKey: 'nav.checkin', moduleKey: 'checkin' },
  { to: '/member/progress', icon: TrendingUp, labelKey: 'nav.progress', moduleKey: 'progress' },
  { to: '/member/badges', icon: Award, labelKey: 'nav.badges', moduleKey: 'badges' },
  { to: '/member/membership', icon: CreditCard, labelKey: 'nav.membership', moduleKey: 'membership' },
  { to: '/member/events', icon: BookOpen, labelKey: 'nav.events', moduleKey: 'events' },
];

const LANG_OPTIONS = [
  { value: 'en', label: 'EN', full: 'English' },
  { value: 'hi', label: 'हि', full: 'हिंदी' },
  { value: 'hinglish', label: 'Hi', full: 'Hinglish' },
] as const;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const nav = useNavigate();

  const isAdmin = user?.role !== 'MEMBER';
  const effectiveModules: string[] = isAdmin
    ? []
    : (user?.enabledModules ?? ['dashboard','workout','checkin','progress','badges','membership','events']);

  const navItems = isAdmin
    ? adminNav
    : memberNav.filter(item => !item.moduleKey || effectiveModules.includes(item.moduleKey));

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/gym/notifications').then(r => r.data),
    refetchInterval: 30000,
  });
  const unread = ((notifs as any[]) || []).filter((n: any) => !n.isRead).length;

  const handleLogout = () => { logout(); nav('/'); };
  const isActive = (item: any) => item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const SidebarContent = () => (
    <>
      {/* Logo / Gym branding */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        {user?.gymLogo ? (
          <img src={user.gymLogo} alt="Logo" className="w-9 h-9 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
            <Dumbbell className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{user?.gymName}</p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{user?.gymCode}</p>
        </div>
        <button className="lg:hidden ml-auto btn-ghost p-1.5" onClick={() => setOpen(false)}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {navItems.map(item => {
            const active = isActive(item);
            return (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                style={{
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  background: active ? 'rgba(var(--accent-rgb),0.09)' : 'transparent',
                  fontWeight: active ? 600 : 500,
                }}>
                <item.icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}
                />
                <span>{t(item.labelKey)}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--accent)' }} />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
          style={{ background: 'var(--bg-base)' }}>
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</p>
            <p className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-colors"
          style={{ color: '#ff3b30' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fff1f0')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <LogOut className="w-4 h-4" /> {t('nav.signout')}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0" style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-72 z-10" style={{ background: 'var(--bg-sidebar)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-5 py-3.5 shrink-0"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
          <button className="lg:hidden btn-ghost p-2" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />

          {/* Language picker */}
          <div className="relative">
            <button onClick={() => setLangOpen(p => !p)}
              className="btn-ghost gap-1.5 px-3 py-2"
              style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <Globe className="w-4 h-4" />
              {LANG_OPTIONS.find(l => l.value === lang)?.label}
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-20 rounded-xl overflow-hidden py-1"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', minWidth: 130 }}>
                  {LANG_OPTIONS.map(l => (
                    <button key={l.value} onClick={() => { setLang(l.value); setLangOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                      style={{
                        color: lang === l.value ? 'var(--accent)' : 'var(--text-secondary)',
                        background: lang === l.value ? 'rgba(var(--accent-rgb),0.07)' : 'transparent',
                        fontWeight: lang === l.value ? 600 : 400,
                      }}>
                      <span className="w-5 text-center font-bold text-xs">{l.label}</span>
                      {l.full}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <Link to={isAdmin ? '/admin/notifications' : '/member/notifications'}
            className="relative btn-ghost p-2.5">
            <Bell className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                style={{ background: '#ff3b30' }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
