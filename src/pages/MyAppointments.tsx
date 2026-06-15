import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar, ChevronRight, Clock, Users, FileText, QrCode, User, Phone,
  AlertCircle, CheckCircle, XCircle, RefreshCcw, X, Zap, History, Building2,
  ArrowRightLeft
} from 'lucide-react';
import type { Appointment, RescheduleHistoryItem, TransferHistoryItem, TimeSlot } from '@shared/types';
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
      <AppointmentDetail
        appt={selected}
        onBack={() => setSelected(null)}
        onUpdate={load}
        user={user}
      />
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
          <button
            onClick={() => navigate('/visitor/appointment')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
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
            <button
              onClick={() => navigate('/visitor/appointment')}
              className="px-6 py-2.5 rounded-xl bg-primary-700 text-white font-bold hover:bg-primary-800 transition-colors"
            >
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
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <h3 className="font-bold text-ink-800 truncate">
                        {a.visitorName} · 访 {a.visitedEmployeeName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex-shrink-0 ${statusColors[a.status]}`}>
                        {statusLabels[a.status]}
                      </span>
                      {a.autoApproved && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent-100 text-accent-600 border border-accent-200 flex items-center gap-1">
                          <Zap className="w-3 h-3" />自动通过
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-ink-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {a.appointmentDate} {a.appointmentTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {a.visitedDepartment}
                      </span>
                      {(a.rescheduleHistory?.length || 0) > 0 && (
                        <span className="flex items-center gap-1 text-accent-600">
                          <RefreshCcw className="w-3.5 h-3.5" />
                          已改期 {a.rescheduleHistory?.length} 次
                        </span>
                      )}
                      {(a.transferHistory?.length || 0) > 0 && (
                        <span className="flex items-center gap-1 text-warning-600">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          已转派 {a.transferHistory?.length} 次
                        </span>
                      )}
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

function AppointmentDetail({
  appt: initial, onBack, onUpdate, user,
}: {
  appt: Appointment;
  onBack: () => void;
  onUpdate: () => void;
  user: any;
}) {
  const [appt, setAppt] = useState<Appointment>(initial);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [newDate, setNewDate] = useState(appt.appointmentDate);
  const [newTime, setNewTime] = useState(appt.appointmentTime);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    api.getTimeSlots(newDate).then(setSlots);
  }, [newDate]);

  const refresh = async () => {
    const r = await api.getAppointment(appt.id);
    setAppt(r);
    onUpdate();
  };

  const canReschedule = appt.status === 'pending' || (appt.status === 'approved' && !appt.checkedInAt);
  const canCancel = appt.status !== 'checked_in' && appt.status !== 'checked_out' && appt.status !== 'rejected' && appt.status !== 'expired';

  const confirmReschedule = async () => {
    await api.rescheduleAppointment(appt.id, newDate, newTime, user?.id);
    setRescheduleOpen(false);
    refresh();
  };

  const confirmCancel = async () => {
    await api.cancelAppointment(appt.id);
    setCancelOpen(false);
    refresh();
  };

  const timeOptions = slots.filter(s => s.available);
  const showQr = appt.status === 'approved' || appt.status === 'pending' || appt.status === 'checked_in';

  return (
    <div className="min-h-full bg-gradient-to-br from-primary-50 via-white to-accent-50 p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-card-hover p-8 animate-fade-up">
        <button onClick={onBack} className="mb-4 text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
          ← 返回列表
        </button>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-ink-800">预约详情</h2>
            <p className="text-xs text-ink-400 mt-0.5">编号：{appt.id.toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[appt.status]}`}>
              {statusLabels[appt.status]}
            </span>
            {appt.autoApproved && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-100 text-accent-600 border border-accent-200 flex items-center gap-1">
                <Zap className="w-3 h-3" />自动通过
              </span>
            )}
          </div>
        </div>

        {showQr && (
          <div className="flex justify-center mb-6">
            <div className={`p-5 rounded-2xl border-2 ${appt.status === 'approved' ? 'shadow-glow border-accent/30' : 'border-ink-200 opacity-75'}`}>
              <QRCodeSVG value={appt.qrCode} size={180} level="H" includeMargin />
              <div className="text-center text-xs text-ink-400 mt-2 font-mono">{appt.qrCode}</div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <InfoRow icon={User} label="访客姓名" value={appt.visitorName} />
          <InfoRow icon={Phone} label="联系电话" value={appt.visitorPhone} mono />
          <InfoRow icon={Users} label="被访员工" value={`${appt.visitedEmployeeName} · ${appt.visitedDepartment}`} />
          {appt.originalEmployeeName && appt.originalEmployeeId !== appt.visitedEmployeeId && (
            <InfoRow icon={ArrowRightLeft} label="原始指派" value={appt.originalEmployeeName} />
          )}
          <InfoRow icon={Calendar} label="预约日期" value={appt.appointmentDate} />
          <InfoRow icon={Clock} label="预约时间" value={appt.appointmentTime} />
          <InfoRow icon={FileText} label="来访事由" value={appt.purpose} />
          <InfoRow icon={AlertCircle} label="过期时间" value={formatDateTime(appt.expiresAt)} />
          {appt.approvedAt && (
            <InfoRow
              icon={CheckCircle}
              label={appt.autoApproved ? '自动通过时间' : '审批通过'}
              value={formatDateTime(appt.approvedAt)}
            />
          )}
          {appt.rejectReason && (
            <InfoRow icon={XCircle} label="拒绝/取消原因" value={appt.rejectReason} />
          )}
          {appt.checkedInAt && <InfoRow icon={CheckCircle} label="入场时间" value={formatDateTime(appt.checkedInAt)} />}
          {appt.checkedOutAt && <InfoRow icon={CheckCircle} label="离场时间" value={formatDateTime(appt.checkedOutAt)} />}
        </div>

        {(canReschedule || canCancel) && (
          <div className="flex gap-3 pt-4 border-t border-ink-100">
            {canReschedule && (
              <button
                onClick={() => setRescheduleOpen(true)}
                className="flex-1 py-3 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50 flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />改期
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setCancelOpen(true)}
                className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />取消预约
              </button>
            )}
          </div>
        )}

        {(appt.transferHistory?.length || 0) > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-bold text-ink-700 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-warning-500" />转派历史
            </h4>
            <div className="space-y-2">
              {appt.transferHistory?.map((t: TransferHistoryItem, i: number) => (
                <div key={t.id} className="text-xs bg-ink-50 rounded-lg px-3 py-2">
                  <span className="font-bold text-warning-600">#{i + 1}</span>
                  <span className="text-ink-500 mx-1.5">{t.fromEmployeeName} → {t.toEmployeeName}</span>
                  <span className="text-ink-400">· {formatDateTime(t.transferredAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(appt.rescheduleHistory?.length || 0) > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-bold text-ink-700 mb-3 flex items-center gap-1.5">
              <RefreshCcw className="w-4 h-4 text-accent-600" />改期历史
            </h4>
            <div className="space-y-2">
              {appt.rescheduleHistory?.map((r: RescheduleHistoryItem, i: number) => (
                <div key={r.id} className="text-xs bg-ink-50 rounded-lg px-3 py-2">
                  <span className="font-bold text-accent-600">#{i + 1}</span>
                  <span className="text-ink-500 mx-1.5">{r.oldDate} {r.oldTime} → {r.newDate} {r.newTime}</span>
                  <span className="text-ink-400">· {formatDateTime(r.rescheduledAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {rescheduleOpen && (
        <Modal onClose={() => setRescheduleOpen(false)} title="改期预约">
          <p className="text-sm text-ink-500 mb-4">选择新的预约时间，改期后将重新进入审批流程并生成新二维码</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">新日期</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">新时间</label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
              >
                {timeOptions.map((s) => (
                  <option key={s.time} value={s.time}>
                    {s.time}（{s.density === 'low' ? '人少' : s.density === 'medium' ? '适中' : '繁忙'}）
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setRescheduleOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50"
            >
              取消
            </button>
            <button
              onClick={confirmReschedule}
              className="flex-1 py-2.5 rounded-xl bg-primary-700 text-white font-bold hover:bg-primary-800 transition-colors"
            >
              确认改期
            </button>
          </div>
        </Modal>
      )}

      {cancelOpen && (
        <Modal onClose={() => setCancelOpen(false)} title="取消预约">
          <p className="text-sm text-ink-500 mb-5">确定要取消这次预约吗？取消后状态将变更为已拒绝。</p>
          <div className="flex gap-3">
            <button
              onClick={() => setCancelOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50"
            >
              再想想
            </button>
            <button
              onClick={confirmCancel}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
            >
              确认取消
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-ink-100 last:border-0">
      <Icon className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
      <span className="text-ink-500 w-24 flex-shrink-0 text-sm">{label}</span>
      <span className={`text-ink-800 font-medium flex-1 text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-up"
      >
        <h3 className="text-lg font-bold text-ink-800 mb-1">{title}</h3>
        {children}
      </div>
    </div>
  );
}
