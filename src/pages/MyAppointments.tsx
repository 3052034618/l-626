import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, ChevronRight, Clock, Users, FileText, QrCode, User, Phone, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { Appointment } from '@shared/types';
import { api } from '../api';
import { statusLabels, statusColors, formatDateTime } from '../utils';
import { useAuthStore } from '../store/auth';

export default function MyAppointments() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getAppointments({ phone: user.phone });
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  if (selected) {
    return (
      <div className="min-h-full bg-gradient-to-br from-primary-50 via-white to-accent-50 p-8 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-card-hover p-8 animate-fade-up">
          <button onClick={() => setSelected(null)} className="mb-4 text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
            ← 返回列表
          </button>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-ink-800">预约详情</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[selected.status]}`}>{statusLabels[selected.status]}</span>
          </div>

          {(selected.status === 'approved' || selected.status === 'pending' || selected.status === 'checked_in') && (
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-2xl border-2 ${selected.status === 'approved' ? 'shadow-glow border-accent/30' : 'border-ink-200 opacity-75'}`}>
                <QRCodeSVG value={selected.qrCode} size={160} level="H" includeMargin />
              </div>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <InfoRow icon={QrCode} label="预约编号" value={selected.id.toUpperCase()} mono />
            <InfoRow icon={User} label="访客姓名" value={selected.visitorName} />
            <InfoRow icon={Phone} label="联系电话" value={selected.visitorPhone} mono />
            <InfoRow icon={Users} label="被访员工" value={`${selected.visitedEmployeeName} · ${selected.visitedDepartment}`} />
            <InfoRow icon={Calendar} label="预约日期" value={selected.appointmentDate} />
            <InfoRow icon={Clock} label="预约时间" value={selected.appointmentTime} />
            <InfoRow icon={FileText} label="来访事由" value={selected.purpose} />
            <InfoRow icon={AlertCircle} label="过期时间" value={formatDateTime(selected.expiresAt)} />
            {selected.approvedAt && <InfoRow icon={CheckCircle} label="审批通过时间" value={formatDateTime(selected.approvedAt)} />}
            {selected.rejectReason && <InfoRow icon={XCircle} label="拒绝原因" value={selected.rejectReason} />}
            {selected.checkedInAt && <InfoRow icon={CheckCircle} label="入场时间" value={formatDateTime(selected.checkedInAt)} />}
            {selected.checkedOutAt && <InfoRow icon={CheckCircle} label="离场时间" value={formatDateTime(selected.checkedOutAt)} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-primary-700" />
              我的预约
            </h1>
            <p className="text-ink-500 mt-1 text-sm">共 {list.length} 条预约记录</p>
          </div>
          <button onClick={() => navigate('/visitor/appointment')} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            + 新建预约
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-16 text-center animate-fade-up">
            <div className="w-16 h-16 mx-auto rounded-full bg-ink-100 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-ink-400" />
            </div>
            <h3 className="text-lg font-bold text-ink-800 mb-1">暂无预约记录</h3>
            <p className="text-ink-500 text-sm mb-5">快去发起您的第一次访客预约吧</p>
            <button onClick={() => navigate('/visitor/appointment')} className="px-6 py-2.5 rounded-xl bg-primary-700 text-white font-bold hover:bg-primary-800 transition-colors">
              立即预约
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((a, i) => (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all p-5 cursor-pointer group animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <QRCodeSVG value={a.qrCode} size={32} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="font-bold text-ink-800 truncate">{a.visitorName} · 访 {a.visitedEmployeeName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex-shrink-0 ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-ink-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{a.appointmentDate} {a.appointmentTime}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{a.visitedDepartment}</span>
                      <span className="truncate">{a.purpose}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-ink-100 last:border-0">
      <Icon className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
      <span className="text-ink-500 w-24 flex-shrink-0">{label}</span>
      <span className={`text-ink-800 font-medium flex-1 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
