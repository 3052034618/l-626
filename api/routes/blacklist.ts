import { Router } from 'express';
import { store } from '../store';
import type { BlacklistItem } from '../../shared/types';

const router = Router();

router.get('/', (req, res) => {
  const { phone, name } = req.query;
  let result = [...store.blacklist];
  if (phone) result = result.filter(b => b.visitorPhone === phone);
  if (name) result = result.filter(b => b.visitorName.includes(String(name)));
  res.json(result);
});

router.post('/', (req, res) => {
  const { visitorName, visitorPhone, reason, addedBy } = req.body;
  if (!visitorName || !visitorPhone || !reason) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  const exists = store.blacklist.find(b => b.visitorPhone === visitorPhone);
  if (exists) return res.status(409).json({ error: '该访客已在黑名单中' });
  const item: BlacklistItem = {
    id: 'b' + Math.random().toString(36).slice(2, 10),
    visitorName,
    visitorPhone,
    reason,
    addedAt: new Date().toISOString(),
    addedBy: addedBy || 'u4',
  };
  store.blacklist.unshift(item);
  res.status(201).json(item);
});

router.delete('/:id', (req, res) => {
  const idx = store.blacklist.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '记录不存在' });
  store.blacklist.splice(idx, 1);
  res.json({ success: true });
});

export default router;
