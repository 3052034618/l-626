import { useEffect, useState } from 'react';
import { Check, X, Clock, Users, Calendar, MessageSquare, ArrowRightLeft, AlertTriangle, Search, Filter } from 'lucide-react';
import type { Appointment, User as UserT } from '@shared/types';
import { api } from '../api';
import { statusLabels, statusColors, formatDateTime } from '../utils';
import { useAuthStore } from '../store/auth';

export default function ApprovalCenter() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [list, setList] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<UserT[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectAppt, setRejectAppt] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [transferAppt, setTransferAppt] = useState<Appointment | null>(null);
  const [transferTo, setTransferTo] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (user.role === 'employee') {
        params.employeeId = user.id;
        if (user.department) params.department = user.department;
      }
      if (tab) params.status = tab;
      const data = await api.getAppointments(params);
      setList(data);
      const emps = await api.getUsers('employee');
      setEmployees(emps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab, user]);

  const approve = async (id: string) => {
    await api.updateAppointmentStatus(id, 'approved');
    load();
  };

  const confirmReject = async () => {
    if (!rejectAppt) return;
    await api.updateAppointmentStatus(rejectAppt.id, 'rejected', rejectReason || '不便于接待');
    setRejectAppt(null);
    setRejectReason('');
    load();
  };

  const confirmTransfer = async () => {
    if (!transferAppt || !transferTo) return;
    const target = employees.find((e) => e.id === transferTo);
    if (target) {
      await api.updateAppointmentStatus(transferAppt.id, 'approved');
    }
    setTransferAppt(null);
    setTransferTo('');
    load();
  };

  const filtered = list.filter((a) =>
    !search || a.visitorName.includes(search) || a.visitedEmployeeName.includes(search)
  );

  const tabs = [
    { key: 'pending' as const, label: '待审批', icon: Clock },
    { key: 'approved' as const, label: '已通过', icon: Check },
    { key: 'rejected' as const, label: '已拒绝', icon: X },
  ];

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-primary-700" />
            审批中心
          </h1>
          <p className="text-ink-500 mt-1 text-sm">
            超过 24 小时未处理的申请将自动通过
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-up animate-stagger-1">
          <div className="flex items-center justify-between border-b border-ink-100 px-4">
            <div className="flex">
              {tabs.map((t) => {
                const Icon = t.icon;
                const count = list.filter((a) => a.status === t.key).length;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative px-6 py-4 text-sm font-bold flex items-center gap-2 transition-colors ${
                      tab === t.key ? 'text-primary-700' : 'text-ink-500 hover:text-ink-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {count > 0 && (
                      <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                        tab === t.key ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-500'
                      }`}>
                        {count}
                      </span>
                    )}
                    {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700 rounded-t" />}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索访客/员工"
                className="pl-9 pr-4 py-2 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:bg-white focus:border-primary-400 outline-none transition-all w-56"
              />
            </div>
          </div>

          <div className="divide-y divide-ink-100 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse bg-ink-50" />)
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-ink-100 flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-ink-400" />
                </div>
                <div className="text-ink-500">暂无{tabs.find((t) => t.key === tab)?.label}记录</div>
              </div>
            ) : (
              filtered.map((a, i) => (
                <div key={a.id} className="p-5 hover:bg-ink-50/60 transition-colors animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h3 className="font-bold text-ink-800">{a.visitorName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColors[a.status]}`}>
                          {statusLabels[a.status]}
                        </span>
                        <span className="text-xs text-ink-400 font-mono">{a.visitorPhone}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-ink-500 mb-2">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />访 {a.visitedEmployeeName} · {a.visitedDepartment}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{a.appointmentDate} {a.appointmentTime}</span>
                      </div>
                      <p className="text-sm text-ink-600 bg-ink-50 rounded-lg px-3 py-2 inline-block max-w-full">
                        <span className="text-ink-400 mr-1.5">事由：</span>{a.purpose}
                      </p>
                      {a.rejectReason && (
                        <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 inline-block">
                          <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                          拒绝原因：{a.rejectReason}
                        </p>
                      )}
                    </div>

                    {tab === 'pending' && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setTransferAppt(a)}
                          className="px-3.5 py-2 rounded-lg border border-ink-200 text-ink-600 text-sm font-medium hover:bg-ink-50 flex items-center gap-1.5 transition-colors"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          转派
                        </button>
                        <button
                          onClick={() => setRejectAppt(a)}
                          className="px-3.5 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          拒绝
                        </button>
                        <button
                          onClick={() => approve(a.id)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent to-accent-400 text-white text-sm font-bold shadow-md shadow-accent/30 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          通过
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {rejectAppt && (
        <Modal onClose={() => setRejectAppt(null)} title="拒绝来访申请">
          <p className="text-sm text-ink-500 mb-4">请填写拒绝原因，系统将通知访客</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="请输入拒绝原因"
            className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none text-sm"
          />
          <div className="flex gap-3 mt-5">
            <button onClick={() => setRejectAppt(null)} className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50">
              取消
            </button>
            <button onClick={confirmReject} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">
              确认拒绝
            </button>
          </div>
        </Modal>
      )}

      {transferAppt && (
        <Modal onClose={() => setTransferAppt(null)} title="转派审批">
          <p className="text-sm text-ink-500 mb-4">选择要转派的员工，将由其处理此审批</p>
          <select
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
          >
            <option value="">请选择员工</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} · {e.department}</option>
            ))}
          </select>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setTransferAppt(null)} className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50">
              取消
            </button>
            <button
              onClick={confirmTransfer}
              disabled={!transferTo}
              className="flex-1 py-2.5 rounded-xl bg-primary-700 text-white font-bold hover:bg-primary-800 disabled:opacity-50 transition-colors"
            >
              确认转派
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-up">
        <h3 className="text-lg font-bold text-ink-800 mb-1">{title}</h3>
        {children}
      </div>
    </div>
  );
}
