import type { UserRole } from '@dmat/types';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

const TOKEN_KEY = 'dmat_access_token';

function resolveBaseUrl(): string {
  const root =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'http://localhost:3001';
  return `${root.replace(/\/$/, '')}/api/v1`;
}

function formatErrorMessage(body: { message?: string | string[] }, status: number): string {
  if (Array.isArray(body.message)) return body.message.join(', ');
  if (body.message) return body.message;
  return `Request failed: ${status}`;
}

export class ApiClient {
  private baseUrl = resolveBaseUrl();

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  /** Pick up JWT from ?token= when opening exam player from candidate portal (separate port). */
  importTokenFromUrl(): boolean {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return false;
    this.setToken(token);
    params.delete('token');
    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', next);
    return true;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(formatErrorMessage(body, res.status));
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof TypeError && String(err.message).includes('fetch')) {
        throw new Error(
          `Cannot reach API at ${this.baseUrl}. Start it with: pnpm --filter @dmat/api dev`,
        );
      }
      throw err;
    }
  }

  login(email: string, password: string) {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    countryCode: string;
    registrationCountry: string;
  }) {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  me() {
    return this.request<AuthUser>('/auth/me');
  }

  getDashboard() {
    return this.request<Record<string, unknown>>('/candidates/dashboard');
  }

  getModules() {
    return this.request<{ id: string; code: string; name: string; description?: string }[]>('/bookings/modules');
  }

  createBooking(data: { subjectModuleId: string; pathway: string; scheduledAt: string; testCenterId?: string }) {
    return this.request<Record<string, unknown>>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getBookings() {
    return this.request<Record<string, unknown>[]>('/bookings');
  }

  submitSystemCheck(bookingId: string, data: Record<string, unknown>) {
    return this.request(`/bookings/${bookingId}/system-check`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getSystemCheck(bookingId: string) {
    return this.request<Record<string, unknown>>(`/bookings/${bookingId}/system-check`);
  }

  startExam(sessionId: string) {
    return this.request<Record<string, unknown>>(`/exam/sessions/${sessionId}/start`, { method: 'POST' });
  }

  getExamSession(sessionId: string) {
    return this.request<Record<string, unknown>>(`/exam/sessions/${sessionId}`);
  }

  getExamQuestions(sessionId: string) {
    return this.request<Record<string, unknown>[]>(`/exam/sessions/${sessionId}/questions`);
  }

  saveResponse(sessionId: string, questionId: string, answerPayload: unknown) {
    return this.request(`/exam/sessions/${sessionId}/responses/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify({ answerPayload }),
    });
  }

  toggleFlag(sessionId: string, questionId: string, flagged: boolean) {
    return this.request(`/exam/sessions/${sessionId}/questions/${questionId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ flagged }),
    });
  }

  submitExam(sessionId: string) {
    return this.request(`/exam/sessions/${sessionId}/submit`, { method: 'POST' });
  }

  examHeartbeat(sessionId: string) {
    return this.request<{ status: string; timeRemainingSec: number; expired: boolean }>(
      `/exam/sessions/${sessionId}/heartbeat`,
      { method: 'POST' },
    );
  }

  logExamEvent(sessionId: string, eventType: string, description?: string) {
    return this.request(`/exam/sessions/${sessionId}/events`, {
      method: 'POST',
      body: JSON.stringify({ eventType, description }),
    });
  }

  getProctorFlags(status = 'OPEN') {
    return this.request<Record<string, unknown>[]>(`/proctoring/flags?status=${status}`);
  }

  reviewFlag(flagId: string, action: 'dismiss' | 'warn' | 'escalate', rationale?: string) {
    return this.request(`/proctoring/flags/${flagId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, rationale }),
    });
  }

  getTestCenterSession() {
    return this.request<Record<string, unknown>>('/test-centers/today');
  }

  checkIn(bookingId: string) {
    return this.request(`/test-centers/bookings/${bookingId}/check-in`, { method: 'POST' });
  }

  logIncident(bookingId: string, data: { type: string; notes: string }) {
    return this.request(`/test-centers/bookings/${bookingId}/incident`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getGradingQueue() {
    return this.request<Record<string, unknown>[]>('/grading/queue');
  }

  submitGrade(data: {
    sessionId: string;
    questionId: string;
    criteriaScores: Record<string, number>;
    totalScore: number;
    notes?: string;
  }) {
    return this.request('/grading/scores', { method: 'POST', body: JSON.stringify(data) });
  }

  getMyCertificates() {
    return this.request<Record<string, unknown>[]>('/certificates/me');
  }

  getAdminOverview(days = 30) {
    return this.request<Record<string, unknown>>(`/admin/overview?days=${days}`);
  }

  resolveProctoring(sessionId: string) {
    return this.request(`/proctoring/sessions/${sessionId}/resolve`, { method: 'POST' });
  }

  getAdminQuestions(moduleId?: string) {
    const qs = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : '';
    return this.request<Record<string, unknown>[]>(`/admin/questions${qs}`);
  }

  createAdminQuestion(data: Record<string, unknown>) {
    return this.request<Record<string, unknown>>('/admin/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  importAdminQuestions(questions: Record<string, unknown>[]) {
    return this.request<{ imported: number }>('/admin/questions/import', {
      method: 'POST',
      body: JSON.stringify({ questions }),
    });
  }

  deleteAdminQuestion(id: string) {
    return this.request(`/admin/questions/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
