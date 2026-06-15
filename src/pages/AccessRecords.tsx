import { useEffect, useState } from 'react';
import {
  Logs, ArrowDownCircle, ArrowUpCircle, XCircle, Calendar, Search, Filter,
  Building2, Download, CheckCircle, AlertOctagon, User
} from 'lucide-react';
import type { AccessRecord } from '@shared/types';
import { api } from '../api';
import { formatDateTime } from '../utils';

const actionConfig = {
  check_in: { label: '入场', icon: ArrowDownCircle, cls: 'bg-accent-100 text-accent-600 border-accent-200' },
  check_out: { label: '离场', icon: ArrowUpCircle, cls: 'bg-primary-100 text-primary-700 border-primary-200' },
  rejected: { label: '拒绝', icon: XCircle, cls: 'bg-red-100 text-red-600 border-red-200' },
};

const rejectCategoryLabels: Record<string, string> = {
  blacklist: '黑名单',
  pending: '待审批',
  rejected: '已拒绝',
  expired: '二维码过期',
  checked_out: '已离场',
  other: '其他原因',
};

const departments = ['全部', '技术部', '市场部', '人力资源部', '行政部', '安保部'];

export default function AccessRecords() {
  const [list, setList] = useState<AccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'check_in' | 'check_out' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [department, setDepartment] = useState('');
  const [remark, setRemark] = useState('');
  const [rejectCategory, setRejectCategory] = useState('');
  const [rejectReasons, setRejectReasons] = useState<string[]>([]);
  const [rejectCategories, setRejectCategories] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.action = filter;
      if (date) params.date = date;
      if (department) params.department = department;
      if (remark) params.remark = remark;
      if (rejectCategory) params.rejectCategory = rejectCategory;
      const data = await api.getAccessRecords(params);
      setList(data);
      const reasons = await api.getRejectReasons();
      setRejectReasons(reasons);
      const cats = await api.getRejectCategories();
      setRejectCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, date, department, remark, rejectCategory]);

  const filtered = list.filter((r) =>
    !search || r.visitorName.includes(search) || r.visitorPhone.includes(search)
  );

  const counts = {
    all: list.length,
    check_in: list.filter((r) => r.action === 'check_in').length,
    check_out: list.filter((r) => r.action === 'check_out').length,
    rejected: list.filter((r) => r.action === 'rejected').length,
  };

  const exportCsv = () => {
    let csv = '出入记录\n';
    csv += '访客姓名,联系电话,操作,核验结果,失败分类,操作人,操作时间,备注\n';
    filtered.forEach((r) => {
      const act = actionConfig[r.action]?.label || r.action;
      const success = r.verifyResult === 'success' || !r.verifyResult && r.action !== 'rejected';
      const cat = r.rejectCategory ? (rejectCategoryLabels[r.rejectCategory] || r.rejectCategory) : '';
      csv += `${r.visitorName},${r.visitorPhone},${act},${success ? '成功' : '失败'},${cat},${r.operatorName || r.operatorId || ''},${formatDateTime(r.timestamp)},"${r.remark || ''}"\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `出入记录_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
              <Logs className="w-6 h-6 text-primary-700" />
              出入记录
            </h1>
            <p className="text-ink-500 mt-1 text-sm">所有访客的核验和通行记录</p>
          </div>
          <button
            onClick={exportCsv}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-1.5 text-sm"
          >
            <Download className="w-4 h-4" />导出
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-up animate-stagger-1">
          <div className="flex items-center justify-between border-b border-ink-100 p-4 flex-wrap gap-3">
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'check_in', 'check_out', 'rejected'] as const).map((f) => {
                const label = f === 'all' ? '全部' : actionConfig[f].label;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      filter === f ? 'bg-primary-700 text-white' : 'text-ink-500 hover:bg-ink-100'
                    }`}
                  >
                    {label} <span className={`ml-1 text-xs ${filter === f ? 'text-white/80' : 'text-ink-400'}`}>({counts[f]})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-3 px-4 py-3 bg-ink-50/60 border-b border-ink-100">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索访客姓名/电话"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink-200 bg-white text-sm focus:border-primary-400 outline-none"
              />
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink-200 bg-white text-sm focus:border-primary-400 outline-none"
              />
            </div>
            <div className="relative">
              <Building2 className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink-200 bg-white text-sm focus:border-primary-400 outline-none appearance-none"
              >
                {departments.map((d) => (
                  <option key={d} value={d === '全部' ? '' : d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <AlertOctagon className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={rejectCategory}
                onChange={(e) => setRejectCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink-200 bg-white text-sm focus:border-primary-400 outline-none appearance-none"
              >
                <option value="">全部失败分类</option>
                {rejectCategories.map((c) => (
                  <option key={c} value={c}>{rejectCategoryLabels[c] || c}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink-200 bg-white text-sm focus:border-primary-400 outline-none appearance-none"
              >
                <option value="">全部拒绝原因</option>
                {rejectReasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">访客信息</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">操作</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">核验结果</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">失败分类</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">操作人</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">时间</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i}><td colSpan={7} className="px-5 py-5"><div className="h-5 animate-pulse bg-ink-100 rounded" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-ink-400">暂无记录</td></tr>
                ) : (
                  filtered.map((r, i) => {
                    const cfg = actionConfig[r.action];
                    const Icon = cfg.icon;
                    const success = r.verifyResult === 'success' || !r.verifyResult && r.action !== 'rejected';
                    return (
                      <tr key={r.id} className="hover:bg-ink-50/60 transition-colors animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                        <td className="px-5 py-4">
                          <div className="font-bold text-ink-800">{r.visitorName}</div>
                          <div className="text-xs text-ink-400 font-mono">{r.visitorPhone}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${cfg.cls}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            success ? 'bg-accent-100 text-accent-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {success ? '成功' : '失败'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {r.rejectCategory ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-warning-100 text-warning-700">
                              {rejectCategoryLabels[r.rejectCategory] || r.rejectCategory}
                            </span>
                          ) : (
                            <span className="text-ink-300">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-ink-600">
                            <User className="w-3.5 h-3.5 text-ink-400" />
                            {r.operatorName || r.operatorId || <span className="text-ink-300">-</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-ink-600 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-ink-400" />
                            {formatDateTime(r.timestamp)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-ink-500 max-w-xs truncate">
                          {r.remark || <span className="text-ink-300">-</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
