import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Users, Shield, UserCog, ArrowRight, Building2 } from 'lucide-react';
import type { UserRole } from '@shared/types';
import { api } from '../api';
import { useAuthStore, roleLabels } from '../store/auth';

const roles: { key: UserRole; label: string; desc: string; icon: React.ElementType; demoPhone: string }[] = [
  { key: 'visitor', label: '访客', desc: '在线预约、查看预约', icon: UserRound, demoPhone: '' },
  { key: 'employee', label: '员工', desc: '审批访客、转派处理', icon: Users, demoPhone: '13800000001' },
  { key: 'security', label: '保安', desc: '扫码核验、记录出入', icon: Shield, demoPhone: '13900000001' },
  { key: 'admin', label: '管理员', desc: '全局管理、数据报表', icon: UserCog, demoPhone: '13700000001' },
];

const roleHome: Record<UserRole, string> = {
  visitor: '/visitor/appointment',
  employee: '/approval',
  security: '/dashboard',
  admin: '/dashboard',
};

export default function Login() {
  const [role, setRole] = useState<UserRole>('visitor');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleRole = (r: UserRole) => {
    setRole(r);
    setPhone(roles.find(x => x.key === r)?.demoPhone || '');
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('请输入手机号');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await api.login(phone, role);
      login(user);
      navigate(roleHome[role], { replace: true });
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-primary-400/20 blur-3xl animate-pulse-slow" />

      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white animate-fade-up">
            <div className="flex items-center gap-3 mb-6 animate-fade-up animate-stagger-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-400 flex items-center justify-center shadow-glow">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">访客管理平台</h1>
                <p className="text-primary-200 text-sm mt-0.5">Enterprise Visitor System</p>
              </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4 animate-fade-up animate-stagger-2">
              智能化<br />
              <span className="text-gradient">访客预约与出入管理</span>
            </h2>
            <p className="text-primary-200 text-base leading-relaxed mb-8 animate-fade-up animate-stagger-3">
              整合在线预约、审批流转、通行核验与数据追溯全链路，
              让企业访客管理更高效、更安全、更智能。
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-up animate-stagger-4">
              {['智能时段推荐', '二维码通行', '黑名单拦截', '实时数据大屏'].map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-accent-100 border border-white/10">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-up animate-stagger-2">
            <h3 className="text-xl font-bold text-ink-800 mb-2">欢迎登录</h3>
            <p className="text-sm text-ink-500 mb-6">请选择您的身份并输入手机号</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = role === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => handleRole(r.key)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      active
                        ? 'border-primary-600 bg-primary-50 shadow-md'
                        : 'border-ink-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${active ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-500'}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className={`font-bold text-sm ${active ? 'text-primary-700' : 'text-ink-700'}`}>{r.label}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{r.desc}</div>
                    {active && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={submit}>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                手机号 {role !== 'visitor' && <span className="text-ink-400 font-normal">（演示号已预填）</span>}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white text-ink-800 placeholder:text-ink-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
              {error && (
                <div className="mt-2 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold text-base shadow-lg shadow-primary-700/30 hover:shadow-xl hover:shadow-primary-700/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? '登录中...' : `以${roleLabels[role]}身份登录`}
                <ArrowRight className="w-4 h-4" />
              </button>
              {role === 'visitor' && (
                <p className="mt-3 text-xs text-center text-ink-400">访客可直接输入任意手机号进入预约系统</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
