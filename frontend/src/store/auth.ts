import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Tokens { access: string; refresh: string; }

export interface GymUser {
  id: number; email: string; firstName: string; lastName: string;
  role: string; gymId: number; gymCode: string; gymName: string;
  gymLogo?: string; accentColor: string; qrCode?: string;
  photoUrl?: string; enabledModules?: string[]; selfCheckInEnabled?: boolean;
  loyaltyPoints?: number;
}

interface AuthState {
  user: GymUser | null;
  tokens: Tokens | null;
  setAuth: (user: GymUser, tokens: Tokens) => void;
  setTokens: (tokens: Tokens) => void;
  logout: () => void;
}

function applyAccent(color: string) {
  const hex = color || '#0071e3';
  document.documentElement.style.setProperty('--accent', hex);
  // Derive dark variant
  document.documentElement.style.setProperty('--accent-dark', hex);
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      tokens: null,
      setAuth: (user, tokens) => {
        applyAccent(user.accentColor);
        set({ user, tokens });
      },
      setTokens: tokens => set(s => ({ tokens, user: s.user })),
      logout: () => {
        applyAccent('#0071e3');
        set({ user: null, tokens: null });
      },
    }),
    { name: 'gym-auth' }
  )
);

// Restore accent on load
try {
  const saved = JSON.parse(localStorage.getItem('gym-auth') || '{}');
  const accent = saved?.state?.user?.accentColor;
  if (accent) applyAccent(accent);
} catch {}
