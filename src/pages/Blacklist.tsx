import { useEffect, useState } from 'react';
import { ShieldAlert, Plus, Trash2, Search, User, Phone, FileText, Calendar, X } from 'lucide-react';
import type { BlacklistItem } from '@shared/types';
import { api } from '../api';
import { formatDateTime } from '../utils';
import { useAuthStore } from '../store/auth';

export default function Blacklist() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ visitorName: '', visitorPhone: '', reason: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getBlacklist();
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = list.filter((b) =>
    !search || b.visitorName.includes(search) || b.visitorPhone.includes(search)
  );

  const remove = async (id: string) => {
    if (!confirm('确定要将该访客移出黑名单吗？')) return;
    await api.removeBlacklist(id);
    load();
  };

  const submit = async () => {
    setError('');
    if (!form.visitorName || !form.visitorPhone || !form.reason) {
      setError('请填写完整信息');
      return;
    }
    try {
      await api.addBlacklist({ ...form, addedBy: user?.id });
      setShowAdd(false);
      setForm({ visitorName: '', visitorPhone: '', reason: '' });
      load();
    } catch (e: any) {
      setError(e.message || '添加失败');
    }
  };

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-warning-500" />
              黑名单管理
            </h1>
            <p className="text-ink-500 mt-1 text-sm">黑名单访客在预约时将被自动拦截</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-warning-400 to-warning-500 text-white font-bold shadow-md shadow-warning-400/30 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加黑名单
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-up animate-stagger-1">
          <div className="flex items-center justify-between border-b border-ink-100 p-4">
            <div className="text-sm text-ink-500">
              共 <span className="font-bold text-ink-800">{list.length}</span> 条黑名单记录
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索姓名/电话"
                className="pl-9 pr-4 py-2 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:bg-white focus:border-primary-400 outline-none w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-warning-50/50 border-b border-warning-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-warning-600 uppercase tracking-wider">访客</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-warning-600 uppercase tracking-wider">列入原因</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-warning-600 uppercase tracking-wider">列入时间</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-warning-600 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {loading ? (
                  [1, 2].map((i) => (
                    <tr key={i}><td colSpan={4} className="px-5 py-5"><div className="h-5 animate-pulse bg-ink-100 rounded" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-16 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-ink-100 flex items-center justify-center mb-3">
                      <ShieldAlert className="w-6 h-6 text-ink-400" />
                    </div>
                    <div className="text-ink-500">暂无黑名单记录</div>
                  </td></tr>
                ) : (
                  filtered.map((b, i) => (
                    <tr key={b.id} className="hover:bg-warning-50/30 transition-colors animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                            <User className="w-4.5 h-4.5 text-warning-500" />
                          </div>
                          <div>
                            <div className="font-bold text-ink-800">{b.visitorName}</div>
                            <div className="text-xs text-ink-400 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3" />{b.visitorPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-1.5 max-w-sm">
                          <FileText className="w-3.5 h-3.5 text-warning-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-ink-600">{b.reason}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-ink-600 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-ink-400" />
                          {formatDateTime(b.addedAt)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => remove(b.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          移除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-warning-500" />
                添加黑名单
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-ink-400 hover:text-ink-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-ink-500 mb-5">被列入者再次预约时将被自动拦截</p>

            {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">访客姓名</label>
                <input value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} placeholder="请输入姓名" className="w-full px-4 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-warning-400 focus:ring-2 focus:ring-warning-100 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">联系电话</label>
                <input value={form.visitorPhone} onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })} placeholder="请输入手机号" className="w-full px-4 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-warning-400 focus:ring-2 focus:ring-warning-100 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">列入原因</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="请说明列入原因" className="w-full px-4 py-2.5 rounded-xl border border-ink-200 bg-white focus:border-warning-400 focus:ring-2 focus:ring-warning-100 outline-none text-sm resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50">
                取消
              </button>
              <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-warning-400 to-warning-500 text-white font-bold shadow-md hover:shadow-lg transition-all">
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
