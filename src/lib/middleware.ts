import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import type { UserRole } from '@db/models/User';
import type { AuthenticatedRequest } from '@/types/auth';
import { verifyAccessToken, parseCookies } from './auth';

function unauthorized(res: NextApiResponse): void {
  res.status(401).json({
    success: false,
    error: 'UNAUTHORIZED',
    message: 'Unauthorized',
  });
}

function forbidden(res: NextApiResponse): void {
  res.status(403).json({
    success: false,
    error: 'FORBIDDEN',
    message: 'Forbidden',
  });
}

export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const cookies = parseCookies(req);
    const accessToken = cookies.mp_access_token;

    if (!accessToken) {
      return unauthorized(res);
    }

    try {
      const payload = verifyAccessToken(accessToken);
      (req as AuthenticatedRequest).user = payload;
      return handler(req, res);
    } catch {
      return unauthorized(res);
    }
  };
}

export function withRole(role: UserRole): (handler: NextApiHandler) => NextApiHandler {
  return (handler: NextApiHandler) =>
    withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
      const user = (req as AuthenticatedRequest).user;
      if (user.role !== role) {
        return forbidden(res);
      }
      return handler(req, res);
    });
}

export const withAdmin = withRole('admin');
export const withMentor = withRole('mentor');
export const withParticipant = withRole('participant');
