import { Router } from 'express';
import { store } from '../store';
import type { DashboardStats, MonthlyReportData, Appointment } from '../../shared/types';

const router = Router();

const AUTO_APPROVE_HOURS = 24;
const autoApproveIfNeeded = (appt: Appointment) => {
  if (appt.status !== 'pending') return false;
  const created = new Date(appt.createdAt).getTime();
  if (Date.now() - created > AUTO_APPROVE_HOURS * 60 * 60 * 1000) {
    appt.status = 'approved';
    appt.approvedAt = new Date(created + AUTO_APPROVE_HOURS * 60 * 60 * 1000).toISOString();
    appt.autoApproved = true;
    return true;
  }
  return false;
};

router.get('/stats', (_req, res) => {
  const today = '2026-06-15';
  store.appointments.forEach(autoApproveIfNeeded);
  const todayAppts = store.appointments.filter(a => a.appointmentDate === today);
  const todayVisited = todayAppts.filter(a => a.status === 'checked_in' || a.status === 'checked_out').length;
  const todayRejected = store.accessRecords.filter(
    r => r.action === 'rejected' && r.timestamp.slice(0, 10) === today
  ).length;
  const pendingApprovals = store.appointments.filter(a => a.status === 'pending').length;

  const hourlyTrend = [];
  for (let h = 8; h <= 18; h++) {
    const hour = `${String(h).padStart(2, '0')}:00`;
    const count = todayAppts.filter(a => {
      const ah = parseInt(a.appointmentTime.split(':')[0]);
      return ah === h;
    }).length;
    hourlyTrend.push({ hour, count });
  }

  const deptMap = new Map<string, number>();
  todayAppts.forEach(a => {
    deptMap.set(a.visitedDepartment, (deptMap.get(a.visitedDepartment) || 0) + 1);
  });
  const departmentRank = Array.from(deptMap.entries())
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  const stats: DashboardStats = {
    todayAppointments: todayAppts.length,
    todayVisited,
    todayRejected,
    pendingApprovals,
    hourlyTrend,
    departmentRank,
  };
  res.json(stats);
});

router.get('/monthly', (req, res) => {
  const { month, department, visitorName, employeeId, rejectReason } = req.query;
  const targetMonth = month ? String(month) : '2026-06';

  store.appointments.forEach(autoApproveIfNeeded);

  let monthAppts = store.appointments.filter(a => a.appointmentDate.startsWith(targetMonth));
  let monthRecords = store.accessRecords.filter(r => r.timestamp.startsWith(targetMonth.slice(0, 7)));

  if (department) {
    monthAppts = monthAppts.filter(a => a.visitedDepartment === department);
    const deptApptIds = monthAppts.map(a => a.id);
    monthRecords = monthRecords.filter(r => deptApptIds.includes(r.appointmentId));
  }
  if (visitorName) {
    monthAppts = monthAppts.filter(a => a.visitorName.includes(String(visitorName)));
    monthRecords = monthRecords.filter(r => r.visitorName.includes(String(visitorName)));
  }
  if (employeeId) {
    monthAppts = monthAppts.filter(a => a.visitedEmployeeId === employeeId);
  }
  if (rejectReason) {
    monthRecords = monthRecords.filter(r => r.action === 'rejected' && r.remark && r.remark.includes(String(rejectReason)));
    const rejectedApptIds = monthRecords.map(r => r.appointmentId);
    monthAppts = monthAppts.filter(a => a.status === 'rejected' || rejectedApptIds.includes(a.id));
  }

  const totalAppointments = monthAppts.length;
  const totalVisited = monthAppts.filter(a => a.status === 'checked_in' || a.status === 'checked_out').length;
  const totalRejected = monthAppts.filter(a => a.status === 'rejected').length;
  const totalAutoApproved = monthAppts.filter(a => a.autoApproved).length;
  const totalExpired = monthAppts.filter(a => a.status === 'expired').length;

  const approved = monthAppts.filter(a => a.approvedAt && a.createdAt);
  const avgTime = approved.length > 0
    ? approved.reduce((s, a) => s + (new Date(a.approvedAt!).getTime() - new Date(a.createdAt).getTime()) / 3600000, 0) / approved.length
    : 0;

  const deptStats = new Map<string, { count: number; visited: number; rejected: number }>();
  monthAppts.forEach(a => {
    const d = a.visitedDepartment;
    if (!deptStats.has(d)) deptStats.set(d, { count: 0, visited: 0, rejected: 0 });
    const s = deptStats.get(d)!;
    s.count++;
    if (a.status === 'checked_in' || a.status === 'checked_out') s.visited++;
    if (a.status === 'rejected') s.rejected++;
  });
  const byDepartment = Array.from(deptStats.entries())
    .map(([department, s]) => ({ department, ...s }))
    .sort((a, b) => b.count - a.count);

  const empStats = new Map<string, { employeeId: string; employeeName: string; department: string; count: number; visited: number; rejected: number }>();
  monthAppts.forEach(a => {
    if (!empStats.has(a.visitedEmployeeId)) {
      empStats.set(a.visitedEmployeeId, {
        employeeId: a.visitedEmployeeId,
        employeeName: a.visitedEmployeeName,
        department: a.visitedDepartment,
        count: 0, visited: 0, rejected: 0,
      });
    }
    const s = empStats.get(a.visitedEmployeeId)!;
    s.count++;
    if (a.status === 'checked_in' || a.status === 'checked_out') s.visited++;
    if (a.status === 'rejected') s.rejected++;
  });
  const byEmployee = Array.from(empStats.values()).sort((a, b) => b.count - a.count);

  const dayStats = new Map<string, { count: number; visited: number; rejected: number }>();
  monthAppts.forEach(a => {
    const d = a.appointmentDate;
    if (!dayStats.has(d)) dayStats.set(d, { count: 0, visited: 0, rejected: 0 });
    const s = dayStats.get(d)!;
    s.count++;
    if (a.status === 'checked_in' || a.status === 'checked_out') s.visited++;
    if (a.status === 'rejected') s.rejected++;
  });
  const byDay = Array.from(dayStats.entries())
    .map(([date, s]) => ({ date, ...s }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const reasonMap = new Map<string, number>();
  monthAppts.filter(a => a.status === 'rejected' && a.rejectReason).forEach(a => {
    reasonMap.set(a.rejectReason!, (reasonMap.get(a.rejectReason!) || 0) + 1);
  });
  monthRecords.filter(r => r.action === 'rejected' && r.remark).forEach(r => {
    reasonMap.set(r.remark!, (reasonMap.get(r.remark!) || 0) + 1);
  });
  const byRejectReason = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const visitorMap = new Map<string, number>();
  monthAppts.forEach(a => visitorMap.set(a.visitorName, (visitorMap.get(a.visitorName) || 0) + 1));
  const topVisitors = Array.from(visitorMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const data: MonthlyReportData = {
    totalAppointments,
    totalVisited,
    totalRejected,
    totalAutoApproved,
    totalExpired,
    averageApprovalTime: Math.round(avgTime * 10) / 10,
    byDepartment,
    byEmployee,
    byDay,
    byRejectReason,
    topVisitors,
    appointments: monthAppts,
    accessRecords: monthRecords,
  };
  res.json(data);
});

export default router;
