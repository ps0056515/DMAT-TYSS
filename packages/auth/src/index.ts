import type { UserRole } from '@dmat/types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  dataRegion: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
}

/** Role groups for route guards (expand per phase). */
export const ROLE_GROUPS = {
  staff: ['proctor', 'reviewer', 'grader', 'test_center_staff', 'admin', 'program_sponsor'] as UserRole[],
  proctoring: ['proctor', 'reviewer', 'admin'] as UserRole[],
  grading: ['grader', 'admin'] as UserRole[],
  admin: ['admin', 'program_sponsor'] as UserRole[],
} as const;

export function hasRole(userRole: UserRole, allowed: readonly UserRole[]): boolean {
  return allowed.includes(userRole);
}
