import type { NextApiRequest } from 'next';

export type UserRole = 'mentor' | 'participant' | 'admin';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user: TokenPayload;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  timezone: string;
  sex: 'male' | 'female' | null;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
}
