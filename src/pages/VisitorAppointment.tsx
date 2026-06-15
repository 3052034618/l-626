import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { User, Phone, Users, FileText, Calendar, Clock, Sparkles, QrCode, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Appointment, TimeSlot, User as UserT } from '@shared/types';
import { api } from '../api';
import { todayStr } from '../utils';
import { useAuthStore } from '../store/auth';

export default function VisitorAppointment() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState<UserT[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    visitorName: user?.role === 'visitor' ? user.name : '',
    visitorPhone: user?.role === 'visitor' ? user.phone : '',
    visitedEmployeeId: '',
    purpose: '',
    appointmentDate: todayStr(),
    appointmentTime: '',
  });
  const [created, setCreated] = useState<Appointment | null>(null);

  useEffect(() => {
    api.getUsers('employee').then(setEmployees);
  }, []);

  useEffect(() => {
    if (form.appointmentDate) {
      api.getTimeSlots(form.appointmentDate).then(setSlots);
    }
  }, [form.appointmentDate]);

  const densityStyle = (d: TimeSlot['density']) => ({
    low: 'bg-accent-50 border-accent-200 text-accent-600 hover:bg-accent-100',
    medium: 'bg-warning-50 border-warning-200 text-warning-500 hover:bg-warning-100',
    high: 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100 opacity-60',
  }[d]);

  const densityLabel = (d: TimeSlot['density']) => ({
    low: '空闲',
    medium: '适中',
    high: '繁忙',
  }[d]);

  const canNext = step === 1
    ? form.visitorName && form.visitorPhone && form.visitedEmployeeId && form.purpose
    : step === 2 && form.appointmentTime;

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const appt = await api.createAppointment(form);
      setCreated(appt);
      setStep(3);
    } catch (err: any) {
      setError(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 3 && created) {
    return (
      <div className="min-h-full bg-gradient-to-br from-primary-50 via-white to-accent-50 p-8 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-card-hover p-8 animate-fade-up">
          <div className="text-center mb-6">
            <div className="inline-flex w-16 h-16 rounded-full bg-accent-100 items-center justify-center mb-4 animate-pulse-slow">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-black text-ink-800">预约提交成功</h2>
            <p className="text-ink-500 mt-1 text-sm">请按时到访，二维码将锁定 15 分钟</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-2xl shadow-glow-sm border-2 border-accent/30">
              <QRCodeSVG value={created.qrCode} size={180} level="H" includeMargin />
            </div>
          </div>

          <div className="bg-ink-50 rounded-2xl p-4 space-y-2.5 mb-6 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">预约编号</span><span className="font-mono font-bold text-ink-800">{created.id.toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">访客姓名</span><span className="font-medium text-ink-800">{created.visitorName}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">被访员工</span><span className="font-medium text-ink-800">{created.visitedEmployeeName} · {created.visitedDepartment}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">预约时间</span><span className="font-medium text-ink-800">{created.appointmentDate} {created.appointmentTime}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">来访事由</span><span className="font-medium text-ink-800 text-right max-w-[55%]">{created.purpose}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setStep(1); setCreated(null); setForm({ ...form, appointmentTime: '', purpose: '' }); }}
              className="py-3 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50 transition-colors"
            >
              继续预约
            </button>
            <button
              onClick={() => navigate('/visitor/my-appointments')}
              className="py-3 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold shadow-lg shadow-primary-700/30 hover:shadow-xl transition-all"
            >
              查看我的预约
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-primary-50 via-white to-accent-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-primary-700" />
            访客预约登记
          </h1>
          <p className="text-ink-500 mt-1.5">填写信息并选择时段，完成预约后获取通行二维码</p>
        </div>

        <div className="flex items-center gap-3 mb-8 animate-fade-up animate-stagger-1">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= n ? 'bg-primary-700 text-white shadow-lg shadow-primary-700/30' : 'bg-ink-100 text-ink-400'}`}>
                {n}
              </div>
              <span className={`text-sm font-medium ${step >= n ? 'text-ink-800' : 'text-ink-400'}`}>
                {n === 1 ? '填写信息' : '选择时段'}
              </span>
              {n < 2 && <div className={`w-16 h-0.5 rounded ${step > n ? 'bg-primary-500' : 'bg-ink-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-card p-8 animate-fade-up animate-stagger-2">
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-red-700 text-sm">预约失败</div>
                <div className="text-sm text-red-600 mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary-500" /> 访客姓名
                  </label>
                  <input value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} placeholder="请输入您的姓名" className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-primary-500" /> 联系电话
                  </label>
                  <input value={form.visitorPhone} onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })} placeholder="请输入手机号" className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary-500" /> 被访员工
                </label>
                <select value={form.visitedEmployeeId} onChange={(e) => setForm({ ...form, visitedEmployeeId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all">
                  <option value="">请选择被访员工</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} · {e.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary-500" /> 来访事由
                </label>
                <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={3} placeholder="请简要说明来访事由" className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none" />
              </div>

              <button
                onClick={() => canNext && setStep(2)}
                disabled={!canNext}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold shadow-lg shadow-primary-700/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                下一步：选择时段
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary-500" /> 预约日期
                </label>
                <input type="date" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value, appointmentTime: '' })} className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-ink-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary-500" /> 可选时段
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span className="text-ink-500">系统根据预约密度智能推荐</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2.5">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setForm({ ...form, appointmentTime: s.time })}
                      className={`relative py-2.5 px-2 rounded-xl border text-sm font-medium transition-all ${form.appointmentTime === s.time ? 'ring-2 ring-primary-500 ring-offset-2 border-primary-500 bg-primary-50 text-primary-700' : s.available ? `border ${densityStyle(s.density)}` : 'bg-ink-50 border-ink-200 text-ink-300 cursor-not-allowed'}`}
                    >
                      <div className="font-bold">{s.time}</div>
                      {s.available && <div className="text-[10px] mt-0.5 opacity-80">{densityLabel(s.density)}</div>}
                      {!s.available && <div className="text-[10px] mt-0.5">已满</div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50 transition-colors">
                  返回上一步
                </button>
                <button
                  onClick={submit}
                  disabled={!canNext || submitting}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary-700 to-accent text-white font-bold shadow-lg shadow-primary-700/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  {submitting ? '提交中...' : '提交预约'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
