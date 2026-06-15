import { useEffect, useState, useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import {
  FileBarChart, Download, Calendar, Users, UserCheck, UserX, Clock, TrendingUp,
  Filter, Search, Building2, UserRound, AlertTriangle, Zap, XCircle,
  ChevronRight, Eye, RefreshCcw, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import type { MonthlyReportData } from '@shared/types';
import { api } from '../api';
import { formatDateTime, statusLabels } from '../utils';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const departments = ['全部', '技术部', '市场部', '人力资源部', '行政部', '安保部'];

type DrillDownType = 'employee' | 'department' | 'reason' | 'visitor' | null;

export default function Reports() {
  const [month, setMonth] = useState('2026-06');
  const [department, setDepartment] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'employees' | 'reasons' | 'visitor' | 'raw'>('overview');
  const [employees, setEmployees] = useState<{ id: string; name: string; department: string }[]>([]);
  const [drillLabel, setDrillLabel] = useState<string>('');
  const [drillType, setDrillType] = useState<DrillDownType>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.getMonthlyReport({
        month, department, visitorName,
        employeeId: employeeId || undefined,
        rejectReason: rejectReason || undefined,
      });
      setData(r);
      const emps = await api.getUsers('employee');
      setEmployees(emps.map(e => ({ id: e.id, name: e.name, department: e.department || '' })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, department, visitorName, employeeId, rejectReason]);

  const hasFilter = department || employeeId || rejectReason || visitorName;

  const clearDrill = () => {
    setDepartment('');
    setEmployeeId('');
    setRejectReason('');
    setVisitorName('');
    setDrillType(null);
    setDrillLabel('');
  };

  const drillToDepartment = (deptName: string) => {
    setDepartment(deptName);
    setEmployeeId('');
    setRejectReason('');
    setDrillType('department');
    setDrillLabel(deptName);
    setTab('raw');
  };

  const drillToEmployee = (empId: string, empName: string) => {
    setEmployeeId(empId);
    setRejectReason('');
    setDrillType('employee');
    setDrillLabel(empName);
    setTab('raw');
  };

  const drillToReason = (reason: string) => {
    setRejectReason(reason);
    setDrillType('reason');
    setDrillLabel(reason);
    setTab('raw');
  };

  const drillToVisitor = (name: string) => {
    setVisitorName(name);
    setDrillType('visitor');
    setDrillLabel(name);
    setTab('visitor');
  };

  const totalApproved = useMemo(() => {
    if (!data) return 0;
    return data.appointments.filter(a =>
      a.status === 'approved' || a.status === 'checked_in' || a.status === 'checked_out'
    ).length;
  }, [data]);

  const totalQrExpired = useMemo(() => {
    if (!data) return 0;
    const now = Date.now();
    return data.appointments.filter(a =>
      a.status === 'approved' && new Date(a.expiresAt).getTime() < now
    ).length;
  }, [data]);

  const exportCsv = () => {
    if (!data) return;
    const filterDesc = [
      month ? `月份:${month}` : '',
      department ? `部门:${department}` : '',
      employeeId ? `员工:${employees.find(e => e.id === employeeId)?.name}` : '',
      visitorName ? `访客:${visitorName}` : '',
      rejectReason ? `拒绝原因:${rejectReason}` : '',
    ].filter(Boolean).join(' ');

    let csv = `访客分析报表 - ${filterDesc || '全部'}\n导出时间：${formatDateTime(new Date().toISOString())}\n\n`;

    csv += '【1. 总览数据】\n';
    csv += '指标,数值\n';
    csv += `总预约量,${data.totalAppointments}\n`;
    csv += `审批通过,${totalApproved}\n`;
    csv += `已到访,${data.totalVisited}\n`;
    csv += `二维码过期未到访,${totalQrExpired}\n`;
    csv += `已拒绝,${data.totalRejected}\n`;
    csv += `自动通过,${data.totalAutoApproved}\n`;
    csv += `平均审批时长(小时),${data.averageApprovalTime}\n\n`;

    csv += '【2. 每日访客趋势】\n';
    csv += '日期,预约数,审批通过,已到访,已拒绝,二维码过期\n';
    data.byDay.forEach((d: any) => {
      csv += `${d.date},${d.count},${d.approved || 0},${d.visited},${d.rejected},${d.qrExpired || 0}\n`;
    });
    csv += '\n';

    csv += '【3. 部门访客分布】\n';
    csv += '部门,预约数,审批通过,已到访,已拒绝,二维码过期\n';
    data.byDepartment.forEach((d: any) => {
      csv += `${d.department},${d.count},${d.approved || 0},${d.visited},${d.rejected},${d.qrExpired || 0}\n`;
    });
    csv += '\n';

    csv += '【4. 被访员工排行】\n';
    csv += '员工姓名,部门,预约数,审批通过,已到访,已拒绝,二维码过期\n';
    (data as any).byEmployee?.forEach((e: any) => {
      csv += `${e.employeeName},${e.department},${e.count},${e.approved || 0},${e.visited},${e.rejected},${e.qrExpired || 0}\n`;
    });
    csv += '\n';

    csv += '【5. 拒绝原因统计】\n';
    csv += '拒绝原因,次数\n';
    data.byRejectReason.forEach((r: any) => { csv += `"${r.reason}",${r.count}\n`; });
    csv += '\n';

    csv += '【6. 热门访客 TOP 10】\n';
    csv += '访客姓名,来访次数\n';
    data.topVisitors.forEach((v) => { csv += `${v.name},${v.count}\n`; });
    csv += '\n';

    csv += '【7. 预约原始记录】（与当前筛选完全一致）\n';
    csv += '预约编号,访客姓名,联系电话,被访员工,部门,事由,预约日期,预约时间,状态,是否自动通过,二维码是否过期,创建时间,审批时间,入场时间,离场时间,拒绝原因\n';
    data.appointments.forEach((a) => {
      const qrExp = new Date(a.expiresAt).getTime() < Date.now() && a.status === 'approved';
      csv += [
        a.id.toUpperCase(), a.visitorName, a.visitorPhone,
        a.visitedEmployeeName, a.visitedDepartment, `"${a.purpose}"`,
        a.appointmentDate, a.appointmentTime, statusLabels[a.status],
        a.autoApproved ? '是' : '否',
        qrExp ? '是' : '否',
        formatDateTime(a.createdAt),
        a.approvedAt ? formatDateTime(a.approvedAt) : '',
        a.checkedInAt ? formatDateTime(a.checkedInAt) : '',
        a.checkedOutAt ? formatDateTime(a.checkedOutAt) : '',
        a.rejectReason ? `"${a.rejectReason}"` : '',
      ].join(',') + '\n';
    });
    csv += '\n';

    csv += '【8. 出入记录原始行】（与当前筛选完全一致）\n';
    csv += '记录编号,预约编号,访客姓名,联系电话,操作类型,核验结果,操作人,操作时间,失败分类,备注\n';
    const actionLabel: any = { check_in: '入场', check_out: '离场', rejected: '拒绝' };
    const catLabel: any = { blacklist: '黑名单', pending: '待审批', rejected: '已拒绝', expired: '已过期', checked_out: '已离场', other: '其他' };
    data.accessRecords.forEach((r: any) => {
      csv += [
        r.id.toUpperCase(), r.appointmentId.toUpperCase(),
        r.visitorName, r.visitorPhone,
        actionLabel[r.action] || r.action,
        r.verifyResult === 'success' ? '成功' : '失败',
        r.operatorName || r.operatorId,
        formatDateTime(r.timestamp),
        r.rejectCategory ? catLabel[r.rejectCategory] || r.rejectCategory : '',
        `"${r.remark || ''}"`,
      ].join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const fname = `访客报表_${month}${department ? '_' + department : ''}${employeeId ? '_' + (employees.find(e => e.id === employeeId)?.name || '') : ''}.csv`;
    a.download = fname;
    a.click();
  };

  const deptChart = {
    labels: data?.byDepartment.map((d: any) => d.department) || [],
    datasets: [
      { label: '审批通过', data: data?.byDepartment.map((d: any) => d.approved || 0) || [], backgroundColor: '#00d4aa', borderRadius: 6, borderSkipped: false },
      { label: '已到访', data: data?.byDepartment.map((d: any) => d.visited) || [], backgroundColor: '#2667a4', borderRadius: 6, borderSkipped: false },
      { label: '已拒绝', data: data?.byDepartment.map((d: any) => d.rejected) || [], backgroundColor: '#ff6b35', borderRadius: 6, borderSkipped: false },
    ],
  };

  const dayChart = {
    labels: data?.byDay.map((d: any) => d.date.slice(5)) || [],
    datasets: [
      { label: '审批通过', data: data?.byDay.map((d: any) => d.approved || 0) || [], backgroundColor: '#00d4aa', borderRadius: 6, borderSkipped: false },
      { label: '到访', data: data?.byDay.map((d: any) => d.visited) || [], backgroundColor: '#2667a4', borderRadius: 6, borderSkipped: false },
      { label: '拒绝', data: data?.byDay.map((d: any) => d.rejected) || [], backgroundColor: '#ff6b35', borderRadius: 6, borderSkipped: false },
      { label: '二维码过期', data: data?.byDay.map((d: any) => d.qrExpired || 0) || [], backgroundColor: '#94a3b8', borderRadius: 6, borderSkipped: false },
    ],
  };

  const donutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { padding: 16, usePointStyle: true, font: { size: 12 } } } },
    cutout: '65%',
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const, labels: { usePointStyle: true, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 11 }, stepSize: 1 } },
    },
  };

  const filterActive = department || visitorName || employeeId || rejectReason;

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <div>
            <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
              <FileBarChart className="w-6 h-6 text-primary-700" />数据报表
            </h1>
            <p className="text-ink-500 mt-1 text-sm">访客数据分析与统计报表 · 支持多维筛选下钻 · 与 CSV 导出完全一致</p>
          </div>
          <button
            onClick={exportCsv}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />导出完整报表
          </button>
        </div>

        {hasFilter && (
          <div className="bg-accent-50 border border-accent-200 rounded-xl p-3 mb-5 flex items-center justify-between animate-fade-up flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-accent-700 flex-wrap">
              <Eye className="w-4 h-4 flex-shrink-0" />
              <span>当前视图：</span>
              {drillType === 'department' && <span className="font-bold">部门 · {drillLabel}</span>}
              {drillType === 'employee' && <span className="font-bold">员工 · {drillLabel}</span>}
              {drillType === 'reason' && <span className="font-bold">拒绝原因 · {drillLabel}</span>}
              {drillType === 'visitor' && <span className="font-bold">访客 · {drillLabel}</span>}
              {!drillType && <span className="font-bold">自定义筛选</span>}
              <span className="text-accent-500">（共 {data?.appointments.length || 0} 条预约，{data?.accessRecords.length || 0} 条出入记录）</span>
            </div>
            <button onClick={clearDrill} className="text-sm text-accent-700 hover:text-accent-800 font-medium flex items-center gap-1 flex-shrink-0">
              <RefreshCcw className="w-3.5 h-3.5" />清除筛选
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-card p-5 mb-6 animate-fade-up animate-stagger-1">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-bold text-ink-700">筛选条件</span>
            {filterActive && (
              <span className="text-xs text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full font-bold">已筛选</span>
            )}
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />统计月份
              </label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />部门筛选
              </label>
              <select value={department} onChange={(e) => { setDepartment(e.target.value); setDrillType(null); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                {departments.map((d) => <option key={d} value={d === '全部' ? '' : d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <UserRound className="w-3.5 h-3.5" />被访员工
              </label>
              <select value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setDrillType(null); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                <option value="">全部员工</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} · {e.department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <Search className="w-3.5 h-3.5" />访客姓名
              </label>
              <input value={visitorName} onChange={(e) => setVisitorName(e.target.value)}
                placeholder="输入访客姓名筛选"
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />拒绝原因
              </label>
              <select value={rejectReason} onChange={(e) => { setRejectReason(e.target.value); setDrillType(null); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                <option value="">全部原因</option>
                {data?.byRejectReason.map((r: any) => (
                  <option key={r.reason} value={r.reason}>{r.reason}（{r.count}）</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
          {[
            { label: '总预约', value: data?.totalAppointments ?? 0, icon: Calendar, color: 'from-primary-600 to-primary-800' },
            { label: '审批通过', value: totalApproved, icon: UserCheck, color: 'from-accent-500 to-accent-600' },
            { label: '已到访', value: data?.totalVisited ?? 0, icon: Users, color: 'from-primary-500 to-primary-700' },
            { label: '二维码过期', value: totalQrExpired, icon: Clock, color: 'from-ink-500 to-ink-700' },
            { label: '已拒绝', value: data?.totalRejected ?? 0, icon: UserX, color: 'from-warning-400 to-warning-500' },
            { label: '自动通过', value: data?.totalAutoApproved ?? 0, icon: Zap, color: 'from-accent-500 to-accent' },
            { label: '平均审批', value: `${data?.averageApprovalTime ?? 0}h`, icon: Clock, color: 'from-primary-400 to-primary-600' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-card animate-fade-up`} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-white/80">{s.label}</span>
                  <Icon className="w-4 h-4 text-white/90" />
                </div>
                <div className="text-xl font-black font-mono tabular-nums">{loading ? '...' : s.value}</div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-1.5 mb-4 flex-wrap">
          {[
            { key: 'overview' as const, label: '总览图表', icon: TrendingUp },
            { key: 'employees' as const, label: '员工明细', icon: UserRound },
            { key: 'reasons' as const, label: '拒绝原因', icon: AlertTriangle },
            { key: 'visitor' as const, label: '访客追溯', icon: Users },
            { key: 'raw' as const, label: '原始数据', icon: FileBarChart },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors ${
                  tab === t.key ? 'bg-primary-700 text-white' : 'bg-white text-ink-500 hover:bg-ink-100'
                }`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {tab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-2">
              <h3 className="font-bold text-ink-800 mb-5 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-accent" />每日访客趋势
              </h3>
              <div className="h-64">
                {loading ? <div className="h-full flex items-center justify-center text-ink-400 text-sm">加载中...</div> : data ? <Bar data={dayChart} options={barOpts as any} /> : null}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-3">
              <h3 className="font-bold text-ink-800 mb-5 flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-primary-600" />部门访客分布
              </h3>
              <div className="h-64">
                {loading ? <div className="h-full flex items-center justify-center text-ink-400 text-sm">加载中...</div> : data ? <Bar data={deptChart} options={barOpts as any} /> : null}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-4">
              <h3 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-warning-500" />热门访客 TOP 10（点击可下钻）
              </h3>
              <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin pr-2">
                {loading ? <div className="text-center py-8 text-ink-400 text-sm">加载中...</div> : data?.topVisitors.length ? (
                  data.topVisitors.map((v, i) => (
                    <button key={v.name} onClick={() => drillToVisitor(v.name)}
                      className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors group">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i < 3 ? 'bg-gradient-to-br from-warning-400 to-warning-500 text-white' : 'bg-ink-100 text-ink-500'
                      }`}>{i + 1}</span>
                      <span className="text-sm font-medium text-ink-700 flex-1 group-hover:text-primary-700">{v.name}</span>
                      <span className="text-sm text-ink-500 font-mono">{v.count} 次</span>
                      <ChevronRight className="w-3.5 h-3.5 text-ink-300 group-hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))
                ) : <div className="text-sm text-ink-400 text-center py-8">暂无数据</div>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-5">
              <h3 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-primary-600" />部门访客明细（点击可下钻）
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-2">
                {loading ? <div className="text-center py-8 text-ink-400 text-sm">加载中...</div> : (data as any)?.byDepartment?.length ? (
                  (data as any).byDepartment.map((d: any) => (
                    <button key={d.department} onClick={() => drillToDepartment(d.department)}
                      className="w-full text-left p-3 bg-ink-50 rounded-xl hover:bg-primary-50 hover:ring-1 hover:ring-primary-200 transition-all group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-ink-700 group-hover:text-primary-700 flex items-center gap-1.5">
                          {d.department}
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-xs text-ink-500 font-mono">
                          <span className="text-accent-600 font-bold">{d.approved || 0}</span>通过 ·
                          <span className="text-primary-600"> {d.visited}</span>到访 ·
                          <span className="text-red-500"> {d.rejected}</span>拒
                        </span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-accent rounded-full"
                          style={{ width: `${Math.min(100, (d.count / Math.max(...(data as any).byDepartment.map((x: any) => x.count))) * 100)}%` }} />
                      </div>
                    </button>
                  ))
                ) : <div className="text-sm text-ink-400 text-center py-8">暂无数据</div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'employees' && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-up">
            <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-bold text-ink-800">员工明细（点击下钻查看原始记录）</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ink-50 border-b border-ink-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">排名</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">员工姓名</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">部门</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-ink-500 uppercase tracking-wider">总预约</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-ink-500 uppercase tracking-wider">审批通过</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-ink-500 uppercase tracking-wider">已到访</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-ink-500 uppercase tracking-wider">二维码过期</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-ink-500 uppercase tracking-wider">已拒绝</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-ink-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {loading ? [1, 2, 3, 4].map((i) => (
                    <tr key={i}><td colSpan={9} className="px-4 py-5"><div className="h-5 animate-pulse bg-ink-100 rounded" /></td></tr>
                  )) : (data as any)?.byEmployee?.map((e: any, i: number) => (
                    <tr key={e.employeeId} className="hover:bg-ink-50/60">
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                          i < 3 ? 'bg-gradient-to-br from-warning-400 to-warning-500 text-white' : 'bg-ink-100 text-ink-500'
                        }`}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-ink-800">{e.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-ink-500">{e.department}</td>
                      <td className="px-4 py-3 text-right font-mono text-ink-700 font-bold">{e.count}</td>
                      <td className="px-4 py-3 text-right font-mono text-accent-600 font-bold">{e.approved || 0}</td>
                      <td className="px-4 py-3 text-right font-mono text-primary-600">{e.visited}</td>
                      <td className="px-4 py-3 text-right font-mono text-ink-400">{e.qrExpired || 0}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-500">{e.rejected}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => drillToEmployee(e.employeeId, e.employeeName)}
                          className="text-primary-600 hover:text-primary-700 text-xs font-bold flex items-center gap-0.5 mx-auto">
                          查看 <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'reasons' && (
          <div className="bg-white rounded-2xl shadow-card p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink-800">拒绝原因分布（点击下钻查看对应记录）</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {loading ? <div className="col-span-2 text-center py-8 text-ink-400 text-sm">加载中...</div> : (data as any)?.byRejectReason?.length ? (
                (data as any).byRejectReason.map((r: any) => {
                  const max = Math.max(...((data as any)?.byRejectReason?.map((x: any) => x.count) || [1]));
                  return (
                    <button key={r.reason} onClick={() => drillToReason(r.reason)}
                      className="p-4 bg-ink-50 rounded-xl hover:bg-warning-50 hover:ring-1 hover:ring-warning-200 text-left transition-all group">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-sm font-bold text-ink-700 group-hover:text-warning-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-warning-500" />
                          {r.reason}
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-sm font-black text-red-500 font-mono">{r.count} 次</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-400 to-warning-500 rounded-full"
                          style={{ width: `${Math.min(100, (r.count / max) * 100)}%` }} />
                      </div>
                    </button>
                  );
                })
              ) : <div className="col-span-2 text-center py-8 text-ink-400 text-sm">暂无拒绝记录</div>}
            </div>
          </div>
        )}

        {tab === 'visitor' && (
          <div className="space-y-5 animate-fade-up">
            {!visitorName ? (
              <div className="bg-white rounded-2xl shadow-card p-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-ink-100 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-ink-400" />
                </div>
                <h3 className="text-lg font-bold text-ink-800 mb-1">请选择访客</h3>
                <p className="text-sm text-ink-500 mb-5">从上方筛选输入访客姓名，或从热门访客点击下钻</p>
                <div className="text-xs text-ink-400">可查看该访客的完整预约、审批、通行时间线</div>
              </div>
            ) : loading ? (
              <div className="bg-white rounded-2xl shadow-card p-10">
                <div className="h-8 bg-ink-100 rounded animate-pulse mb-4" />
                <div className="h-4 bg-ink-100 rounded animate-pulse w-2/3 mb-6" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-ink-50 rounded-xl animate-pulse mb-3" />
                ))}
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl shadow-card p-6 text-white">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <Users className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">{visitorName}</h3>
                        <p className="text-sm text-white/70 mt-0.5">
                          {data?.appointments[0]?.visitorPhone || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <div className="text-2xl font-black font-mono">{data?.appointments.length || 0}</div>
                        <div className="text-xs text-white/60">总预约</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black font-mono text-accent">{totalApproved}</div>
                        <div className="text-xs text-white/60">审批通过</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black font-mono text-primary-200">{data?.totalVisited || 0}</div>
                        <div className="text-xs text-white/60">已到访</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black font-mono text-warning-300">{data?.totalRejected || 0}</div>
                        <div className="text-xs text-white/60">被拒绝</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
                    <h4 className="font-bold text-ink-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary-600" />完整时间线
                    </h4>
                    <span className="text-xs text-ink-400">按时间倒序 · 共 {(data?.appointments.length || 0) + (data?.accessRecords.length || 0)} 条记录</span>
                  </div>
                  <div className="p-5 space-y-3">
                    {(() => {
                      const events: { type: string; time: string; title: string; desc: string; status?: string }[] = [];
                      data?.appointments.forEach(a => {
                        events.push({
                          type: 'appointment',
                          time: a.createdAt,
                          title: '提交预约',
                          desc: `事由：${a.purpose} · 预约时间：${a.appointmentDate} ${a.appointmentTime}`,
                          status: a.status,
                        });
                        if (a.approvedAt) {
                          events.push({
                            type: a.autoApproved ? 'autoapprove' : 'approve',
                            time: a.approvedAt,
                            title: a.autoApproved ? '自动通过审批' : '审批通过',
                            desc: `被访：${a.visitedEmployeeName} · ${a.visitedDepartment}`,
                          });
                        }
                        if (a.rejectReason) {
                          events.push({
                            type: 'reject',
                            time: a.approvedAt || a.createdAt,
                            title: '预约被拒绝',
                            desc: a.rejectReason,
                          });
                        }
                      });
                      data?.accessRecords.forEach(r => {
                        events.push({
                          type: r.action,
                          time: r.timestamp,
                          title: r.action === 'check_in' ? '入场登记' : r.action === 'check_out' ? '离场登记' : '核验拒绝',
                          desc: `${r.operatorName || '未知操作员'} · ${r.remark || ''}`,
                          status: r.verifyResult || (r.action === 'rejected' ? 'failed' : 'success'),
                        });
                      });
                      events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

                      const iconMap: Record<string, any> = {
                        appointment: Calendar, autoapprove: Zap, approve: UserCheck,
                        reject: XCircle, check_in: ArrowDownCircle, check_out: ArrowUpCircle, rejected: XCircle,
                      };
                      const colorMap: Record<string, string> = {
                        appointment: 'bg-primary-100 text-primary-700 border-primary-200',
                        autoapprove: 'bg-accent-100 text-accent-700 border-accent-200',
                        approve: 'bg-accent-100 text-accent-700 border-accent-200',
                        reject: 'bg-red-100 text-red-600 border-red-200',
                        check_in: 'bg-accent-100 text-accent-700 border-accent-200',
                        check_out: 'bg-primary-100 text-primary-700 border-primary-200',
                        rejected: 'bg-red-100 text-red-600 border-red-200',
                      };

                      return events.length === 0 ? (
                        <div className="text-center py-12 text-ink-400 text-sm">暂无时间线记录</div>
                      ) : (
                        events.map((e, i) => {
                          const Icon = iconMap[e.type] || Calendar;
                          const colorCls = colorMap[e.type] || 'bg-ink-100 text-ink-600';
                          return (
                            <div key={i} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                {i < events.length - 1 && <div className="w-px flex-1 bg-ink-200 my-1" />}
                              </div>
                              <div className="flex-1 pb-3">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-bold text-ink-800 text-sm">{e.title}</span>
                                  {e.status && e.status !== 'success' && e.status !== 'failed' && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                      e.status === 'approved' ? 'bg-accent-100 text-accent-700' :
                                      e.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                      e.status === 'checked_in' ? 'bg-primary-100 text-primary-700' :
                                      e.status === 'checked_out' ? 'bg-ink-100 text-ink-600' :
                                      'bg-ink-100 text-ink-500'
                                    }`}>
                                      {statusLabels[e.status as keyof typeof statusLabels] || e.status}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-ink-500">{e.desc}</div>
                                <div className="text-[11px] text-ink-400 font-mono mt-1">{formatDateTime(e.time)}</div>
                              </div>
                            </div>
                          );
                        })
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'raw' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-up">
              <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
                <h3 className="font-bold text-ink-800">
                  预约原始记录（共 {data?.appointments.length || 0} 条）
                  {hasFilter && <span className="ml-2 text-xs font-normal text-accent-600">已筛选</span>}
                </h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="bg-ink-50 border-b border-ink-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">编号</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">访客</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">被访员工</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">部门</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">预约时间</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">状态</th>
                      <th className="px-3 py-2.5 text-center font-bold text-ink-500">自动通过</th>
                      <th className="px-3 py-2.5 text-center font-bold text-ink-500">二维码过期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {data?.appointments.map((a) => {
                      const qrExp = new Date(a.expiresAt).getTime() < Date.now() && a.status === 'approved';
                      return (
                        <tr key={a.id} className="hover:bg-ink-50/60">
                          <td className="px-3 py-2 font-mono text-ink-400">{a.id.toUpperCase().slice(0, 8)}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => drillToVisitor(a.visitorName)}
                              className="text-ink-700 hover:text-primary-600 font-medium text-left">
                              {a.visitorName}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-ink-700">{a.visitedEmployeeName}</td>
                          <td className="px-3 py-2 text-ink-500">{a.visitedDepartment}</td>
                          <td className="px-3 py-2 text-ink-500 whitespace-nowrap">{a.appointmentDate} {a.appointmentTime}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              a.status === 'approved' && qrExp ? 'bg-ink-100 text-ink-600 border-ink-200' :
                              a.status === 'approved' ? 'bg-accent-100 text-accent-600 border-accent-200' :
                              a.status === 'rejected' ? 'bg-red-100 text-red-600 border-red-200' :
                              a.status === 'checked_in' ? 'bg-primary-100 text-primary-700 border-primary-200' :
                              'bg-ink-100 text-ink-500 border-ink-200'
                            }`}>
                              {statusLabels[a.status]}
                              {qrExp && '·已过期'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {a.autoApproved
                              ? <span className="text-accent-600 font-bold">是</span>
                              : <span className="text-ink-300">-</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {qrExp
                              ? <span className="text-ink-500 font-bold">是</span>
                              : <span className="text-ink-300">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-up">
              <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
                <h3 className="font-bold text-ink-800">
                  出入记录（共 {data?.accessRecords.length || 0} 条）
                  {hasFilter && <span className="ml-2 text-xs font-normal text-accent-600">与上方筛选一致</span>}
                </h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="bg-ink-50 border-b border-ink-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">时间</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">访客</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">类型</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">核验结果</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">操作人</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">失败分类</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">备注</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {(data as any)?.accessRecords?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-ink-50/60">
                        <td className="px-3 py-2 text-ink-500 font-mono whitespace-nowrap">{formatDateTime(r.timestamp)}</td>
                        <td className="px-3 py-2 text-ink-700">{r.visitorName}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.action === 'check_in' ? 'bg-accent-100 text-accent-600 border-accent-200' :
                            r.action === 'check_out' ? 'bg-primary-100 text-primary-700 border-primary-200' :
                            'bg-red-100 text-red-600 border-red-200'
                          }`}>
                            {r.action === 'check_in' ? '入场' : r.action === 'check_out' ? '离场' : '拒绝'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {r.verifyResult === 'success'
                            ? <span className="text-accent-600 font-bold">成功</span>
                            : <span className="text-red-500 font-bold">失败</span>}
                        </td>
                        <td className="px-3 py-2 text-ink-600">{r.operatorName || r.operatorId}</td>
                        <td className="px-3 py-2 text-ink-500">
                          {r.rejectCategory ? (
                            <span className="text-xs text-warning-600 bg-warning-50 px-2 py-0.5 rounded">
                              {r.rejectCategory === 'blacklist' ? '黑名单' :
                               r.rejectCategory === 'pending' ? '待审批' :
                               r.rejectCategory === 'rejected' ? '已拒绝' :
                               r.rejectCategory === 'expired' ? '已过期' :
                               r.rejectCategory === 'checked_out' ? '已离场' : r.rejectCategory}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 text-ink-500 max-w-xs truncate">{r.remark || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
