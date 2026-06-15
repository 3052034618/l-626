import { Router, type Request, type Response } from 'express';
import { store } from '../store';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, role } = req.body;
  if (!phone) {
    res.status(400).json({ error: '请输入手机号' });
    return;
  }
  if (role === 'visitor') {
    res.json({
      id: 'visitor-' + phone,
      name: '访客' + phone.slice(-4),
      phone,
      role: 'visitor',
    });
    return;
  }
  const user = store.users.find(u => u.phone === phone && u.role === role);
  if (!user) {
    res.status(401).json({ error: '账号不存在或角色不匹配' });
    return;
  }
  res.json(user);
});

export default router;
