import { UserRole as PrismaRole } from '@dmat/database';
import type { UserRole } from '@dmat/types';

export function toRole(role: PrismaRole): UserRole {
  const map: Record<PrismaRole, UserRole> = {
    CANDIDATE: 'candidate',
    PROCTOR: 'proctor',
    REVIEWER: 'reviewer',
    GRADER: 'grader',
    TEST_CENTER_STAFF: 'test_center_staff',
    ADMIN: 'admin',
    PROGRAM_SPONSOR: 'program_sponsor',
  };
  return map[role] ?? 'candidate';
}
