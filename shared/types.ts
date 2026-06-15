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

export interface TransferHistoryItem {
  id: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  fromDepartment: string;
  toEmployeeId: string;
  toEmployeeName: string;
  toDepartment: string;
  operatorId: string;
  operatorName: string;
  transferredAt: string;
}

export interface RescheduleHistoryItem {
  id: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  rescheduledAt: string;
  rescheduledBy: string;
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
  autoApproved?: boolean;
  transferFrom?: string;
  transferHistory?: TransferHistoryItem[];
  rescheduleHistory?: RescheduleHistoryItem[];
  originalEmployeeId?: string;
  originalEmployeeName?: string;
  cancelledAt?: string;
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
  action?: 'check_in' | 'check_out';
}

export interface MonthlyReportData {
  totalAppointments: number;
  totalVisited: number;
  totalRejected: number;
  totalAutoApproved: number;
  totalExpired: number;
  averageApprovalTime: number;
  byDepartment: { department: string; count: number; visited: number; rejected: number }[];
  byEmployee: { employeeId: string; employeeName: string; department: string; count: number; visited: number; rejected: number }[];
  byDay: { date: string; count: number; visited: number; rejected: number }[];
  byRejectReason: { reason: string; count: number }[];
  topVisitors: { name: string; count: number }[];
  appointments: Appointment[];
  accessRecords: AccessRecord[];
}
