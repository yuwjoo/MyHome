import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  WindIcon,
  PowerIcon,
  SunIcon,
  MoonIcon,
  PlusIcon,
  MinusIcon,
  TimerIcon,
  ArrowUpDownIcon,
  GaugeIcon,
  ThermometerIcon,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

const COOL_HEAT_MODES = [`制冷`, `制热`];
const FAN_SPEEDS = [`自动`, `低速`, `中速`, `高速`];
const SWING_DIRS = [`关闭`, `上下`, `左右`, `全向`];

export default function AcRemotePage() {
  const navigate = useNavigate();
  const [isOn, setIsOn] = useState(true);
  const [temperature, setTemperature] = useState(26);
  const [modeIdx, setModeIdx] = useState(0);
  const [fanIdx, setFanIdx] = useState(0);
  const [swingIdx, setSwingIdx] = useState(0);
  const [sleepOn, setSleepOn] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [showTimerSheet, setShowTimerSheet] = useState(false);
  const [timerDraft, setTimerDraft] = useState(60);

  const handlePower = () => {
    const next = !isOn;
    setIsOn(next);
    toast.success(`主卧空调已${next ? `开启` : `关闭`}`);
  };

  const adjustTemp = (delta: number) => {
    if (!isOn) return;
    const next = Math.min(30, Math.max(16, temperature + delta));
    setTemperature(next);
    toast.success(`温度已调至 ${next}°C`);
  };

  const cycleMode = () => {
    if (!isOn) return;
    const next = (modeIdx + 1) % COOL_HEAT_MODES.length;
    setModeIdx(next);
    toast.success(`已切换为${COOL_HEAT_MODES[next]}模式`);
  };

  const cycleFan = () => {
    if (!isOn) return;
    const next = (fanIdx + 1) % FAN_SPEEDS.length;
    setFanIdx(next);
    toast.success(`风速已设为${FAN_SPEEDS[next]}`);
  };

  const cycleSwing = () => {
    if (!isOn) return;
    const next = (swingIdx + 1) % SWING_DIRS.length;
    setSwingIdx(next);
    toast.success(`风向已设为${SWING_DIRS[next]}`);
  };

  const toggleSleep = () => {
    if (!isOn) return;
    const next = !sleepOn;
    setSleepOn(next);
    toast.success(`睡眠模式已${next ? `开启` : `关闭`}`);
  };

  const handleTimerConfirm = () => {
    setTimerMinutes(timerDraft);
    setShowTimerSheet(false);
    const h = Math.floor(timerDraft / 60);
    const m = timerDraft % 60;
    const label = h > 0 ? `${h}小时${m > 0 ? `${m}分钟` : ``}` : `${m}分钟`;
    toast.success(`定时已设为 ${label}后关机`);
  };

  const cancelTimer = () => {
    setTimerMinutes(null);
    toast.success(`定时已取消`);
  };

  const modeLabel = COOL_HEAT_MODES[modeIdx];
  const fanLabel = FAN_SPEEDS[fanIdx];
  const swingLabel = SWING_DIRS[swingIdx];

  const timerLabel = (() => {
    if (timerMinutes === null) return null;
    const h = Math.floor(timerMinutes / 60);
    const m = timerMinutes % 60;
    return h > 0 ? `${h}h${m > 0 ? `${m}m` : ``}` : `${m}m`;
  })();

  const TIMER_OPTIONS = [30, 60, 90, 120, 180, 240, 300, 360, 480, 600];

  return (
    <div data-cmp="AcRemotePage" className="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-10">
      <Toaster position="top-center" richColors />

      {/* ── Header ── */}
      <header className="px-5 pt-10 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom"
        >
          <ChevronLeftIcon size={18} className="text-foreground" strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <div className="text-xl font-bold text-foreground">主卧空调</div>
          <div className="text-xs text-muted-foreground mt-0.5">智能遥控器</div>
        </div>
      </header>

      {/* ── Dashboard ── */}
      <div className="px-5 mb-6">
        <div className={`rounded-3xl px-6 py-6 shadow-custom transition-all ${isOn ? `storage-gradient` : `bg-muted`}`}>
          {/* Temperature — primary */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className={`text-xs font-medium mb-1 ${isOn ? `text-white/60` : `text-muted-foreground`}`}>设定温度</div>
              <div className={`text-7xl font-bold leading-none tracking-tight ${isOn ? `text-white` : `text-muted-foreground`}`}>
                {temperature}
                <span className={`text-3xl font-semibold ml-1 ${isOn ? `text-white/70` : `text-muted-foreground/70`}`}>°C</span>
              </div>
            </div>
            <div className={`flex flex-col items-end gap-1 text-right ${isOn ? `text-white/50` : `text-muted-foreground/50`}`}>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOn ? `bg-white/15 text-white/80` : `bg-muted-foreground/10 text-muted-foreground/60`}`}>
                {isOn ? `运行中` : `已关闭`}
              </div>
            </div>
          </div>

          {/* Status info row */}
          <div className={`grid grid-cols-4 gap-3 pt-4 border-t ${isOn ? `border-white/15` : `border-muted-foreground/10`}`}>
            <div className="flex flex-col items-center gap-1">
              <ThermometerIcon size={14} className={isOn ? `text-white/50` : `text-muted-foreground/40`} strokeWidth={2} />
              <div className={`text-[10px] font-medium ${isOn ? `text-white/50` : `text-muted-foreground/40`}`}>模式</div>
              <div className={`text-xs font-bold ${isOn ? `text-white` : `text-muted-foreground`}`}>{modeLabel}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <GaugeIcon size={14} className={isOn ? `text-white/50` : `text-muted-foreground/40`} strokeWidth={2} />
              <div className={`text-[10px] font-medium ${isOn ? `text-white/50` : `text-muted-foreground/40`}`}>风速</div>
              <div className={`text-xs font-bold ${isOn ? `text-white` : `text-muted-foreground`}`}>{fanLabel}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <WindIcon size={14} className={isOn ? `text-white/50` : `text-muted-foreground/40`} strokeWidth={2} />
              <div className={`text-[10px] font-medium ${isOn ? `text-white/50` : `text-muted-foreground/40`}`}>风向</div>
              <div className={`text-xs font-bold ${isOn ? `text-white` : `text-muted-foreground`}`}>{swingLabel}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MoonIcon size={14} className={isOn ? `text-white/50` : `text-muted-foreground/40`} strokeWidth={2} />
              <div className={`text-[10px] font-medium ${isOn ? `text-white/50` : `text-muted-foreground/40`}`}>睡眠</div>
              <div className={`text-xs font-bold ${isOn ? `text-white` : `text-muted-foreground`}`}>{sleepOn ? `开启` : `关闭`}</div>
            </div>
          </div>

          {/* Timer info */}
          {timerMinutes !== null && (
            <div className={`mt-3 pt-3 border-t flex items-center gap-1.5 ${isOn ? `border-white/15 text-white/70` : `border-muted-foreground/10 text-muted-foreground/60`}`}>
              <TimerIcon size={12} strokeWidth={2} />
              <span className="text-xs font-medium">{timerLabel} 后关机</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Control Buttons ── */}
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">

          {/* 开关机 */}
          <button
            onClick={handlePower}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 ${isOn ? `bg-cyan-500 border-transparent text-white` : `bg-card border-border text-muted-foreground`}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? `bg-white/20` : `bg-muted`}`}>
              <PowerIcon size={18} strokeWidth={2.5} className={isOn ? `text-white` : `text-muted-foreground`} />
            </div>
            <div className="flex flex-col items-start">
              <span className={`text-xs font-bold ${isOn ? `text-white` : `text-foreground`}`}>开关机</span>
              <span className={`text-[10px] mt-0.5 ${isOn ? `text-white/70` : `text-muted-foreground`}`}>{isOn ? `当前开启` : `当前关闭`}</span>
            </div>
          </button>

          {/* 加温度 */}
          <button
            onClick={() => adjustTemp(1)}
            disabled={!isOn}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 ${!isOn ? `opacity-40 cursor-not-allowed bg-card border-border` : `bg-card border-border hover:border-primary/40`}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? `bg-orange-100 text-orange-500` : `bg-muted text-muted-foreground`}`}>
              <PlusIcon size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold text-foreground">升温</span>
              <span className="text-[10px] mt-0.5 text-muted-foreground">最高 30°C</span>
            </div>
          </button>

          {/* 减温度 */}
          <button
            onClick={() => adjustTemp(-1)}
            disabled={!isOn}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 ${!isOn ? `opacity-40 cursor-not-allowed bg-card border-border` : `bg-card border-border hover:border-primary/40`}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? `bg-cyan-100 text-cyan-500` : `bg-muted text-muted-foreground`}`}>
              <MinusIcon size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold text-foreground">降温</span>
              <span className="text-[10px] mt-0.5 text-muted-foreground">最低 16°C</span>
            </div>
          </button>

          {/* 定时 */}
          {timerMinutes !== null ? (
            <button
              onClick={cancelTimer}
              disabled={!isOn}
              className={`flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 ${!isOn ? `opacity-40 cursor-not-allowed bg-card border-border` : `bg-primary/10 border-primary/30`}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? `bg-primary/20 text-primary` : `bg-muted text-muted-foreground`}`}>
                <TimerIcon size={18} strokeWidth={2} />
              </div>
              <div className="flex flex-col items-start">
                <span className={`text-xs font-bold ${isOn ? `text-primary` : `text-foreground`}`}>取消定时</span>
                <span className={`text-[10px] mt-0.5 ${isOn ? `text-primary/70` : `text-muted-foreground`}`}>{timerLabel} 后关机</span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => { if (!isOn) return; setShowTimerSheet(true); }}
              disabled={!isOn}
              className={`flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 ${!isOn ? `opacity-40 cursor-not-allowed bg-card border-border` : `bg-card border-border hover:border-primary/40`}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? `bg-violet-100 text-violet-500` : `bg-muted text-muted-foreground`}`}>
                <TimerIcon size={18} strokeWidth={2} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs font-bold text-foreground">定时</span>
                <span className="text-[10px] mt-0.5 text-muted-foreground">设置关机时间</span>
              </div>
            </button>
          )}

          {/* 风向 */}
          <button
            onClick={cycleSwing}
            disabled={!isOn}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 ${!isOn ? `opacity-40 cursor-not-allowed bg-card border-border` : `bg-card border-border hover:border-primary/40`}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? `bg-sky-100 text-sky-500` : `bg-muted text-muted-foreground`}`}>
              <ArrowUpDownIcon size={18} strokeWidth={2} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold text-foreground">风向</span>
              <span className="text-[10px] mt-0.5 text-muted-foreground">{swingLabel}</span>
            </div>
          </button>

          {/* 风速 */}
          <button
            onClick={cycleFan}
            disabled={!isOn}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 ${!isOn ? `opacity-40 cursor-not-allowed bg-card border-border` : `bg-card border-border hover:border-primary/40`}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? `bg-teal-100 text-teal-500` : `bg-muted text-muted-foreground`}`}>
              <WindIcon size={18} strokeWidth={2} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold text-foreground">风速</span>
              <span className="text-[10px] mt-0.5 text-muted-foreground">{fanLabel}</span>
            </div>
          </button>

          {/* 模式 */}
          <button
            onClick={cycleMode}
            disabled={!isOn}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 ${!isOn ? `opacity-40 cursor-not-allowed bg-card border-border` : `bg-card border-border hover:border-primary/40`}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? (modeIdx === 0 ? `bg-cyan-100 text-cyan-500` : `bg-orange-100 text-orange-500`) : `bg-muted text-muted-foreground`}`}>
              {modeIdx === 0 ? <SunIcon size={18} strokeWidth={2} /> : <ThermometerIcon size={18} strokeWidth={2} />}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold text-foreground">模式</span>
              <span className="text-[10px] mt-0.5 text-muted-foreground">{modeLabel}</span>
            </div>
          </button>

          {/* 睡眠 */}
          <button
            onClick={toggleSleep}
            disabled={!isOn}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 ${!isOn ? `opacity-40 cursor-not-allowed bg-card border-border` : sleepOn ? `bg-indigo-500 border-transparent text-white` : `bg-card border-border hover:border-primary/40`}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!isOn ? `bg-muted text-muted-foreground` : sleepOn ? `bg-white/20 text-white` : `bg-indigo-100 text-indigo-500`}`}>
              <MoonIcon size={18} strokeWidth={2} />
            </div>
            <div className="flex flex-col items-start">
              <span className={`text-xs font-bold ${!isOn ? `text-foreground` : sleepOn ? `text-white` : `text-foreground`}`}>睡眠</span>
              <span className={`text-[10px] mt-0.5 ${!isOn ? `text-muted-foreground` : sleepOn ? `text-white/70` : `text-muted-foreground`}`}>{sleepOn ? `已开启` : `已关闭`}</span>
            </div>
          </button>

        </div>
      </div>

      {/* ── Timer Bottom Sheet ── */}
      {showTimerSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowTimerSheet(false)}
          />
          {/* Sheet */}
          <div className="relative bg-background rounded-t-3xl px-5 pt-5 pb-10 shadow-xl max-w-md mx-auto w-full">
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5" />
            <div className="text-base font-bold text-foreground mb-1">设置定时</div>
            <div className="text-xs text-muted-foreground mb-5">选择多少时间后自动关机</div>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {TIMER_OPTIONS.map(min => {
                const h = Math.floor(min / 60);
                const m = min % 60;
                const label = h > 0 ? `${h}h${m > 0 ? `${m}m` : ``}` : `${m}m`;
                return (
                  <button
                    key={min}
                    onClick={() => setTimerDraft(min)}
                    className={`py-2.5 rounded-2xl text-xs font-semibold border transition-all active:scale-95 ${timerDraft === min ? `bg-primary text-primary-foreground border-transparent shadow-custom` : `bg-card border-border text-muted-foreground`}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleTimerConfirm}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all shadow-custom"
            >
              确认设置
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
