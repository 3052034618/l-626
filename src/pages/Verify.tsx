import { useState } from 'react';
import {
  ScanLine, QrCode, CheckCircle, XCircle, AlertTriangle, Clock, Users,
  Calendar, ShieldAlert, Maximize2, LogIn, LogOut, Zap, FileText,
  ArrowRight, BadgeCheck, UserCheck
} from 'lucide-react';
import type { Appointment, VerifyResult } from '@shared/types';
import { api } from '../api';
import { useAuthStore } from '../store/auth';
import { statusLabels, statusColors, formatDateTime } from '../utils';

const rejectCategoryLabels: Record<string, string> = {
  blacklist: '黑名单拦截',
  pending: '待审批',
  rejected: '已拒绝',
  expired: '二维码过期',
  checked_out: '已离场',
  other: '其他原因',
};

export default function Verify() {
  const user = useAuthStore((s) => s.user);
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [verifiedAppt, setVerifiedAppt] = useState<Appointment | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | 'check_in' | 'check_out'>(null);
  const [lastRecord, setLastRecord] = useState<any>(null);

  const demoCodes = [
    { code: 'QR-VISITOR-A1-20260615', label: '刘客户 · 已通过（入场）' },
    { code: 'QR-VISITOR-A2-20260615', label: '孙合作方 · 已入场（离场）' },
    { code: 'QR-VISITOR-A3-20260615', label: '周面试者 · 待审批' },
    { code: 'QR-VISITOR-INVALID', label: '无效二维码' },
  ];

  const executeAction = async (action: 'check_in' | 'check_out', appt: Appointment) => {
    try {
      const updated = await api.updateAppointmentStatus(appt.id, action);
      const record = await api.createAccessRecord({
        appointmentId: appt.id,
        visitorName: appt.visitorName,
        visitorPhone: appt.visitorPhone,
        action,
        operatorId: user?.id,
        operatorName: user?.name,
        appointmentStatusBefore: appt.status,
        appointmentStatusAfter: updated.status,
        verifyResult: 'success',
      });
      setLastRecord(record);
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
    setLastRecord(null);
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
        const record = await api.createAccessRecord({
          appointmentId: r.appointment.id,
          visitorName: r.appointment.visitorName,
          visitorPhone: r.appointment.visitorPhone,
          action: 'rejected',
          operatorId: user?.id,
          operatorName: user?.name,
          appointmentStatusBefore: r.appointment.status,
          appointmentStatusAfter: r.appointment.status,
          verifyResult: 'failed',
          rejectCategory: r.rejectCategory,
          remark: r.message,
        });
        setLastRecord(record);
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <ScanLine className="w-6 h-6 text-accent" />
            扫码核验
          </h1>
          <p className="text-primary-200 mt-1 text-sm">扫描访客二维码或手动输入编号进行核验 · 操作全程留痕可追溯</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
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

          <div className="lg:col-span-2 space-y-5">
            {result ? (
              <>
                <div className={`rounded-3xl p-6 backdrop-blur-sm border animate-fade-up ${result.success ? 'bg-accent/10 border-accent/30' : 'bg-warning-400/10 border-warning-400/30'}`}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${result.success ? 'bg-accent/20' : 'bg-warning-400/20'}`}>
                      {result.success ? (
                        confirmAction === 'check_in' ? <LogIn className="w-7 h-7 text-accent" /> :
                        confirmAction === 'check_out' ? <LogOut className="w-7 h-7 text-accent" /> :
                        <CheckCircle className="w-7 h-7 text-accent" />
                      ) : result.isBlacklisted ? (
                        <ShieldAlert className="w-7 h-7 text-warning-400" />
                      ) : (
                        <AlertTriangle className="w-7 h-7 text-warning-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xl font-black ${result.success ? 'text-accent' : 'text-warning-300'}`}>
                        {confirmAction === 'check_in' ? '待入场登记' :
                         confirmAction === 'check_out' ? '待离场登记' :
                         result.success ? '核验通过' : '核验不通过'}
                      </h3>
                      <p className="text-sm text-white/70 mt-0.5">{result.message}</p>
                    </div>
                    {result.rejectCategory && (
                      <div className="px-3 py-1.5 rounded-lg bg-warning-400/20 border border-warning-400/30 text-xs font-bold text-warning-300 whitespace-nowrap">
                        {rejectCategoryLabels[result.rejectCategory] || result.rejectCategory}
                      </div>
                    )}
                  </div>

                  {verifiedAppt && (
                    <div className="grid sm:grid-cols-2 gap-2.5 text-sm bg-black/20 rounded-2xl p-4 mb-5">
                      <InfoRow icon={Users} label="访客" value={`${verifiedAppt.visitorName} · ${verifiedAppt.visitorPhone}`} />
                      <InfoRow icon={UserCheck} label="被访" value={`${verifiedAppt.visitedEmployeeName} · ${verifiedAppt.visitedDepartment}`} />
                      <InfoRow icon={Calendar} label="预约时间" value={`${verifiedAppt.appointmentDate} ${verifiedAppt.appointmentTime}`} />
                      <InfoRow icon={Clock} label="过期时间" value={formatDateTime(verifiedAppt.expiresAt)} />
                      <InfoRow
                        icon={BadgeCheck}
                        label="当前状态"
                        value={
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusColors[verifiedAppt.status]}`}>
                            {statusLabels[verifiedAppt.status]}
                          </span>
                        }
                      />
                      {verifiedAppt.autoApproved && verifiedAppt.approvedAt && (
                        <InfoRow icon={Zap} label="自动通过" value={formatDateTime(verifiedAppt.approvedAt)} />
                      )}
                      {verifiedAppt.checkedInAt && (
                        <InfoRow icon={LogIn} label="入场时间" value={formatDateTime(verifiedAppt.checkedInAt)} />
                      )}
                      {verifiedAppt.checkedOutAt && (
                        <InfoRow icon={LogOut} label="离场时间" value={formatDateTime(verifiedAppt.checkedOutAt)} />
                      )}
                    </div>
                  )}

                  {confirmAction && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/70 font-medium hover:bg-white/5 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={confirmDoAction}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-400 text-ink-900 font-bold shadow-glow-sm hover:shadow-glow transition-all flex items-center justify-center gap-2"
                      >
                        {confirmAction === 'check_in' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                        确认{confirmAction === 'check_in' ? '入场' : '离场'}
                      </button>
                    </div>
                  )}
                </div>

                {lastRecord && (
                  <div className="rounded-3xl p-5 backdrop-blur-sm bg-black/30 border border-white/10 animate-fade-up">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-primary-300" />
                      <h4 className="text-sm font-bold text-primary-200">出入记录快照 · 本次操作写入</h4>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <AuditItem label="记录类型" value={
                        lastRecord.action === 'check_in' ? '入场登记' :
                        lastRecord.action === 'check_out' ? '离场登记' : '核验拒绝'
                      } />
                      <AuditItem label="核验结果" value={
                        lastRecord.verifyResult === 'success'
                          ? <span className="text-accent font-bold">成功</span>
                          : <span className="text-warning-400 font-bold">失败</span>
                      } />
                      <AuditItem label="操作人" value={lastRecord.operatorName || user?.name || '未知'} />
                      <AuditItem label="操作时间" value={formatDateTime(lastRecord.timestamp)} />
                      {lastRecord.appointmentStatusBefore && (
                        <AuditItem label="操作前状态" value={statusLabels[lastRecord.appointmentStatusBefore as keyof typeof statusLabels]} />
                      )}
                      {lastRecord.appointmentStatusAfter && (
                        <AuditItem
                          label="操作后状态"
                          value={
                            <div className="flex items-center gap-1.5">
                              <ArrowRight className="w-3 h-3 text-accent" />
                              <span className={statusColors[lastRecord.appointmentStatusAfter as keyof typeof statusColors] + " px-2 py-0.5 rounded-full text-xs font-bold border"}>
                                {statusLabels[lastRecord.appointmentStatusAfter as keyof typeof statusLabels]}
                              </span>
                            </div>
                          }
                        />
                      )}
                      {lastRecord.rejectCategory && (
                        <AuditItem label="失败分类" value={rejectCategoryLabels[lastRecord.rejectCategory] || lastRecord.rejectCategory} />
                      )}
                      {lastRecord.remark && (
                        <div className="sm:col-span-2">
                          <div className="text-xs text-primary-300 mb-1">备注/原因</div>
                          <div className="text-sm text-white/80 bg-white/5 rounded-lg px-3 py-2">{lastRecord.remark}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {result.previewRecord && !lastRecord && (
                  <div className="rounded-3xl p-5 backdrop-blur-sm bg-white/5 border border-white/10 border-dashed animate-fade-up">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-primary-300" />
                      <h4 className="text-sm font-bold text-primary-200">记录预览 · 确认后将写入以下内容</h4>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <AuditItem label="记录类型" value={
                        result.previewRecord.action === 'check_in' ? '入场登记' :
                        result.previewRecord.action === 'check_out' ? '离场登记' : '核验拒绝'
                      } />
                      <AuditItem label="核验结果" value={
                        result.previewRecord.verifyResult === 'success'
                          ? <span className="text-accent font-bold">成功</span>
                          : <span className="text-warning-400 font-bold">失败</span>
                      } />
                      <AuditItem label="操作人" value={user?.name || '当前操作员'} />
                      <AuditItem label="状态变化" value={
                        <div className="flex items-center gap-1.5">
                          <span className={statusColors[result.previewRecord.appointmentStatusBefore as keyof typeof statusColors] + " px-2 py-0.5 rounded-full text-xs font-bold border"}>
                            {statusLabels[result.previewRecord.appointmentStatusBefore as keyof typeof statusLabels]}
                          </span>
                          <ArrowRight className="w-3 h-3 text-primary-400" />
                          <span className={statusColors[result.previewRecord.appointmentStatusAfter as keyof typeof statusColors] + " px-2 py-0.5 rounded-full text-xs font-bold border"}>
                            {statusLabels[result.previewRecord.appointmentStatusAfter as keyof typeof statusLabels]}
                          </span>
                        </div>
                      } />
                      {result.previewRecord.rejectCategory && (
                        <AuditItem label="失败分类" value={rejectCategoryLabels[result.previewRecord.rejectCategory] || result.previewRecord.rejectCategory} />
                      )}
                      {result.previewRecord.remark && (
                        <div className="sm:col-span-2">
                          <div className="text-xs text-primary-300 mb-1">备注/原因</div>
                          <div className="text-sm text-white/60 bg-white/5 rounded-lg px-3 py-2">{result.previewRecord.remark}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl p-8 backdrop-blur-sm bg-white/5 border border-white/10 flex flex-col items-center justify-center min-h-[400px] animate-fade-up animate-stagger-2">
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

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-accent/80 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-white/60 text-xs mb-0.5">{label}</div>
        <div className="text-white font-medium text-sm">{value}</div>
      </div>
    </div>
  );
}

function AuditItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-primary-300 mb-1">{label}</div>
      <div className="text-sm text-white font-medium">{value}</div>
    </div>
  );
}
