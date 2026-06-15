import { Router } from 'express';
import { store } from '../store';
import type { Appointment, TimeSlot, AppointmentStatus, TransferHistoryItem, RescheduleHistoryItem } from '../../shared/types';

const router = Router();

const genId = () => 'a' + Math.random().toString(36).slice(2, 10);
const genQr = () => 'QR-VISITOR-' + Math.random().toString(36).slice(2, 10).toUpperCase();
const genRecordId = () => (prefix: string) => prefix + Math.random().toString(36).slice(2, 10);

const AUTO_APPROVE_HOURS = 24;

const autoApproveIfNeeded = (appt: Appointment): boolean => {
  if (appt.status !== 'pending') return false;
  const created = new Date(appt.createdAt).getTime();
  const now = Date.now();
  if (now - created > AUTO_APPROVE_HOURS * 60 * 60 * 1000) {
    appt.status = 'approved';
    appt.approvedAt = new Date(created + AUTO_APPROVE_HOURS * 60 * 60 * 1000).toISOString();
    appt.autoApproved = true;
    return true;
  }
  return false;
};

const autoExpireIfNeeded = (appt: Appointment): boolean => {
  if (appt.status === 'checked_in' || appt.status === 'checked_out' || appt.status === 'rejected') return false;
  const expires = new Date(appt.expiresAt).getTime();
  const now = Date.now();
  if (now > expires && appt.status !== 'expired') {
    appt.status = 'expired';
    return true;
  }
  return false;
};

const processAppointments = (list: Appointment[]) => {
  list.forEach((a) => {
    autoApproveIfNeeded(a);
    autoExpireIfNeeded(a);
  });
  return list;
};

router.get('/', (req, res) => {
  const { date, department, visitorName, status, phone, employeeId, scope, category } = req.query;
  let result = [...store.appointments];

  processAppointments(result);

  if (date) result = result.filter(a => a.appointmentDate === date);
  if (department) result = result.filter(a => a.visitedDepartment === department);
  if (visitorName) result = result.filter(a => a.visitorName.includes(String(visitorName)));
  if (status) result = result.filter(a => a.status === status);
  if (phone) result = result.filter(a => a.visitorPhone === phone);
  if (employeeId) {
    if (scope === 'department') {
      const emp = store.users.find(u => u.id === employeeId);
      if (emp && emp.department) {
        result = result.filter(a => a.visitedDepartment === emp.department);
        if (category === 'assigned') {
          result = result.filter(a => a.visitedEmployeeId === employeeId && !a.transferFrom);
        } else if (category === 'transferred') {
          result = result.filter(a => a.visitedEmployeeId === employeeId && !!a.transferFrom);
        } else if (category === 'shared') {
          result = result.filter(a => a.visitedEmployeeId !== employeeId);
        }
      }
    } else {
      result = result.filter(a => a.visitedEmployeeId === employeeId);
    }
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(result);
});

router.get('/time-slots', (req, res) => {
  const { date } = req.query;
  const targetDate = date ? String(date) : new Date().toISOString().slice(0, 10);
  const slots: TimeSlot[] = [];

  const appts = processAppointments([...store.appointments]);

  for (let h = 9; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 12 && m >= 0) continue;
      if (h === 13) continue;
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const count = appts.filter(
        a => a.appointmentDate === targetDate && a.appointmentTime === time && a.status !== 'rejected' && a.status !== 'expired'
      ).length;
      let density: 'low' | 'medium' | 'high' = 'low';
      if (count >= 3) density = 'high';
      else if (count >= 1) density = 'medium';
      slots.push({ time, available: count < 5, density, count });
    }
  }
  res.json(slots);
});

router.get('/:id', (req, res) => {
  const appt = store.appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ error: '预约不存在' });
  autoApproveIfNeeded(appt);
  autoExpireIfNeeded(appt);
  res.json(appt);
});

router.post('/', (req, res) => {
  const { visitorName, visitorPhone, visitedEmployeeId, purpose, appointmentDate, appointmentTime } = req.body;
  if (!visitorName || !visitorPhone || !visitedEmployeeId || !purpose || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  const blacklisted = store.blacklist.find(b => b.visitorPhone === visitorPhone);
  if (blacklisted) {
    return res.status(403).json({ error: `您已被列入黑名单，原因：${blacklisted.reason}`, blacklisted: true });
  }
  const employee = store.users.find(u => u.id === visitedEmployeeId);
  if (!employee) return res.status(400).json({ error: '被访员工不存在' });

  const createdAt = new Date().toISOString();
  const [h, m] = appointmentTime.split(':').map(Number);
  const expiresAt = new Date(appointmentDate);
  expiresAt.setHours(h, m + 15, 0, 0);

  const appt: Appointment = {
    id: genId(),
    visitorName,
    visitorPhone,
    visitedEmployeeId,
    visitedEmployeeName: employee.name,
    visitedDepartment: employee.department || '未分配',
    purpose,
    appointmentDate,
    appointmentTime,
    status: 'pending',
    qrCode: genQr(),
    createdAt,
    expiresAt: expiresAt.toISOString(),
    originalEmployeeId: employee.id,
    originalEmployeeName: employee.name,
    transferHistory: [],
    rescheduleHistory: [],
  };
  store.appointments.unshift(appt);
  res.status(201).json(appt);
});

router.put('/:id/status', (req, res) => {
  const appt = store.appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ error: '预约不存在' });
  const { status, rejectReason } = req.body;
  const newStatus = status as AppointmentStatus;

  if (newStatus === 'checked_in' && appt.status === 'checked_in') {
    return res.status(400).json({ error: '访客已入场，请勿重复操作' });
  }
  if (newStatus === 'checked_out' && appt.status !== 'checked_in') {
    return res.status(400).json({ error: '访客尚未入场，无法执行离场操作' });
  }

  appt.status = newStatus;
  if (newStatus === 'approved' && !appt.approvedAt) {
    appt.approvedAt = new Date().toISOString();
  }
  if (newStatus === 'rejected' && rejectReason) {
    appt.rejectReason = rejectReason;
  }
  if (newStatus === 'checked_in' && !appt.checkedInAt) {
    appt.checkedInAt = new Date().toISOString();
  }
  if (newStatus === 'checked_out' && !appt.checkedOutAt) {
    appt.checkedOutAt = new Date().toISOString();
  }
  res.json(appt);
});

router.put('/:id/transfer', (req, res) => {
  const appt = store.appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ error: '预约不存在' });
  const { targetEmployeeId, operatorId } = req.body;
  if (!targetEmployeeId) return res.status(400).json({ error: '请选择目标员工' });

  const target = store.users.find(u => u.id === targetEmployeeId);
  if (!target) return res.status(400).json({ error: '目标员工不存在' });
  const operator = store.users.find(u => u.id === operatorId);

  const transferRecord: TransferHistoryItem = {
    id: 't' + Math.random().toString(36).slice(2, 10),
    fromEmployeeId: appt.visitedEmployeeId,
    fromEmployeeName: appt.visitedEmployeeName,
    fromDepartment: appt.visitedDepartment,
    toEmployeeId: target.id,
    toEmployeeName: target.name,
    toDepartment: target.department || '未分配',
    operatorId: operatorId || '',
    operatorName: operator?.name || '系统',
    transferredAt: new Date().toISOString(),
  };

  if (!appt.transferHistory) appt.transferHistory = [];
  appt.transferHistory.push(transferRecord);
  appt.visitedEmployeeId = target.id;
  appt.visitedEmployeeName = target.name;
  appt.visitedDepartment = target.department || '未分配';
  appt.status = 'pending';
  appt.approvedAt = undefined;
  appt.autoApproved = false;
  appt.rejectReason = undefined;
  appt.transferFrom = operatorId;

  res.json(appt);
});

router.put('/:id/reschedule', (req, res) => {
  const appt = store.appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ error: '预约不存在' });
  if (appt.status === 'checked_in' || appt.status === 'checked_out') {
    return res.status(400).json({ error: '访客已入场，无法改期' });
  }
  if (appt.status === 'rejected' || appt.status === 'expired') {
    return res.status(400).json({ error: '预约已被拒绝或已过期，无法改期' });
  }

  const { appointmentDate, appointmentTime, operatorId } = req.body;
  if (!appointmentDate || !appointmentTime) {
    return res.status(400).json({ error: '请选择新的预约日期和时间' });
  }

  const rescheduleRecord: RescheduleHistoryItem = {
    id: 'rs' + Math.random().toString(36).slice(2, 10),
    oldDate: appt.appointmentDate,
    oldTime: appt.appointmentTime,
    newDate: appointmentDate,
    newTime: appointmentTime,
    rescheduledAt: new Date().toISOString(),
    rescheduledBy: operatorId || appt.visitorPhone,
  };
  if (!appt.rescheduleHistory) appt.rescheduleHistory = [];
  appt.rescheduleHistory.push(rescheduleRecord);

  appt.appointmentDate = appointmentDate;
  appt.appointmentTime = appointmentTime;
  const [h, m] = appointmentTime.split(':').map(Number);
  const expiresAt = new Date(appointmentDate);
  expiresAt.setHours(h, m + 15, 0, 0);
  appt.expiresAt = expiresAt.toISOString();
  appt.qrCode = genQr();
  appt.status = 'pending';
  appt.approvedAt = undefined;
  appt.autoApproved = false;
  appt.rejectReason = undefined;
  appt.checkedInAt = undefined;
  appt.checkedOutAt = undefined;

  res.json(appt);
});

router.put('/:id/cancel', (req, res) => {
  const appt = store.appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ error: '预约不存在' });
  if (appt.status === 'checked_in' || appt.status === 'checked_out') {
    return res.status(400).json({ error: '访客已入场，无法取消' });
  }
  appt.status = 'rejected';
  appt.rejectReason = '访客主动取消';
  appt.cancelledAt = new Date().toISOString();
  res.json(appt);
});

export default router;
