import type { NextApiRequest } from 'next';
import type { UserRole } from '@db/models/User';

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
}
