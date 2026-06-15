import { Router } from 'express';
import { store } from '../store';
import type { DashboardStats, MonthlyReportData } from '../../shared/types';

const router = Router();

router.get('/stats', (_req, res) => {
  const today = '2026-06-15';
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
  const { month, department, visitorName } = req.query;
  const targetMonth = month ? String(month) : '2026-06';

  let monthAppts = store.appointments.filter(a => a.appointmentDate.startsWith(targetMonth));

  if (department) {
    monthAppts = monthAppts.filter(a => a.visitedDepartment === department);
  }
  if (visitorName) {
    monthAppts = monthAppts.filter(a => a.visitorName.includes(String(visitorName)));
  }

  const totalAppointments = monthAppts.length;
  const totalVisited = monthAppts.filter(a => a.status === 'checked_in' || a.status === 'checked_out').length;
  const totalRejected = monthAppts.filter(a => a.status === 'rejected').length;

  const approved = monthAppts.filter(a => a.approvedAt && a.createdAt);
  const avgTime = approved.length > 0
    ? approved.reduce((s, a) => s + (new Date(a.approvedAt!).getTime() - new Date(a.createdAt).getTime()) / 3600000, 0) / approved.length
    : 0;

  const deptMap = new Map<string, number>();
  monthAppts.forEach(a => deptMap.set(a.visitedDepartment, (deptMap.get(a.visitedDepartment) || 0) + 1));
  const byDepartment = Array.from(deptMap.entries())
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  const dayMap = new Map<string, number>();
  monthAppts.forEach(a => dayMap.set(a.appointmentDate, (dayMap.get(a.appointmentDate) || 0) + 1));
  const byDay = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

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
    averageApprovalTime: Math.round(avgTime * 10) / 10,
    byDepartment,
    byDay,
    topVisitors,
  };
  res.json(data);
});

export default router;
