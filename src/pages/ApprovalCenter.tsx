import { useEffect, useState } from 'react';
import {
  Check, X, Clock, Users, Calendar, MessageSquare, ArrowRightLeft, AlertTriangle,
  Search, Building2, Zap, UserRound, Layers, History, RefreshCcw, XCircle
} from 'lucide-react';
import type { Appointment, User as UserT, TransferHistoryItem, RescheduleHistoryItem } from '@shared/types';
import { api } from '../api';
import { statusLabels, statusColors, formatDateTime } from '../utils';
import { useAuthStore } from '../store/auth';

type Category = 'all' | 'assigned' | 'transferred' | 'shared';

export default function ApprovalCenter() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [category, setCategory] = useState<Category>('all');
  const [list, setList] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<UserT[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectAppt, setRejectAppt] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [transferAppt, setTransferAppt] = useState<Appointment | null>(null);
  const [transferTo, setTransferTo] = useState('');
  const [search, setSearch] = useState('');
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (!isAdmin) {
        params.employeeId = user.id;
        params.scope = 'department';
        if (category !== 'all') params.category = category;
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

  useEffect(() => { load(); }, [tab, category, user]);

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
    if (!transferAppt || !transferTo || !user) return;
    await api.transferAppointment(transferAppt.id, transferTo, user.id);
    setTransferAppt(null);
    setTransferTo('');
    load();
  };

  const filtered = list.filter((a) =>
    !search || a.visitorName.includes(search) || a.visitedEmployeeName.includes(search)
  );

  const categoryCounts = (cat: Category) => {
    if (!user) return 0;
    let base = list;
    if (cat === 'assigned') base = list.filter(a => a.visitedEmployeeId === user.id && !a.transferFrom);
    else if (cat === 'transferred') base = list.filter(a => a.visitedEmployeeId === user.id && !!a.transferFrom);
    else if (cat === 'shared') base = list.filter(a => a.visitedEmployeeId !== user.id);
    return base.filter(a => a.status === tab).length;
  };

  const tabs = [
    { key: 'pending' as const, label: '待审批', icon: Clock },
    { key: 'approved' as const, label: '已通过', icon: Check },
    { key: 'rejected' as const, label: '已拒绝', icon: X },
  ];

  const categories: { key: Category; label: string; icon: any }[] = [
    { key: 'all', label: '全部', icon: Layers },
    { key: 'assigned', label: '指派给我', icon: UserRound },
    { key: 'transferred', label: '转派给我', icon: ArrowRightLeft },
    { key: 'shared', label: '部门共享', icon: Building2 },
  ];

  const getTransferableEmployees = (currentId: string) => {
    if (!user) return [];
    const current = employees.find(e => e.id === currentId);
    if (current && current.department) {
      const deptEmps = employees.filter(e => e.department === current.department && e.id !== currentId);
      return deptEmps.length > 0 ? deptEmps : employees.filter(e => e.id !== currentId);
    }
    return employees.filter(e => e.id !== currentId);
  };

  const getApptCategory = (a: Appointment): Category => {
    if (!user) return 'all';
    if (a.visitedEmployeeId === user.id && !a.transferFrom) return 'assigned';
    if (a.visitedEmployeeId === user.id && !!a.transferFrom) return 'transferred';
    return 'shared';
  };

  const getCategoryBadge = (a: Appointment) => {
    const cat = getApptCategory(a);
    if (cat === 'assigned') return { label: '指派给我', cls: 'bg-primary-100 text-primary-700 border-primary-200' };
    if (cat === 'transferred') return { label: '转派给我', cls: 'bg-warning-100 text-warning-600 border-warning-200' };
    return { label: '部门共享', cls: 'bg-accent-100 text-accent-600 border-accent-200' };
  };

  if (detailAppt) {
    return <ApprovalDetail appt={detailAppt} onBack={() => setDetailAppt(null)} onLoad={load} user={user} employees={employees} />;
  }

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
              <MessageSquare className="w-6 h-6 text-primary-700" />
              审批中心
            </h1>
            {!isAdmin && user?.department && (
              <span className="px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-xs font-bold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {user.department}
              </span>
            )}
          </div>
          <p className="text-ink-500 mt-1 text-sm">
            {isAdmin ? '管理全公司所有访客审批申请' : `管理本部门（${user?.department || ''}）的访客申请，超过 24 小时未处理将自动通过`}
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

          {!isAdmin && (
            <div className="flex gap-2 px-5 py-3 bg-ink-50/60 border-b border-ink-100">
              {categories.map((c) => {
                const Icon = c.icon;
                const count = categoryCounts(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      category === c.key
                        ? 'bg-primary-700 text-white shadow-sm'
                        : 'bg-white text-ink-500 border border-ink-200 hover:border-primary-300 hover:text-primary-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {c.label}
                    <span className={`ml-0.5 px-1.5 rounded-full text-[10px] ${
                      category === c.key ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="divide-y divide-ink-100 max-h-[calc(100vh-360px)] overflow-y-auto scrollbar-thin">
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
              filtered.map((a, i) => {
                const isAutoApproved = a.autoApproved;
                const catBadge = getCategoryBadge(a);
                const qrExpired = a.status === 'approved' && new Date(a.expiresAt).getTime() < Date.now();
                return (
                  <div
                    key={a.id}
                    className="p-5 hover:bg-ink-50/60 transition-colors animate-fade-up cursor-pointer"
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => setDetailAppt(a)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-primary-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                          <h3 className="font-bold text-ink-800">{a.visitorName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            qrExpired ? 'bg-ink-100 text-ink-600 border-ink-200' : statusColors[a.status]
                          }`}>
                            {statusLabels[a.status]}
                            {qrExpired && ' · 二维码已过期'}
                          </span>
                          {!isAdmin && (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${catBadge.cls}`}>
                              {catBadge.label}
                            </span>
                          )}
                          {isAutoApproved && tab !== 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent-100 text-accent-600 border border-accent-200 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              自动通过
                            </span>
                          )}
                          <span className="text-xs text-ink-400 font-mono">{a.visitorPhone}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-ink-500 mb-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            访 {a.visitedEmployeeName} · {a.visitedDepartment}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {a.appointmentDate} {a.appointmentTime}
                          </span>
                          {(a.transferHistory?.length || 0) > 0 && (
                            <span className="flex items-center gap-1 text-warning-600">
                              <History className="w-3.5 h-3.5" />
                              已转派 {a.transferHistory?.length} 次
                            </span>
                          )}
                          {(a.rescheduleHistory?.length || 0) > 0 && (
                            <span className="flex items-center gap-1 text-accent-600">
                              <RefreshCcw className="w-3.5 h-3.5" />
                              已改期 {a.rescheduleHistory?.length} 次
                            </span>
                          )}
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
                        {isAutoApproved && a.approvedAt && (
                          <p className="mt-2 text-sm text-accent-600 bg-accent-50 rounded-lg px-3 py-2 inline-block">
                            <Zap className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                            超 24 小时未处理，已于 {formatDateTime(a.approvedAt)} 自动通过
                          </p>
                        )}
                      </div>

                      {tab === 'pending' && (
                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                );
              })
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
          <p className="text-sm text-ink-500 mb-4">选择要转派的员工，申请将转移至其名下并重置为待审批状态</p>
          <div className="text-sm text-ink-600 mb-2">
            当前被访人：<span className="font-bold text-ink-800">{transferAppt.visitedEmployeeName}</span>
          </div>
          <select
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
          >
            <option value="">请选择转派目标员工</option>
            {getTransferableEmployees(transferAppt.visitedEmployeeId).map((e) => (
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

function ApprovalDetail({
  appt: initialAppt, onBack, onLoad, user, employees,
}: {
  appt: Appointment;
  onBack: () => void;
  onLoad: () => void;
  user: any;
  employees: UserT[];
}) {
  const [appt, setAppt] = useState<Appointment>(initialAppt);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(appt.appointmentDate);
  const [newTime, setNewTime] = useState(appt.appointmentTime);
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    api.getTimeSlots(newDate).then(setSlots);
  }, [newDate]);

  const refresh = async () => {
    const r = await api.getAppointment(appt.id);
    setAppt(r);
    onLoad();
  };

  const approve = async () => {
    await api.updateAppointmentStatus(appt.id, 'approved');
    refresh();
  };

  const confirmReject = async () => {
    await api.updateAppointmentStatus(appt.id, 'rejected', rejectReason || '不便于接待');
    setRejectOpen(false);
    setRejectReason('');
    refresh();
  };

  const confirmTransfer = async () => {
    if (!transferTo || !user) return;
    await api.transferAppointment(appt.id, transferTo, user.id);
    setTransferOpen(false);
    setTransferTo('');
    refresh();
  };

  const confirmReschedule = async () => {
    await api.rescheduleAppointment(appt.id, newDate, newTime, user?.id);
    setRescheduleOpen(false);
    refresh();
  };

  const catBadge = (() => {
    if (!user) return null;
    if (appt.visitedEmployeeId === user.id && !appt.transferFrom) return { label: '指派给我', cls: 'bg-primary-100 text-primary-700 border-primary-200' };
    if (appt.visitedEmployeeId === user.id && !!appt.transferFrom) return { label: '转派给我', cls: 'bg-warning-100 text-warning-600 border-warning-200' };
    return { label: '部门共享', cls: 'bg-accent-100 text-accent-600 border-accent-200' };
  })();

  const qrExpired = appt.status === 'approved' && new Date(appt.expiresAt).getTime() < Date.now();

  const timeOptions = slots.filter(s => s.available);

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-5 text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
          ← 返回列表
        </button>

        <div className="bg-white rounded-2xl shadow-card p-6 mb-5 animate-fade-up">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <h1 className="text-xl font-black text-ink-800">预约详情</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  qrExpired ? 'bg-ink-100 text-ink-600 border-ink-200' : statusColors[appt.status]
                }`}>
                  {statusLabels[appt.status]}
                  {qrExpired && ' · 二维码已过期'}
                </span>
                {catBadge && <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${catBadge.cls}`}>{catBadge.label}</span>}
                {appt.autoApproved && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-100 text-accent-600 border border-accent-200 flex items-center gap-1">
                    <Zap className="w-3 h-3" />自动通过
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-500">预约编号：{appt.id.toUpperCase()}</p>
            </div>
            {appt.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => setTransferOpen(true)} className="px-4 py-2 rounded-lg border border-ink-200 text-ink-600 text-sm font-medium hover:bg-ink-50 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4" />转派
                </button>
                <button onClick={() => setRejectOpen(true)} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />拒绝
                </button>
                <button onClick={approve} className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent to-accent-400 text-white text-sm font-bold shadow-md shadow-accent/30 hover:shadow-lg flex items-center gap-1.5">
                  <Check className="w-4 h-4" />通过
                </button>
              </div>
            )}
            {(appt.status === 'pending' || (appt.status === 'approved' && !appt.checkedInAt)) && user?.role === 'visitor' && (
              <div className="flex gap-2">
                <button onClick={() => setRescheduleOpen(true)} className="px-4 py-2 rounded-lg border border-ink-200 text-ink-600 text-sm font-medium hover:bg-ink-50 flex items-center gap-1.5">
                  <RefreshCcw className="w-4 h-4" />改期
                </button>
                <button onClick={() => { api.cancelAppointment(appt.id).then(refresh); }} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 flex items-center gap-1.5">
                  <X className="w-4 h-4" />取消
                </button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Section title="访客信息">
              <InfoRow icon={UserRound} label="姓名" value={appt.visitorName} />
              <InfoRow icon={Users} label="电话" value={appt.visitorPhone} mono />
            </Section>
            <Section title="被访信息">
              <InfoRow icon={UserRound} label="员工" value={`${appt.visitedEmployeeName} · ${appt.visitedDepartment}`} />
              {appt.originalEmployeeName && appt.originalEmployeeId !== appt.visitedEmployeeId && (
                <InfoRow icon={ArrowRightLeft} label="原始指派" value={appt.originalEmployeeName} />
              )}
            </Section>
            <Section title="预约信息">
              <InfoRow icon={Calendar} label="日期" value={appt.appointmentDate} />
              <InfoRow icon={Clock} label="时间" value={appt.appointmentTime} />
              <InfoRow icon={AlertTriangle} label="过期时间" value={formatDateTime(appt.expiresAt)} />
              <InfoRow icon={MessageSquare} label="事由" value={appt.purpose} />
            </Section>
            <Section title="审批记录">
              <InfoRow icon={Clock} label="提交时间" value={formatDateTime(appt.createdAt)} />
              {appt.approvedAt && <InfoRow icon={Check} label={appt.autoApproved ? '自动通过时间' : '审批通过时间'} value={formatDateTime(appt.approvedAt)} />}
              {appt.rejectReason && <InfoRow icon={XCircle} label="拒绝原因" value={appt.rejectReason} />}
              {appt.checkedInAt && <InfoRow icon={Check} label="入场时间" value={formatDateTime(appt.checkedInAt)} />}
              {appt.checkedOutAt && <InfoRow icon={Check} label="离场时间" value={formatDateTime(appt.checkedOutAt)} />}
            </Section>
          </div>
        </div>

        {(appt.transferHistory?.length || 0) > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-6 mb-5 animate-fade-up animate-stagger-1">
            <h3 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-warning-500" />
              转派历史
            </h3>
            <div className="space-y-3">
              {appt.transferHistory?.map((t: TransferHistoryItem, i: number) => (
                <div key={t.id} className="flex items-start gap-3 p-3 bg-ink-50 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-warning-100 text-warning-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="text-ink-700">
                      <span className="font-medium">{t.fromEmployeeName}</span>
                      <span className="text-ink-400 mx-1.5">→</span>
                      <span className="font-medium">{t.toEmployeeName}</span>
                      <span className="text-ink-400 ml-2">({t.toDepartment})</span>
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">
                      操作人：{t.operatorName} · {formatDateTime(t.transferredAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(appt.rescheduleHistory?.length || 0) > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-6 mb-5 animate-fade-up animate-stagger-2">
            <h3 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
              <RefreshCcw className="w-4.5 h-4.5 text-accent-600" />
              改期历史
            </h3>
            <div className="space-y-3">
              {appt.rescheduleHistory?.map((r: RescheduleHistoryItem, i: number) => (
                <div key={r.id} className="flex items-start gap-3 p-3 bg-ink-50 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="text-ink-700">
                      <span className="font-medium">{r.oldDate} {r.oldTime}</span>
                      <span className="text-ink-400 mx-1.5">→</span>
                      <span className="font-medium">{r.newDate} {r.newTime}</span>
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">
                      操作人：{r.rescheduledBy} · {formatDateTime(r.rescheduledAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {rejectOpen && (
        <Modal onClose={() => setRejectOpen(false)} title="拒绝来访申请">
          <p className="text-sm text-ink-500 mb-4">请填写拒绝原因，系统将通知访客</p>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
            placeholder="请输入拒绝原因"
            className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none text-sm" />
          <div className="flex gap-3 mt-5">
            <button onClick={() => setRejectOpen(false)} className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50">取消</button>
            <button onClick={confirmReject} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">确认拒绝</button>
          </div>
        </Modal>
      )}

      {transferOpen && (
        <Modal onClose={() => setTransferOpen(false)} title="转派审批">
          <p className="text-sm text-ink-500 mb-4">选择要转派的员工，申请将转移至其名下并重置为待审批状态</p>
          <div className="text-sm text-ink-600 mb-2">当前被访人：<span className="font-bold text-ink-800">{appt.visitedEmployeeName}</span></div>
          <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
            <option value="">请选择转派目标员工</option>
            {employees.filter(e => e.id !== appt.visitedEmployeeId).map((e) => (
              <option key={e.id} value={e.id}>{e.name} · {e.department}</option>
            ))}
          </select>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setTransferOpen(false)} className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50">取消</button>
            <button onClick={confirmTransfer} disabled={!transferTo}
              className="flex-1 py-2.5 rounded-xl bg-primary-700 text-white font-bold hover:bg-primary-800 disabled:opacity-50 transition-colors">确认转派</button>
          </div>
        </Modal>
      )}

      {rescheduleOpen && (
        <Modal onClose={() => setRescheduleOpen(false)} title="改期预约">
          <p className="text-sm text-ink-500 mb-4">选择新的预约时间，改期后将重新进入审批流程并生成新的二维码</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">新日期</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">新时间</label>
              <select value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                {timeOptions.map((s) => (
                  <option key={s.time} value={s.time}>
                    {s.time}（{s.density === 'low' ? '人少' : s.density === 'medium' ? '适中' : '繁忙'}）
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setRescheduleOpen(false)} className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50">取消</button>
            <button onClick={confirmReschedule}
              className="flex-1 py-2.5 rounded-xl bg-primary-700 text-white font-bold hover:bg-primary-800 transition-colors">确认改期</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
      <span className="text-ink-500 w-20 flex-shrink-0 text-sm">{label}</span>
      <span className={`text-ink-800 font-medium flex-1 text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
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
