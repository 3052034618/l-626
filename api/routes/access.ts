import { Router } from 'express';
import { store } from '../store';
import type { AccessRecord, VerifyResult } from '../../shared/types';

const router = Router();

const AUTO_APPROVE_HOURS = 24;
const autoApproveIfNeeded = (appt: any) => {
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

router.get('/', (req, res) => {
  const { date, action, department, visitorName, remark } = req.query;
  let result = [...store.accessRecords];
  if (date) {
    result = result.filter(r => r.timestamp.slice(0, 10) === date);
  }
  if (action) result = result.filter(r => r.action === action);
  if (department) {
    const deptApptIds = store.appointments
      .filter(a => a.visitedDepartment === department)
      .map(a => a.id);
    result = result.filter(r => deptApptIds.includes(r.appointmentId));
  }
  if (visitorName) {
    result = result.filter(r => r.visitorName.includes(String(visitorName)));
  }
  if (remark) {
    result = result.filter(r => r.remark && r.remark.includes(String(remark)));
  }
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(result);
});

router.get('/reject-reasons', (_req, res) => {
  const reasons = new Set<string>();
  store.accessRecords.forEach(r => {
    if (r.action === 'rejected' && r.remark) {
      reasons.add(r.remark);
    }
  });
  res.json(Array.from(reasons));
});

router.post('/', (req, res) => {
  const { appointmentId, visitorName, visitorPhone, action, operatorId, remark } = req.body;
  const record: AccessRecord = {
    id: 'r' + Math.random().toString(36).slice(2, 10),
    appointmentId,
    visitorName,
    visitorPhone,
    action,
    timestamp: new Date().toISOString(),
    operatorId: operatorId || 'u3',
    remark,
  };
  store.accessRecords.unshift(record);
  res.status(201).json(record);
});

router.get('/verify/:qrCode', (req, res) => {
  const qr = req.params.qrCode;
  const appt = store.appointments.find(a => a.qrCode === qr);
  const result: VerifyResult & { action?: 'check_in' | 'check_out' } = { success: false, message: '' };

  if (!appt) {
    result.message = '二维码无效，未找到对应预约';
    return res.json(result);
  }

  autoApproveIfNeeded(appt);

  const blacklisted = store.blacklist.find(b => b.visitorPhone === appt.visitorPhone);
  if (blacklisted) {
    result.isBlacklisted = true;
    result.appointment = appt;
    result.message = `访客已被列入黑名单：${blacklisted.reason}`;
    return res.json(result);
  }

  if (appt.status === 'pending') {
    result.appointment = appt;
    result.message = '预约待审批，请等待被访员工审批通过';
    return res.json(result);
  }

  if (appt.status === 'rejected') {
    result.appointment = appt;
    result.message = `预约已被拒绝：${appt.rejectReason || '未知原因'}`;
    return res.json(result);
  }

  if (appt.status === 'expired') {
    result.isExpired = true;
    result.appointment = appt;
    result.message = '预约已超时未到访';
    return res.json(result);
  }

  if (appt.status === 'checked_out') {
    result.appointment = appt;
    result.message = '访客已离场，本次预约已结束';
    return res.json(result);
  }

  const now = new Date();
  const expires = new Date(appt.expiresAt);

  if (appt.status === 'approved') {
    if (now > expires) {
      result.isExpired = true;
      result.appointment = appt;
      result.message = '预约已过期，请重新预约';
      return res.json(result);
    }
    result.success = true;
    result.action = 'check_in';
    result.appointment = appt;
    result.message = '核验通过，可执行入场登记';
    return res.json(result);
  }

  if (appt.status === 'checked_in') {
    result.success = true;
    result.action = 'check_out';
    result.appointment = appt;
    result.message = '访客已入场，可执行离场登记';
    return res.json(result);
  }

  result.appointment = appt;
  result.message = '预约状态异常，请联系管理员';
  res.json(result);
});

export default router;
