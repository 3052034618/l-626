export type UserRole = 'visitor' | 'employee' | 'security' | 'admin';

export type AppointmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'checked_in'
  | 'checked_out';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  department?: string;
}

export interface Appointment {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitedEmployeeId: string;
  visitedEmployeeName: string;
  visitedDepartment: string;
  purpose: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  qrCode: string;
  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  rejectReason?: string;
}

export interface BlacklistItem {
  id: string;
  visitorName: string;
  visitorPhone: string;
  reason: string;
  addedAt: string;
  addedBy: string;
}

export interface AccessRecord {
  id: string;
  appointmentId: string;
  visitorName: string;
  visitorPhone: string;
  action: 'check_in' | 'check_out' | 'rejected';
  timestamp: string;
  operatorId: string;
  remark?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  density: 'low' | 'medium' | 'high';
  count: number;
}

export interface DashboardStats {
  todayAppointments: number;
  todayVisited: number;
  todayRejected: number;
  pendingApprovals: number;
  hourlyTrend: { hour: string; count: number }[];
  departmentRank: { department: string; count: number }[];
}

export interface VerifyResult {
  success: boolean;
  appointment?: Appointment;
  message: string;
  isBlacklisted?: boolean;
  isExpired?: boolean;
}

export interface MonthlyReportData {
  totalAppointments: number;
  totalVisited: number;
  totalRejected: number;
  averageApprovalTime: number;
  byDepartment: { department: string; count: number }[];
  byDay: { date: string; count: number }[];
  topVisitors: { name: string; count: number }[];
}
