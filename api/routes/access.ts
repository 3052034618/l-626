import { Router } from 'express';
import { store } from '../store';
import type { AccessRecord, VerifyResult } from '../../shared/types';

const router = Router();

router.get('/', (req, res) => {
  const { date, action } = req.query;
  let result = [...store.accessRecords];
  if (date) {
    result = result.filter(r => r.timestamp.slice(0, 10) === date);
  }
  if (action) result = result.filter(r => r.action === action);
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(result);
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
  const result: VerifyResult = { success: false, message: '' };

  if (!appt) {
    result.message = '二维码无效，未找到对应预约';
    return res.json(result);
  }

  const blacklisted = store.blacklist.find(b => b.visitorPhone === appt.visitorPhone);
  if (blacklisted) {
    result.isBlacklisted = true;
    result.message = `访客已被列入黑名单：${blacklisted.reason}`;
    return res.json(result);
  }

  const now = new Date();
  const expires = new Date(appt.expiresAt);
  if (now > expires) {
    result.isExpired = true;
    result.appointment = appt;
    result.message = '预约已过期，请重新预约';
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

  result.success = true;
  result.appointment = appt;
  result.message = '核验通过';
  res.json(result);
});

export default router;
