import { useState } from 'react';
import {
  ScanLine, QrCode, CheckCircle, XCircle, AlertTriangle, Clock, Users,
  Calendar, ShieldAlert, Maximize2, LogIn, LogOut, Zap
} from 'lucide-react';
import type { Appointment, VerifyResult } from '@shared/types';
import { api } from '../api';
import { useAuthStore } from '../store/auth';
import { statusLabels, statusColors, formatDateTime } from '../utils';

export default function Verify() {
  const user = useAuthStore((s) => s.user);
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [verifiedAppt, setVerifiedAppt] = useState<Appointment | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | 'check_in' | 'check_out'>(null);

  const demoCodes = [
    { code: 'QR-VISITOR-A1-20260615', label: '刘客户 · 已通过（入场）' },
    { code: 'QR-VISITOR-A2-20260615', label: '孙合作方 · 已入场（离场）' },
    { code: 'QR-VISITOR-A3-20260615', label: '周面试者 · 待审批' },
    { code: 'QR-VISITOR-INVALID', label: '无效二维码' },
  ];

  const executeAction = async (action: 'check_in' | 'check_out', appt: Appointment) => {
    try {
      await api.updateAppointmentStatus(appt.id, action);
      await api.createAccessRecord({
        appointmentId: appt.id,
        visitorName: appt.visitorName,
        visitorPhone: appt.visitorPhone,
        action,
        operatorId: user?.id,
      });
      const updated = await api.getAppointment(appt.id);
      setVerifiedAppt(updated);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const verify = async (code: string) => {
    if (!code) return;
    setScanning(true);
    setResult(null);
    setVerifiedAppt(null);
    setConfirmAction(null);
    try {
      const r = await api.verifyQr(code);
      setResult(r);
      if (r.success && r.appointment) {
        setVerifiedAppt(r.appointment);
        if (r.action === 'check_in') {
          setConfirmAction('check_in');
        } else if (r.action === 'check_out') {
          setConfirmAction('check_out');
        }
      } else if (r.appointment) {
        await api.createAccessRecord({
          appointmentId: r.appointment.id,
          visitorName: r.appointment.visitorName,
          visitorPhone: r.appointment.visitorPhone,
          action: 'rejected',
          operatorId: user?.id,
          remark: r.message,
        });
      }
    } finally {
      setScanning(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    verify(qrInput.trim());
  };

  const confirmDoAction = async () => {
    if (!confirmAction || !verifiedAppt) return;
    await executeAction(confirmAction, verifiedAppt);
    setConfirmAction(null);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-primary-950 via-primary-900 to-ink-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <ScanLine className="w-6 h-6 text-accent" />
            扫码核验
          </h1>
          <p className="text-primary-200 mt-1 text-sm">扫描访客二维码或手动输入编号进行核验</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="animate-fade-up animate-stagger-1">
            <div className="relative bg-ink-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-8 border-2 border-dashed border-accent/40 rounded-2xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-2xl" />
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan-line top-0" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-4 ${scanning ? 'animate-pulse' : ''}`}>
                      {scanning ? (
                        <ScanLine className="w-10 h-10 text-accent animate-bounce" />
                      ) : result ? (
                        result.success ? <CheckCircle className="w-10 h-10 text-accent" /> : <XCircle className="w-10 h-10 text-warning-400" />
                      ) : (
                        <QrCode className="w-10 h-10 text-accent" />
                      )}
                    </div>
                    <div className="text-sm text-primary-200">
                      {scanning ? '正在核验...' : result ? '核验完成' : '将二维码对准扫描框'}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={submit} className="mt-6 relative">
                <div className="flex gap-2.5">
                  <input
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="或手动输入二维码编号"
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:border-accent/50 focus:bg-white/15 outline-none transition-all text-sm"
                  />
                  <button
                    type="submit"
                    disabled={scanning || !qrInput.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-400 text-ink-900 font-bold shadow-glow-sm hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    核验
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="text-xs text-primary-300 mb-2.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  演示数据：点击快速核验
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {demoCodes.map((d) => (
                    <button
                      key={d.code}
                      onClick={() => { setQrInput(d.code); verify(d.code); }}
                      className="text-left px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent/30 transition-all group"
                    >
                      <div className="text-xs text-accent font-mono truncate">{d.code}</div>
                      <div className="text-xs text-primary-200 mt-0.5">{d.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="animate-fade-up animate-stagger-2">
            {result ? (
              <div className={`rounded-3xl p-8 backdrop-blur-sm border ${result.success ? 'bg-accent/10 border-accent/30' : 'bg-warning-400/10 border-warning-400/30'}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result.success ? 'bg-accent/20' : 'bg-warning-400/20'}`}>
                    {result.success ? (
                      confirmAction === 'check_in' ? <LogIn className="w-9 h-9 text-accent" /> :
                      confirmAction === 'check_out' ? <LogOut className="w-9 h-9 text-accent" /> :
                      <CheckCircle className="w-9 h-9 text-accent" />
                    ) : result.isBlacklisted ? (
                      <ShieldAlert className="w-9 h-9 text-warning-400" />
                    ) : (
                      <AlertTriangle className="w-9 h-9 text-warning-400" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${result.success ? 'text-accent' : 'text-warning-300'}`}>
                      {confirmAction === 'check_in' ? '待入场登记' :
                       confirmAction === 'check_out' ? '待离场登记' :
                       result.success ? '核验通过' : '核验不通过'}
                    </h3>
                    <p className="text-sm text-white/70 mt-0.5">{result.message}</p>
                  </div>
                </div>

                {verifiedAppt && (
                  <>
                    <div className="space-y-2.5 text-sm bg-black/20 rounded-2xl p-5 mb-5">
                      <Row icon={Users} label="访客" value={`${verifiedAppt.visitorName} · ${verifiedAppt.visitorPhone}`} />
                      <Row icon={Users} label="被访" value={`${verifiedAppt.visitedEmployeeName} · ${verifiedAppt.visitedDepartment}`} />
                      <Row icon={Calendar} label="预约时间" value={`${verifiedAppt.appointmentDate} ${verifiedAppt.appointmentTime}`} />
                      <Row icon={Clock} label="过期时间" value={formatDateTime(verifiedAppt.expiresAt)} />
                      <Row icon={Clock} label="状态" value={statusLabels[verifiedAppt.status]} badgeClass={statusColors[verifiedAppt.status]} />
                      {verifiedAppt.autoApproved && verifiedAppt.approvedAt && (
                        <Row icon={Zap} label="自动通过" value={formatDateTime(verifiedAppt.approvedAt)} />
                      )}
                      {verifiedAppt.checkedInAt && (
                        <Row icon={LogIn} label="入场时间" value={formatDateTime(verifiedAppt.checkedInAt)} />
                      )}
                      {verifiedAppt.checkedOutAt && (
                        <Row icon={LogOut} label="离场时间" value={formatDateTime(verifiedAppt.checkedOutAt)} />
                      )}
                    </div>

                    {confirmAction && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setConfirmAction(null)}
                          className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 font-medium hover:bg-white/5 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={confirmDoAction}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-400 text-ink-900 font-bold shadow-glow-sm hover:shadow-glow transition-all flex items-center justify-center gap-2"
                        >
                          {confirmAction === 'check_in' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                          确认{confirmAction === 'check_in' ? '入场' : '离场'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-3xl p-8 backdrop-blur-sm bg-white/5 border border-white/10 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                  <ScanLine className="w-10 h-10 text-primary-300" />
                </div>
                <h3 className="text-lg font-bold mb-1.5">等待核验</h3>
                <p className="text-sm text-primary-200 text-center">请扫描访客二维码<br />或选择左侧演示数据快速体验</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, badgeClass }: { icon: any; label: string; value: string; badgeClass?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-4 h-4 text-accent/80 flex-shrink-0" />
      <span className="text-white/60 w-20 flex-shrink-0">{label}</span>
      {badgeClass ? (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badgeClass}`}>{value}</span>
      ) : (
        <span className="text-white font-medium">{value}</span>
      )}
    </div>
  );
}
