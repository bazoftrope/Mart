import { apiClient } from '@/lib/apiClient';
import type { LoginInput, RegisterInput } from '@/lib/validate';
import type { PublicUser } from '@/types/auth';

interface AuthResponse {
  user: PublicUser;
}

export const authService = {
  login: (data: LoginInput) =>
    apiClient.post<AuthResponse>('/api/auth/login', data),

  register: (data: RegisterInput) =>
    apiClient.post<AuthResponse>('/api/auth/register', data),

  logout: () => apiClient.post<{ ok: true }>('/api/auth/logout'),

  refresh: () => apiClient.post<AuthResponse>('/api/auth/refresh'),
};
