import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import VisitorAppointment from '@/pages/VisitorAppointment';
import MyAppointments from '@/pages/MyAppointments';
import ApprovalCenter from '@/pages/ApprovalCenter';
import Verify from '@/pages/Verify';
import AccessRecords from '@/pages/AccessRecords';
import Blacklist from '@/pages/Blacklist';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import AppLayout from '@/components/AppLayout';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<AppLayout allowedRoles={['visitor', 'employee', 'security', 'admin']} />}>
          <Route path="/visitor/appointment" element={<VisitorAppointment />} />
          <Route path="/visitor/my-appointments" element={<MyAppointments />} />
        </Route>

        <Route element={<AppLayout allowedRoles={['employee', 'admin']} />}>
          <Route path="/approval" element={<ApprovalCenter />} />
        </Route>

        <Route element={<AppLayout allowedRoles={['security', 'admin']} />}>
          <Route path="/security/verify" element={<Verify />} />
          <Route path="/security/records" element={<AccessRecords />} />
        </Route>

        <Route element={<AppLayout allowedRoles={['admin', 'security']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route element={<AppLayout allowedRoles={['admin']} />}>
          <Route path="/admin/blacklist" element={<Blacklist />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>

        <Route path="/403" element={
          <div className="min-h-screen flex items-center justify-center bg-ink-50">
            <div className="text-center">
              <div className="text-8xl font-black text-primary-100 mb-2">403</div>
              <h1 className="text-2xl font-bold text-ink-800 mb-2">无权限访问</h1>
              <p className="text-ink-500 mb-6">您的账号没有权限访问该页面</p>
              <a href="/login" className="inline-block px-6 py-2.5 rounded-xl bg-primary-700 text-white font-bold hover:bg-primary-800">返回登录</a>
            </div>
          </div>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
