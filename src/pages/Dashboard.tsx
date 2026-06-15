import { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  RefreshCw,
  TrendingUp,
  Activity,
  Shield,
} from 'lucide-react';
import type { DashboardStats } from '@shared/types';
import { api } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend);

const StatCard = ({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: number | string; color: string; sub?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${color} shadow-card animate-fade-up`}>
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-4xl font-black text-white font-mono tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-white/60">{sub}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [time, setTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const s = await api.getDashboardStats();
      setStats(s);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    const tiv = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(iv);
      clearInterval(tiv);
    };
  }, []);

  const lineData = {
    labels: stats?.hourlyTrend.map((h) => h.hour) || [],
    datasets: [
      {
        label: '预约人数',
        data: stats?.hourlyTrend.map((h) => h.count) || [],
        fill: true,
        borderColor: '#00d4aa',
        backgroundColor: 'rgba(0, 212, 170, 0.15)',
        borderWidth: 2.5,
        pointBackgroundColor: '#00d4aa',
        pointBorderColor: '#0f172a',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: stats?.departmentRank.map((d) => d.department) || [],
    datasets: [
      {
        label: '访客数',
        data: stats?.departmentRank.map((d) => d.count) || [],
        backgroundColor: ['#00d4aa', '#2667a4', '#ff6b35', '#78a9d4', '#66e6c9'],
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    },
  };

  const fmtTime = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-ink-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative">
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/10 glass-dark">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-accent" />
              实时数据大屏
            </h1>
            <p className="text-sm text-ink-400 mt-0.5">Visitor Dashboard · 每 10 秒自动刷新</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="font-mono text-xl font-bold tabular-nums">{fmtTime(time)}</div>
              <div className="text-xs text-ink-400">系统时间</div>
            </div>
            <button
              onClick={load}
              className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard icon={Users} label="今日预约量" value={stats?.todayAppointments ?? 0} color="from-primary-600 to-primary-800" sub="含待审批、已通过" />
            <StatCard icon={UserCheck} label="已到访人数" value={stats?.todayVisited ?? 0} color="from-accent-500 to-accent" sub="实时核验通过" />
            <StatCard icon={UserX} label="拒绝次数" value={stats?.todayRejected ?? 0} color="from-warning-400 to-warning-500" sub="黑名单/过期/拒绝" />
            <StatCard icon={Clock} label="待审批数" value={stats?.pendingApprovals ?? 0} color="from-primary-400 to-primary-600" sub="超过24h自动通过" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 rounded-2xl bg-ink-900/60 border border-white/10 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  今日时段趋势
                </h3>
                <span className="text-xs text-ink-400">单位：人</span>
              </div>
              <div className="h-64">{stats && <Line data={lineData} options={chartOpts as any} />}</div>
            </div>

            <div className="rounded-2xl bg-ink-900/60 border border-white/10 p-6 backdrop-blur-sm">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-5">
                <Users className="w-5 h-5 text-accent" />
                热门被访部门
              </h3>
              <div className="h-64">{stats && <Bar data={barData} options={chartOpts as any} />}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 rounded-2xl bg-ink-900/60 border border-white/10 p-6 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning-400" />
                待审批预警
              </h3>
              <div className="text-sm text-ink-400">超 24 小时未处理的申请将自动通过，请注意及时审批。</div>
            </div>

            <div className="rounded-2xl bg-ink-900/60 border border-white/10 p-6 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                系统状态
              </h3>
              <div className="space-y-3">
                {[
                  { label: '预约服务', status: '正常', ok: true },
                  { label: '核验服务', status: '正常', ok: true },
                  { label: '审批服务', status: '正常', ok: true },
                  { label: '数据同步', status: '正常', ok: true },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <span className="text-ink-300">{s.label}</span>
                    <span className={`inline-flex items-center gap-1.5 font-medium ${s.ok ? 'text-accent' : 'text-warning-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-accent animate-pulse' : 'bg-warning-400'}`} />
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/30 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-accent mb-2">
              <Activity className="w-5 h-5" />
              <h3 className="font-bold text-lg">实时提示</h3>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              您已进入数据大屏模式，所有数据每 10 秒自动刷新一次。请保持网络连接以获取最新数据。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
