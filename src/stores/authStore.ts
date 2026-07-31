import { create } from 'zustand';
import { getCookie, deleteCookie } from '@/lib/cookies';
import { authService } from '@/services/authService';
import type { LoginInput, RegisterInput } from '@/lib/validate';
import type { PublicUser, UserRole } from '@/types/auth';

interface AuthState {
  role: UserRole | null;
  userId: string | null;
  user: PublicUser | null;
  isLoading: boolean;
  error: string | null;
  initAuth: () => void;
  login: (data: LoginInput) => Promise<PublicUser>;
  register: (data: RegisterInput) => Promise<PublicUser>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

function readRoleFromCookie(): UserRole | null {
  const raw = getCookie('mp_role');
  if (raw === 'admin' || raw === 'mentor' || raw === 'participant') {
    return raw;
  }
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  role: null,
  userId: null,
  user: null,
  isLoading: false,
  error: null,

  initAuth: () => {
    const role = readRoleFromCookie();
    set({
      role,
      userId: role ? (getCookie('mp_user_id') ?? null) : null,
      user: null,
      error: null,
    });
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.login(data);
      set({
        role: user.role,
        userId: user.id,
        user,
        error: null,
      });
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка входа';
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.register(data);
      set({
        role: user.role,
        userId: user.id,
        user,
        error: null,
      });
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка регистрации';
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Server error is not critical here; local state must still be cleared.
    } finally {
      get().clearAuth();
    }
  },

  clearAuth: () => {
    deleteCookie('mp_access_token');
    deleteCookie('mp_refresh_token');
    deleteCookie('mp_role');
    deleteCookie('mp_user_id');
    set({ role: null, userId: null, user: null, error: null });
  },
}));
