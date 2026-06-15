import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import {
  FileBarChart, Download, Calendar, Users, UserCheck, UserX, Clock, TrendingUp,
  Filter, Search, Building2, UserRound, AlertTriangle, Zap, XCircle
} from 'lucide-react';
import type { MonthlyReportData } from '@shared/types';
import { api } from '../api';
import { formatDateTime, statusLabels } from '../utils';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const departments = ['全部', '技术部', '市场部', '人力资源部', '行政部', '安保部'];

export default function Reports() {
  const [month, setMonth] = useState('2026-06');
  const [department, setDepartment] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'employees' | 'reasons' | 'raw'>('overview');
  const [employees, setEmployees] = useState<{ id: string; name: string; department: string }[]>([]);

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

  const exportCsv = () => {
    if (!data) return;
    const filterDesc = [
      month ? `月份:${month}` : '',
      department ? `部门:${department}` : '',
      visitorName ? `访客:${visitorName}` : '',
      employeeId ? `员工:${employees.find(e => e.id === employeeId)?.name}` : '',
      rejectReason ? `拒绝原因:${rejectReason}` : '',
    ].filter(Boolean).join(' ');

    let csv = `访客分析报表 - ${filterDesc || '全部'}\n导出时间：${formatDateTime(new Date().toISOString())}\n\n`;

    csv += '【1. 总览数据】\n';
    csv += '指标,数值\n';
    csv += `总预约量,${data.totalAppointments}\n`;
    csv += `已到访,${data.totalVisited}\n`;
    csv += `已拒绝,${data.totalRejected}\n`;
    csv += `自动通过,${data.totalAutoApproved}\n`;
    csv += `已过期,${data.totalExpired}\n`;
    csv += `平均审批时长(小时),${data.averageApprovalTime}\n\n`;

    csv += '【2. 每日访客趋势】\n';
    csv += '日期,访客数,已到访,已拒绝\n';
    data.byDay.forEach((d) => { csv += `${d.date},${d.count},${d.visited},${d.rejected}\n`; });
    csv += '\n';

    csv += '【3. 部门访客分布】\n';
    csv += '部门,访客数,已到访,已拒绝\n';
    data.byDepartment.forEach((d) => { csv += `${d.department},${d.count},${d.visited},${d.rejected}\n`; });
    csv += '\n';

    csv += '【4. 被访员工排行】\n';
    csv += '员工姓名,部门,访客数,已到访,已拒绝\n';
    data.byEmployee.forEach((e) => { csv += `${e.employeeName},${e.department},${e.count},${e.visited},${e.rejected}\n`; });
    csv += '\n';

    csv += '【5. 拒绝原因统计】\n';
    csv += '拒绝原因,次数\n';
    data.byRejectReason.forEach((r) => { csv += `"${r.reason}",${r.count}\n`; });
    csv += '\n';

    csv += '【6. 热门访客 TOP 10】\n';
    csv += '访客姓名,来访次数\n';
    data.topVisitors.forEach((v) => { csv += `${v.name},${v.count}\n`; });
    csv += '\n';

    csv += '【7. 预约原始记录】\n';
    csv += '预约编号,访客姓名,联系电话,被访员工,部门,事由,预约日期,预约时间,状态,是否自动通过,创建时间,审批时间,入场时间,离场时间,拒绝原因\n';
    data.appointments.forEach((a) => {
      csv += [
        a.id.toUpperCase(), a.visitorName, a.visitorPhone,
        a.visitedEmployeeName, a.visitedDepartment, `"${a.purpose}"`,
        a.appointmentDate, a.appointmentTime, statusLabels[a.status],
        a.autoApproved ? '是' : '否',
        formatDateTime(a.createdAt),
        a.approvedAt ? formatDateTime(a.approvedAt) : '',
        a.checkedInAt ? formatDateTime(a.checkedInAt) : '',
        a.checkedOutAt ? formatDateTime(a.checkedOutAt) : '',
        a.rejectReason ? `"${a.rejectReason}"` : '',
      ].join(',') + '\n';
    });
    csv += '\n';

    csv += '【8. 出入记录原始行】\n';
    csv += '记录编号,预约编号,访客姓名,联系电话,操作类型,操作时间,操作人,备注\n';
    const actionLabel: any = { check_in: '入场', check_out: '离场', rejected: '拒绝' };
    data.accessRecords.forEach((r) => {
      csv += [
        r.id.toUpperCase(), r.appointmentId.toUpperCase(),
        r.visitorName, r.visitorPhone,
        actionLabel[r.action] || r.action,
        formatDateTime(r.timestamp),
        r.operatorId, `"${r.remark || ''}"`,
      ].join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const fname = `访客报表_${month}${department ? '_' + department : ''}${visitorName ? '_' + visitorName : ''}.csv`;
    a.download = fname;
    a.click();
  };

  const deptChart = {
    labels: data?.byDepartment.map((d) => d.department) || [],
    datasets: [{
      data: data?.byDepartment.map((d) => d.count) || [],
      backgroundColor: ['#00d4aa', '#2667a4', '#ff6b35', '#78a9d4', '#66e6c9', '#adcbe7'],
      borderWidth: 0,
    }],
  };

  const dayChart = {
    labels: data?.byDay.map((d) => d.date.slice(5)) || [],
    datasets: [
      { label: '预约', data: data?.byDay.map((d) => d.count) || [], backgroundColor: '#00d4aa', borderRadius: 6, borderSkipped: false },
      { label: '到访', data: data?.byDay.map((d) => d.visited) || [], backgroundColor: '#2667a4', borderRadius: 6, borderSkipped: false },
      { label: '拒绝', data: data?.byDay.map((d) => d.rejected) || [], backgroundColor: '#ff6b35', borderRadius: 6, borderSkipped: false },
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
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
              <FileBarChart className="w-6 h-6 text-primary-700" />数据报表
            </h1>
            <p className="text-ink-500 mt-1 text-sm">访客数据分析与统计报表 · 支持多维筛选与原始数据导出</p>
          </div>
          <button
            onClick={exportCsv}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />导出完整报表
          </button>
        </div>

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
              <select value={department} onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                {departments.map((d) => <option key={d} value={d === '全部' ? '' : d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <UserRound className="w-3.5 h-3.5" />被访员工
              </label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
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
              <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                <option value="">全部原因</option>
                {data?.byRejectReason.map((r) => (
                  <option key={r.reason} value={r.reason}>{r.reason}（{r.count}）</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: '总预约', value: data?.totalAppointments ?? 0, icon: Calendar, color: 'from-primary-600 to-primary-800' },
            { label: '已到访', value: data?.totalVisited ?? 0, icon: UserCheck, color: 'from-accent-500 to-accent' },
            { label: '已拒绝', value: data?.totalRejected ?? 0, icon: UserX, color: 'from-warning-400 to-warning-500' },
            { label: '自动通过', value: data?.totalAutoApproved ?? 0, icon: Zap, color: 'from-accent-500 to-accent-600' },
            { label: '已过期', value: data?.totalExpired ?? 0, icon: XCircle, color: 'from-ink-500 to-ink-700' },
            { label: '平均审批', value: `${data?.averageApprovalTime ?? 0}h`, icon: Clock, color: 'from-primary-400 to-primary-600' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-card animate-fade-up`} style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-white/80">{s.label}</span>
                  <Icon className="w-4 h-4 text-white/90" />
                </div>
                <div className="text-2xl font-black font-mono tabular-nums">{loading ? '...' : s.value}</div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-1.5 mb-4">
          {[
            { key: 'overview' as const, label: '总览图表', icon: TrendingUp },
            { key: 'employees' as const, label: '员工明细', icon: UserRound },
            { key: 'reasons' as const, label: '拒绝原因', icon: AlertTriangle },
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
                <Users className="w-4.5 h-4.5 text-primary-600" />部门访客分布
              </h3>
              <div className="h-64">
                {loading ? <div className="h-full flex items-center justify-center text-ink-400 text-sm">加载中...</div> : data ? <Doughnut data={deptChart} options={donutOpts} /> : null}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-4">
              <h3 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-warning-500" />热门访客 TOP 10
              </h3>
              <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin pr-2">
                {loading ? <div className="text-center py-8 text-ink-400 text-sm">加载中...</div> : data?.topVisitors.length ? (
                  data.topVisitors.map((v, i) => (
                    <div key={v.name} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i < 3 ? 'bg-gradient-to-br from-warning-400 to-warning-500 text-white' : 'bg-ink-100 text-ink-500'
                      }`}>{i + 1}</span>
                      <span className="text-sm font-medium text-ink-700 flex-1">{v.name}</span>
                      <span className="text-sm text-ink-500 font-mono">{v.count} 次</span>
                    </div>
                  ))
                ) : <div className="text-sm text-ink-400 text-center py-8">暂无数据</div>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-5">
              <h3 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-primary-600" />部门访客明细
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-2">
                {loading ? <div className="text-center py-8 text-ink-400 text-sm">加载中...</div> : data?.byDepartment.length ? (
                  data.byDepartment.map((d) => {
                    const max = Math.max(...(data?.byDepartment.map((x) => x.count) || [1]));
                    return (
                      <div key={d.department}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-ink-700 font-medium">{d.department}</span>
                          <span className="text-xs text-ink-500 font-mono">
                            共{d.count} · 到访{d.visited} · 拒绝{d.rejected}
                          </span>
                        </div>
                        <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-500 to-accent rounded-full transition-all"
                            style={{ width: `${Math.min(100, (d.count / max) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : <div className="text-sm text-ink-400 text-center py-8">暂无数据</div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'employees' && (
          <div className="bg-white rounded-2xl shadow-card p-5 animate-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ink-50 border-b border-ink-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">排名</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">员工姓名</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">部门</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-ink-500 uppercase tracking-wider">总预约</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-ink-500 uppercase tracking-wider">已到访</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-ink-500 uppercase tracking-wider">已拒绝</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {loading ? [1, 2, 3, 4].map((i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-5"><div className="h-5 animate-pulse bg-ink-100 rounded" /></td></tr>
                  )) : data?.byEmployee.map((e, i) => (
                    <tr key={e.employeeId} className="hover:bg-ink-50/60">
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                          i < 3 ? 'bg-gradient-to-br from-warning-400 to-warning-500 text-white' : 'bg-ink-100 text-ink-500'
                        }`}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-ink-800">{e.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-ink-500">{e.department}</td>
                      <td className="px-4 py-3 text-right font-mono text-ink-700">{e.count}</td>
                      <td className="px-4 py-3 text-right font-mono text-accent-600">{e.visited}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-500">{e.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'reasons' && (
          <div className="bg-white rounded-2xl shadow-card p-5 animate-fade-up">
            <div className="space-y-3">
              {loading ? <div className="text-center py-8 text-ink-400 text-sm">加载中...</div> : data?.byRejectReason.length ? (
                data.byRejectReason.map((r) => {
                  const max = Math.max(...(data?.byRejectReason.map((x) => x.count) || [1]));
                  return (
                    <div key={r.reason} className="p-4 bg-ink-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-ink-700">{r.reason}</span>
                        <span className="text-sm font-bold text-red-500 font-mono">{r.count} 次</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-400 to-warning-500 rounded-full"
                          style={{ width: `${Math.min(100, (r.count / max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : <div className="text-center py-8 text-ink-400 text-sm">暂无拒绝记录</div>}
            </div>
          </div>
        )}

        {tab === 'raw' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-up">
              <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
                <h3 className="font-bold text-ink-800">预约原始记录（共 {data?.appointments.length || 0} 条）</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="bg-ink-50 border-b border-ink-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">编号</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">访客</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">被访员工</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">部门</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">预约时间</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">状态</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">自动通过</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {data?.appointments.map((a) => (
                      <tr key={a.id} className="hover:bg-ink-50/60">
                        <td className="px-3 py-2 font-mono text-ink-400">{a.id.toUpperCase().slice(0, 8)}</td>
                        <td className="px-3 py-2 text-ink-700">{a.visitorName}</td>
                        <td className="px-3 py-2 text-ink-700">{a.visitedEmployeeName}</td>
                        <td className="px-3 py-2 text-ink-500">{a.visitedDepartment}</td>
                        <td className="px-3 py-2 text-ink-500">{a.appointmentDate} {a.appointmentTime}</td>
                        <td className="px-3 py-2 text-ink-700">{statusLabels[a.status]}</td>
                        <td className="px-3 py-2">
                          {a.autoApproved
                            ? <span className="text-accent-600 font-bold">是</span>
                            : <span className="text-ink-300">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-up">
              <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
                <h3 className="font-bold text-ink-800">出入记录（共 {data?.accessRecords.length || 0} 条）</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="bg-ink-50 border-b border-ink-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">时间</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">访客</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">类型</th>
                      <th className="px-3 py-2.5 text-left font-bold text-ink-500">备注</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {data?.accessRecords.map((r) => (
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
