import { useEffect, useState } from 'react';
import { Logs, ArrowDownCircle, ArrowUpCircle, XCircle, Calendar, Search, Filter } from 'lucide-react';
import type { AccessRecord } from '@shared/types';
import { api } from '../api';
import { formatDateTime } from '../utils';

const actionConfig = {
  check_in: { label: '入场', icon: ArrowDownCircle, cls: 'bg-accent-100 text-accent-600 border-accent-200' },
  check_out: { label: '离场', icon: ArrowUpCircle, cls: 'bg-primary-100 text-primary-700 border-primary-200' },
  rejected: { label: '拒绝', icon: XCircle, cls: 'bg-red-100 text-red-600 border-red-200' },
};

export default function AccessRecords() {
  const [list, setList] = useState<AccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'check_in' | 'check_out' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { action: filter } : undefined;
      const data = await api.getAccessRecords(params);
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const filtered = list.filter((r) =>
    !search || r.visitorName.includes(search) || r.visitorPhone.includes(search)
  );

  const counts = {
    all: list.length,
    check_in: list.filter((r) => r.action === 'check_in').length,
    check_out: list.filter((r) => r.action === 'check_out').length,
    rejected: list.filter((r) => r.action === 'rejected').length,
  };

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
            <Logs className="w-6 h-6 text-primary-700" />
            出入记录
          </h1>
          <p className="text-ink-500 mt-1 text-sm">所有访客的核验和通行记录</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-up animate-stagger-1">
          <div className="flex items-center justify-between border-b border-ink-100 p-4 flex-wrap gap-3">
            <div className="flex gap-1.5">
              {(['all', 'check_in', 'check_out', 'rejected'] as const).map((f) => {
                const label = f === 'all' ? '全部' : actionConfig[f].label;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === f ? 'bg-primary-700 text-white' : 'text-ink-500 hover:bg-ink-100'}`}
                  >
                    {label} <span className={`ml-1 text-xs ${filter === f ? 'text-white/80' : 'text-ink-400'}`}>({counts[f]})</span>
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索访客姓名/电话"
                className="pl-9 pr-4 py-2 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:bg-white focus:border-primary-400 outline-none w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">访客信息</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">操作</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">时间</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i}><td colSpan={4} className="px-5 py-5"><div className="h-5 animate-pulse bg-ink-100 rounded" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-16 text-center text-ink-400">暂无记录</td></tr>
                ) : (
                  filtered.map((r, i) => {
                    const cfg = actionConfig[r.action];
                    const Icon = cfg.icon;
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
                          <div className="flex items-center gap-1.5 text-sm text-ink-600 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-ink-400" />
                            {formatDateTime(r.timestamp)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-ink-500">{r.remark || '-'}</td>
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
