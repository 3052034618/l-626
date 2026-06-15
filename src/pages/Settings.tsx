import { Settings, Clock, Shield, Bell, Save, Check } from 'lucide-react';
import { useState } from 'react';

export default function SystemSettings() {
  const [config, setConfig] = useState({
    lockMinutes: 15,
    autoApproveHours: 24,
    maxPerSlot: 5,
    notifyTimeout: true,
    notifyApproval: true,
    notifyBlacklist: true,
    workStart: '09:00',
    workEnd: '18:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-full bg-ink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-black text-ink-800 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-primary-700" />
            系统设置
          </h1>
          <p className="text-ink-500 mt-1 text-sm">预约规则、通知与全局配置</p>
        </div>

        <div className="space-y-5">
          <Section title="预约规则" icon={Clock} desc="访客预约的时间与数量限制">
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="二维码锁定时长（分钟）" hint="预约成功后二维码锁定的时间，超时未到自动释放">
                <input type="number" value={config.lockMinutes} onChange={(e) => setConfig({ ...config, lockMinutes: +e.target.value })} className="input" />
              </Field>
              <Field label="自动审批时长（小时）" hint="被访员工超此时长未处理则自动通过">
                <input type="number" value={config.autoApproveHours} onChange={(e) => setConfig({ ...config, autoApproveHours: +e.target.value })} className="input" />
              </Field>
              <Field label="单时段最大访客数" hint="同一时段允许的最大预约人数">
                <input type="number" value={config.maxPerSlot} onChange={(e) => setConfig({ ...config, maxPerSlot: +e.target.value })} className="input" />
              </Field>
            </div>
            <div className="mt-5 pt-5 border-t border-ink-100">
              <div className="text-sm font-bold text-ink-700 mb-3">工作时段设置</div>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="上班时间">
                  <input type="time" value={config.workStart} onChange={(e) => setConfig({ ...config, workStart: e.target.value })} className="input" />
                </Field>
                <Field label="下班时间">
                  <input type="time" value={config.workEnd} onChange={(e) => setConfig({ ...config, workEnd: e.target.value })} className="input" />
                </Field>
                <Field label="午休开始">
                  <input type="time" value={config.lunchStart} onChange={(e) => setConfig({ ...config, lunchStart: e.target.value })} className="input" />
                </Field>
                <Field label="午休结束">
                  <input type="time" value={config.lunchEnd} onChange={(e) => setConfig({ ...config, lunchEnd: e.target.value })} className="input" />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="通知设置" icon={Bell} desc="系统自动通知的触发条件">
            <div className="space-y-3">
              <Toggle label="超时未到访通知" desc="预约超时后自动通知候补访客和被访人" checked={config.notifyTimeout} onChange={(v) => setConfig({ ...config, notifyTimeout: v })} />
              <Toggle label="待审批提醒" desc="新预约到达时通知被访员工" checked={config.notifyApproval} onChange={(v) => setConfig({ ...config, notifyApproval: v })} />
              <Toggle label="黑名单拦截通知" desc="黑名单访客尝试预约时通知管理员" checked={config.notifyBlacklist} onChange={(v) => setConfig({ ...config, notifyBlacklist: v })} />
            </div>
          </Section>

          <Section title="安全策略" icon={Shield} desc="系统安全与核验相关配置">
            <div className="space-y-3">
              <Toggle label="启用黑名单拦截" desc="黑名单访客预约时自动拦截并推送原因" checked={true} onChange={() => {}} />
              <Toggle label="核验有效期校验" desc="扫码时校验二维码是否过期" checked={true} onChange={() => {}} />
              <Toggle label="出入记录留痕" desc="所有核验操作均记录操作人与时间" checked={true} onChange={() => {}} />
            </div>
          </Section>

          <div className="flex justify-end">
            <button
              onClick={save}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold shadow-lg shadow-primary-700/30 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saved ? '已保存' : '保存设置'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 14px;
          outline: none;
          transition: all 0.15s;
        }
        .input:focus {
          border-color: #2667a4;
          box-shadow: 0 0 0 3px rgba(38, 103, 164, 0.1);
        }
      `}</style>
    </div>
  );
}

function Section({ title, desc, icon: Icon, children }: { title: string; desc?: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-up">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary-700" />
        </div>
        <div>
          <h3 className="font-bold text-ink-800">{title}</h3>
          {desc && <p className="text-xs text-ink-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-ink-50 cursor-pointer transition-colors">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full flex-shrink-0 mt-0.5 transition-colors ${checked ? 'bg-accent' : 'bg-ink-200'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-800">{label}</div>
        {desc && <div className="text-xs text-ink-400 mt-0.5">{desc}</div>}
      </div>
    </label>
  );
}
