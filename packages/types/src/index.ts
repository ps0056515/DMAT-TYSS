/** Shared domain types aligned with BRD v3.0 */

export type UserRole =
  | 'candidate'
  | 'proctor'
  | 'reviewer'
  | 'grader'
  | 'test_center_staff'
  | 'admin'
  | 'program_sponsor';

export type ExamPathway = 'physical_center' | 'remote_proctored';

export type QuestionType = 'mcq' | 'figure' | 'free_text';

export type ExamSessionStatus =
  | 'scheduled'
  | 'system_check_pending'
  | 'check_in'
  | 'in_progress'
  | 'submitted'
  | 'proctoring_review'
  | 'grading'
  | 'adjudication'
  | 'certified'
  | 'invalidated';

export type ProctoringFlagSeverity = 'low' | 'medium' | 'high';

export type ProctoringFlagStatus =
  | 'open'
  | 'confirmed'
  | 'dismissed'
  | 'escalated';

export type DataRegion = 'eu-central-1' | 'ap-south-1';

export interface CertificateData {
  candidateId: string;
  scaledScore: number;
  percentileRank: number;
  issueDate: string;
  moduleBreakdown: Record<string, { raw: number; scaled: number }>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const DELIVERY_PHASES = [
  'phase-0-foundation',
  'phase-1a-public-candidate',
  'phase-1b-exam-engine',
  'phase-1c-proctoring',
  'phase-1d-grading-certificates',
] as const;

export type DeliveryPhase = (typeof DELIVERY_PHASES)[number];
