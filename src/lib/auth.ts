import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse, serialize, type SerializeOptions } from 'cookie';
import bcrypt from 'bcrypt';
import { User, type UserRole } from '@db/models/User';
import type { TokenPayload, PublicUser } from '@/types/auth';
import '@/lib/db';

const ACCESS_TOKEN_NAME = 'mp_access_token';
const REFRESH_TOKEN_NAME = 'mp_refresh_token';
const ROLE_COOKIE_NAME = 'mp_role';

const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const COOKIE_NAMES = {
  access: ACCESS_TOKEN_NAME,
  refresh: REFRESH_TOKEN_NAME,
  role: ROLE_COOKIE_NAME,
};

function getSecrets() {
  return {
    access: process.env.JWT_SECRET || '',
    refresh: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '',
  };
}

export function generateAccessToken(payload: TokenPayload): string {
  const { access } = getSecrets();
  if (!access) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, access, { expiresIn: `${ACCESS_TTL_SECONDS}s` });
}

export function generateRefreshToken(payload: TokenPayload): string {
  const { refresh } = getSecrets();
  if (!refresh) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.sign(payload, refresh, { expiresIn: `${REFRESH_TTL_SECONDS}s` });
}

export function verifyAccessToken(token: string): TokenPayload {
  const { access } = getSecrets();
  if (!access) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.verify(token, access) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const { refresh } = getSecrets();
  if (!refresh) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.verify(token, refresh) as TokenPayload;
}

function baseCookieOptions(): SerializeOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function setAuthCookies(res: NextApiResponse, payload: TokenPayload): void {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.setHeader('Set-Cookie', [
    serialize(ACCESS_TOKEN_NAME, accessToken, {
      ...baseCookieOptions(),
      maxAge: ACCESS_TTL_SECONDS,
    }),
    serialize(REFRESH_TOKEN_NAME, refreshToken, {
      ...baseCookieOptions(),
      maxAge: REFRESH_TTL_SECONDS,
    }),
    serialize(ROLE_COOKIE_NAME, payload.role, {
      ...baseCookieOptions(),
      httpOnly: false,
      maxAge: REFRESH_TTL_SECONDS,
    }),
  ]);
}

export function clearAuthCookies(res: NextApiResponse): void {
  const opts = { ...baseCookieOptions(), maxAge: 0 };
  res.setHeader('Set-Cookie', [
    serialize(ACCESS_TOKEN_NAME, '', opts),
    serialize(REFRESH_TOKEN_NAME, '', opts),
    serialize(ROLE_COOKIE_NAME, '', { ...opts, httpOnly: false }),
  ]);
}

export function parseCookies(req: NextApiRequest): Record<string, string> {
  return parse(req.headers.cookie || '') as Record<string, string>;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAdminCredential(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  return Boolean(adminEmail && email.toLowerCase() === adminEmail.toLowerCase());
}

export async function validateAdminPassword(password: string): Promise<boolean> {
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminHash) return false;
  return bcrypt.compare(password, adminHash);
}

export async function ensureAdminUser(): Promise<User> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) {
    throw new Error('Admin credentials are not configured');
  }

  const [user] = await User.findOrCreate({
    where: { email: adminEmail.toLowerCase() },
    defaults: {
      email: adminEmail.toLowerCase(),
      passwordHash: adminHash,
      role: 'admin' as UserRole,
      name: 'Administrator',
      timezone: 'Europe/Moscow',
    },
  });

  if (user.role !== 'admin' || user.passwordHash !== adminHash) {
    user.role = 'admin';
    user.passwordHash = adminHash;
    await user.save();
  }

  return user;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    timezone: user.timezone,
  };
}
