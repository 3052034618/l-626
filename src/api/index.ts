import type {
  User,
  Appointment,
  BlacklistItem,
  AccessRecord,
  TimeSlot,
  DashboardStats,
  VerifyResult,
  MonthlyReportData,
  UserRole,
} from '../../shared/types';

const base = '/api';

const req = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(base + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || '请求失败');
  }
  return res.json();
};

export const api = {
  login: (phone: string, role: UserRole) =>
    req<User>('/auth/login', { method: 'POST', body: JSON.stringify({ phone, role }) }),

  getAppointments: (params?: Record<string, string | undefined>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return req<Appointment[]>('/appointments' + qs);
  },
  getAppointment: (id: string) => req<Appointment>(`/appointments/${id}`),
  createAppointment: (data: Partial<Appointment>) =>
    req<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id: string, status: string, rejectReason?: string) =>
    req<Appointment>(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectReason }),
    }),
  getTimeSlots: (date: string) => req<TimeSlot[]>(`/appointments/time-slots?date=${date}`),

  getUsers: (role?: UserRole) => req<User[]>(`/users${role ? `?role=${role}` : ''}`),

  getBlacklist: () => req<BlacklistItem[]>('/blacklist'),
  addBlacklist: (data: Partial<BlacklistItem>) =>
    req<BlacklistItem>('/blacklist', { method: 'POST', body: JSON.stringify(data) }),
  removeBlacklist: (id: string) => req<{ success: boolean }>(`/blacklist/${id}`, { method: 'DELETE' }),

  getAccessRecords: (params?: Record<string, string | undefined>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return req<AccessRecord[]>('/access' + qs);
  },
  createAccessRecord: (data: Partial<AccessRecord>) =>
    req<AccessRecord>('/access', { method: 'POST', body: JSON.stringify(data) }),
  verifyQr: (qrCode: string) => req<VerifyResult>(`/access/verify/${qrCode}`),

  getDashboardStats: () => req<DashboardStats>('/dashboard/stats'),
  getMonthlyReport: (month: string) => req<MonthlyReportData>(`/dashboard/monthly?month=${month}`),
};
