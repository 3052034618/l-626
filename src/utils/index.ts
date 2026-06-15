import type { AppointmentStatus } from '../../shared/types';

export const statusLabels: Record<AppointmentStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  expired: '已过期',
  checked_in: '已入场',
  checked_out: '已离场',
};

export const statusColors: Record<AppointmentStatus, string> = {
  pending: 'bg-warning-100 text-warning-500 border-warning-200',
  approved: 'bg-accent-100 text-accent-600 border-accent-200',
  rejected: 'bg-red-100 text-red-600 border-red-200',
  expired: 'bg-ink-100 text-ink-500 border-ink-200',
  checked_in: 'bg-primary-100 text-primary-700 border-primary-200',
  checked_out: 'bg-ink-200 text-ink-700 border-ink-300',
};

export const formatDateTime = (iso: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const todayStr = () => {
  const d = new Date('2026-06-15');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
