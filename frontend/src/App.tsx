import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import Members from './pages/admin/Members';
import Memberships from './pages/admin/Memberships';
import Attendance from './pages/admin/Attendance';
import Equipment from './pages/admin/Equipment';
import Events from './pages/admin/Events';
import Reports from './pages/admin/Reports';
import GymSettings from './pages/admin/GymSettings';
import MemberDashboard from './pages/member/MemberDashboard';
import CheckIn from './pages/member/CheckIn';
import WorkoutPlan from './pages/member/WorkoutPlan';
import Progress from './pages/member/Progress';
import Badges from './pages/member/Badges';
import MemberMembership from './pages/member/MemberMembership';
import MemberEvents from './pages/member/MemberEvents';
import Notifications from './pages/Notifications';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, tokens } = useAuthStore();
  if (!user || !tokens) return <Navigate to="/" replace />;
  return children;
}

function RequireAdmin({ children }: { children: React.ReactElement }) {
  const { user } = useAuthStore();
  if (user?.role === 'MEMBER') return <Navigate to="/member" replace />;
  return children;
}

function RequireModule({ module: mod, children }: { module: string; children: React.ReactElement }) {
  const { user } = useAuthStore();
  const enabled: string[] = (user as any)?.enabledModules || [];
  // Always allow dashboard; if no list yet (admin), allow all
  if (enabled.length === 0 || enabled.includes(mod)) return children;
  return <Navigate to="/member" replace />;
}

function BrandInit() {
  const { user } = useAuthStore();
  useEffect(() => {
    if (user?.accentColor) {
      document.documentElement.style.setProperty('--accent', user.accentColor);
    }
  }, [user?.accentColor]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <BrandInit />
        <Toaster position="top-right" toastOptions={{ style: { background: '#ffffff', color: '#1d1d1f', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' } }} />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={<RequireAuth><RequireAdmin><Layout><AdminDashboard /></Layout></RequireAdmin></RequireAuth>} />
          <Route path="/admin/members" element={<RequireAuth><RequireAdmin><Layout><Members /></Layout></RequireAdmin></RequireAuth>} />
          <Route path="/admin/memberships" element={<RequireAuth><RequireAdmin><Layout><Memberships /></Layout></RequireAdmin></RequireAuth>} />
          <Route path="/admin/attendance" element={<RequireAuth><RequireAdmin><Layout><Attendance /></Layout></RequireAdmin></RequireAuth>} />
          <Route path="/admin/equipment" element={<RequireAuth><RequireAdmin><Layout><Equipment /></Layout></RequireAdmin></RequireAuth>} />
          <Route path="/admin/events" element={<RequireAuth><RequireAdmin><Layout><Events /></Layout></RequireAdmin></RequireAuth>} />
          <Route path="/admin/reports" element={<RequireAuth><RequireAdmin><Layout><Reports /></Layout></RequireAdmin></RequireAuth>} />
          <Route path="/admin/settings" element={<RequireAuth><RequireAdmin><Layout><GymSettings /></Layout></RequireAdmin></RequireAuth>} />
          <Route path="/admin/notifications" element={<RequireAuth><RequireAdmin><Layout><Notifications /></Layout></RequireAdmin></RequireAuth>} />

          <Route path="/member" element={<RequireAuth><Layout><MemberDashboard /></Layout></RequireAuth>} />
          <Route path="/member/checkin" element={<RequireAuth><RequireModule module="checkin"><Layout><CheckIn /></Layout></RequireModule></RequireAuth>} />
          <Route path="/member/workout" element={<RequireAuth><RequireModule module="workout"><Layout><WorkoutPlan /></Layout></RequireModule></RequireAuth>} />
          <Route path="/member/progress" element={<RequireAuth><RequireModule module="progress"><Layout><Progress /></Layout></RequireModule></RequireAuth>} />
          <Route path="/member/badges" element={<RequireAuth><RequireModule module="badges"><Layout><Badges /></Layout></RequireModule></RequireAuth>} />
          <Route path="/member/membership" element={<RequireAuth><RequireModule module="membership"><Layout><MemberMembership /></Layout></RequireModule></RequireAuth>} />
          <Route path="/member/events" element={<RequireAuth><RequireModule module="events"><Layout><MemberEvents /></Layout></RequireModule></RequireAuth>} />
          <Route path="/member/notifications" element={<RequireAuth><Layout><Notifications /></Layout></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
