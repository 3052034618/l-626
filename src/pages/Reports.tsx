import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { FileBarChart, Download, Calendar, Users, UserCheck, UserX, Clock, TrendingUp, Filter, Search, Building2 } from 'lucide-react';
import type { MonthlyReportData } from '@shared/types';
import { api } from '../api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Reports() {
  const [month, setMonth] = useState('2026-06');
  const [department, setDepartment] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.getMonthlyReport({ month, department, visitorName });
      setData(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, department, visitorName]);

  const exportCsv = () => {
    if (!data) return;
    const filterDesc = [
      month ? `月份:${month}` : '',
      department ? `部门:${department}` : '',
      visitorName ? `访客:${visitorName}` : '',
    ].filter(Boolean).join(' ');

    let csv = `访客分析报表 - ${filterDesc || '全部'}\n\n`;
    csv += '总览数据\n';
    csv += `总预约量,${data.totalAppointments}\n`;
    csv += `已到访,${data.totalVisited}\n`;
    csv += `已拒绝,${data.totalRejected}\n`;
    csv += `平均审批时长(小时),${data.averageApprovalTime}\n\n`;

    csv += '每日访客趋势\n';
    csv += '日期,访客数\n';
    data.byDay.forEach((d) => { csv += `${d.date},${d.count}\n`; });
    csv += '\n';

    csv += '部门访客分布\n';
    csv += '部门,访客数\n';
    data.byDepartment.forEach((d) => { csv += `${d.department},${d.count}\n`; });
    csv += '\n';

    csv += '热门访客 TOP 10\n';
    csv += '访客姓名,来访次数\n';
    data.topVisitors.forEach((v) => { csv += `${v.name},${v.count}\n`; });

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
    datasets: [{
      label: '访客数',
      data: data?.byDay.map((d) => d.count) || [],
      backgroundColor: '#00d4aa',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const donutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { padding: 16, usePointStyle: true, font: { size: 12 } } } },
    cutout: '65%',
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 11 }, stepSize: 1 } },
    },
  };

  const departments = ['全部', '技术部', '市场部', '人力资源部', '行政部'];

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
              <FileBarChart className="w-6 h-6 text-primary-700" />
              数据报表
            </h1>
            <p className="text-ink-500 mt-1 text-sm">访客数据分析与统计报表</p>
          </div>
          <button
            onClick={exportCsv}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 mb-6 animate-fade-up animate-stagger-1">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-bold text-ink-700">筛选条件</span>
            {(department || visitorName) && (
              <span className="text-xs text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full font-bold">
                已筛选
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> 统计月份
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> 部门筛选
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
              >
                {departments.map((d) => (
                  <option key={d} value={d === '全部' ? '' : d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <Search className="w-3.5 h-3.5" /> 访客姓名
              </label>
              <input
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="输入访客姓名筛选"
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '总预约量', value: data?.totalAppointments ?? 0, icon: Calendar, color: 'from-primary-600 to-primary-800' },
            { label: '已到访', value: data?.totalVisited ?? 0, icon: UserCheck, color: 'from-accent-500 to-accent' },
            { label: '已拒绝', value: data?.totalRejected ?? 0, icon: UserX, color: 'from-warning-400 to-warning-500' },
            { label: '平均审批时长', value: `${data?.averageApprovalTime ?? 0}h`, icon: Clock, color: 'from-primary-400 to-primary-600' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-card animate-fade-up`} style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/80">{s.label}</span>
                  <Icon className="w-5 h-5 text-white/90" />
                </div>
                <div className="text-3xl font-black font-mono tabular-nums">{loading ? '...' : s.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-2">
            <h3 className="font-bold text-ink-800 mb-5 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-accent" />
              每日访客趋势
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center text-ink-400 text-sm">加载中...</div>
              ) : data ? <Bar data={dayChart} options={barOpts as any} /> : null}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-3">
            <h3 className="font-bold text-ink-800 mb-5 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-primary-600" />
              部门访客分布
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center text-ink-400 text-sm">加载中...</div>
              ) : data ? <Doughnut data={deptChart} options={donutOpts} /> : null}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-4">
            <h3 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-warning-500" />
              热门访客 TOP 10
            </h3>
            <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin pr-2">
              {loading ? (
                <div className="text-center py-8 text-ink-400 text-sm">加载中...</div>
              ) : data?.topVisitors.length ? (
                data.topVisitors.map((v, i) => (
                  <div key={v.name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-gradient-to-br from-warning-400 to-warning-500 text-white' : 'bg-ink-100 text-ink-500'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-ink-700 flex-1">{v.name}</span>
                    <span className="text-sm text-ink-500 font-mono">{v.count} 次</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-ink-400 text-center py-8">暂无数据</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up animate-stagger-5">
            <h3 className="font-bold text-ink-800 mb-4 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-primary-600" />
              部门访客明细
            </h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-ink-400 text-sm">加载中...</div>
              ) : data?.byDepartment.length ? (
                data.byDepartment.map((d) => {
                  const max = Math.max(...(data?.byDepartment.map((x) => x.count) || [1]));
                  return (
                    <div key={d.department}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-ink-700 font-medium">{d.department}</span>
                        <span className="text-sm text-ink-500 font-mono">{d.count} 人次</span>
                      </div>
                      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-accent rounded-full transition-all"
                          style={{ width: `${Math.min(100, (d.count / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-ink-400 text-center py-8">暂无数据</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
