import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuthStore, roleLabels } from '../store/auth';
import type { UserRole } from '@shared/types';
import {
  LayoutDashboard,
  CalendarPlus,
  ClipboardList,
  ScanLine,
  ShieldAlert,
  FileBarChart,
  Settings,
  LogOut,
  Building2,
  User,
  Logs,
} from 'lucide-react';

interface Props {
  allowedRoles: UserRole[];
}

const menuByRole: Record<UserRole, { path: string; label: string; icon: React.ElementType }[]> = {
  visitor: [
    { path: '/visitor/appointment', label: '访客预约', icon: CalendarPlus },
    { path: '/visitor/my-appointments', label: '我的预约', icon: ClipboardList },
  ],
  employee: [
    { path: '/approval', label: '审批中心', icon: ClipboardList },
  ],
  security: [
    { path: '/dashboard', label: '数据大屏', icon: LayoutDashboard },
    { path: '/security/verify', label: '扫码核验', icon: ScanLine },
    { path: '/security/records', label: '出入记录', icon: Logs },
  ],
  admin: [
    { path: '/dashboard', label: '数据大屏', icon: LayoutDashboard },
    { path: '/approval', label: '审批中心', icon: ClipboardList },
    { path: '/security/verify', label: '扫码核验', icon: ScanLine },
    { path: '/security/records', label: '出入记录', icon: Logs },
    { path: '/admin/blacklist', label: '黑名单管理', icon: ShieldAlert },
    { path: '/admin/reports', label: '数据报表', icon: FileBarChart },
    { path: '/admin/settings', label: '系统设置', icon: Settings },
  ],
};

export default function AppLayout({ allowedRoles }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/403" replace />;

  const menus = menuByRole[user.role] || [];

  return (
    <div className="flex h-screen bg-ink-50">
      <aside className="w-60 bg-white border-r border-ink-200 flex flex-col">
        <div className="px-5 py-5 border-b border-ink-100 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent flex items-center justify-center shadow-glow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-ink-800 text-base leading-tight">访客管理</div>
            <div className="text-xs text-ink-400">Visitor Platform</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menus.map((m) => {
            const active = location.pathname.startsWith(m.path);
            const Icon = m.icon;
            return (
              <Link
                key={m.path}
                to={m.path}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-700 text-white shadow-md shadow-primary-700/30'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-800'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {m.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-ink-100">
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg bg-ink-50">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink-800 truncate">{user.name}</div>
              <div className="text-xs text-ink-400">{roleLabels[user.role]}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}
