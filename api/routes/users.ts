import { Router } from 'express';
import { store } from '../store';

const router = Router();

router.get('/', (req, res) => {
  const { role } = req.query;
  let result = [...store.users];
  if (role) result = result.filter(u => u.role === role);
  res.json(result);
});

export default router;
