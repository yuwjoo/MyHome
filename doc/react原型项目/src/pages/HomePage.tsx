import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import {
  BellIcon, ThermometerIcon, WindIcon, TvIcon, LockIcon, CameraIcon, SunIcon, MusicIcon,
  ZapIcon, WifiIcon, CarIcon, GamepadIcon, BikeIcon, RatIcon, ChevronRightIcon,
  PlayIcon, PauseIcon, UserCircleIcon
} from 'lucide-react';
import { SmartDevice } from '../types';

// ── Mock devices ──
const INITIAL_DEVICES: SmartDevice[] = [
  { id: 'd1', name: `客厅灯`,   type: 'light',   room: `客厅`, isOn: true,  value: `75%`     },
  { id: 'd2', name: `主卧空调`, type: 'ac',      room: `主卧`, isOn: true,  value: `26°C`    },
  { id: 'd3', name: `客厅电视`, type: 'tv',      room: `客厅`, isOn: false, value: `已关闭`  },
  { id: 'd4', name: `入户门锁`, type: 'lock',    room: `玄关`, isOn: true,  value: `已锁定`  },
  { id: 'd5', name: `走廊摄像头`,type:'camera',  room: `走廊`, isOn: true,  value: `录制中`  },
  { id: 'd6', name: `卧室窗帘`, type: 'curtain', room: `主卧`, isOn: false, value: `已收起`  },
  { id: 'd7', name: `客厅风扇`, type: 'fan',     room: `客厅`, isOn: true,  value: `3档`     },
  { id: 'd8', name: `智能音箱`, type: 'speaker', room: `书房`, isOn: true,  value: `播放中`  },
];

const SHORTCUT_CARDS = [
  { id: 's1', icon: CarIcon,     label: `小车遥控`,  color: `bg-primary/10 text-primary`,       badge: ``     },
  { id: 's2', icon: GamepadIcon, label: `小游戏`,    color: `bg-emerald-100 text-emerald-600`,  badge: `NEW`  },
  { id: 's3', icon: BikeIcon,    label: `小电驴`,    color: `bg-amber-100 text-amber-600`,      badge: ``     },
  { id: 's4', icon: RatIcon,     label: `仓鼠监控`,  color: `bg-rose-100 text-rose-500`,        badge: `在线` },
  { id: 's5', icon: WifiIcon,    label: `网络状态`,  color: `bg-cyan-100 text-cyan-600`,        badge: ``     },
  { id: 's6', icon: ZapIcon,     label: `用电统计`,  color: `bg-purple-100 text-purple-600`,    badge: ``     },
];

const DEVICE_ICON_MAP: Record<string, React.ComponentType<{size?: number; strokeWidth?: number; className?: string}>> = {
  light:   SunIcon,
  ac:      ThermometerIcon,
  tv:      TvIcon,
  fan:     WindIcon,
  lock:    LockIcon,
  camera:  CameraIcon,
  curtain: WindIcon,
  speaker: MusicIcon,
};

const DEVICE_COLORS: Record<string, { on: string; off: string; icon: string }> = {
  light:   { on: `bg-amber-100 text-amber-600`,    off: `bg-muted text-muted-foreground`, icon: `text-amber-500`   },
  ac:      { on: `bg-cyan-100 text-cyan-600`,      off: `bg-muted text-muted-foreground`, icon: `text-cyan-500`    },
  tv:      { on: `bg-blue-100 text-blue-600`,      off: `bg-muted text-muted-foreground`, icon: `text-blue-500`    },
  fan:     { on: `bg-emerald-100 text-emerald-600`,off: `bg-muted text-muted-foreground`, icon: `text-emerald-500` },
  lock:    { on: `bg-green-100 text-green-600`,    off: `bg-muted text-muted-foreground`, icon: `text-green-500`   },
  camera:  { on: `bg-rose-100 text-rose-500`,      off: `bg-muted text-muted-foreground`, icon: `text-rose-400`    },
  curtain: { on: `bg-indigo-100 text-indigo-500`,  off: `bg-muted text-muted-foreground`, icon: `text-indigo-500`  },
  speaker: { on: `bg-purple-100 text-purple-600`,  off: `bg-muted text-muted-foreground`, icon: `text-purple-500`  },
};

export default function HomePage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<SmartDevice[]>(INITIAL_DEVICES);

  const onDevicesCount = devices.filter(d => d.isOn).length;

  const toggleDevice = (id: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id !== id) return d;
      const next = { ...d, isOn: !d.isOn };
      toast.success(`${next.name} 已${next.isOn ? `开启` : `关闭`}`);
      console.log(`[SmartHome] toggle device ${id}: ${next.isOn}`);
      return next;
    }));
  };

  return (
    <div data-cmp="HomePage" className="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32">
      <Toaster position="top-center" richColors />

      {/* ── Header ── */}
      <header className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserCircleIcon size={24} className="text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">欢迎回来 👋</div>
              <div className="text-xl font-bold text-foreground">智能家居</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/messages')}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom"
          >
            <BellIcon size={18} className="text-foreground" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* ── Overview Card ── */}
      <div className="px-5 mb-5">
        <div className="storage-gradient rounded-3xl px-5 py-4 shadow-custom">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/70 text-xs font-medium mb-0.5">设备总览</div>
              <div className="text-white text-3xl font-bold leading-tight">{onDevicesCount}</div>
              <div className="text-white/60 text-xs mt-0.5">台运行中 · 共 {devices.length} 台</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <ZapIcon size={22} className="text-white" strokeWidth={2} />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                <span className="text-white/70 text-[11px]">全部正常</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scene Modes ── */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">场景模式</span>
        </div>
        <div className="flex gap-3">
          {[
            { label: `离家模式`, icon: LockIcon, active: false },
            { label: `影院模式`, icon: PlayIcon, active: false },
            { label: `睡眠模式`, icon: PauseIcon, active: true  },
          ].map(scene => {
            const ScIcon = scene.icon;
            return (
              <button
                key={scene.label}
                onClick={() => toast.success(`已切换到${scene.label}`)}
                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${scene.active ? `bg-primary/10 border-primary/30 text-primary` : `bg-card border-border text-muted-foreground`}`}
              >
                <ScIcon size={18} strokeWidth={2} />
                <span className="text-[11px] font-semibold">{scene.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Device Cards ── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">设备控制</span>
          <button onClick={() => navigate('/devices')} className="flex items-center gap-1 text-xs text-primary font-medium">
            全部 <ChevronRightIcon size={12} strokeWidth={2.5} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {devices.slice(0, 4).map(device => {
            const DevIcon = DEVICE_ICON_MAP[device.type] ?? SunIcon;
            const colors = DEVICE_COLORS[device.type];
            return (
              <div
                key={device.id}
                onClick={() => { if (device.type === `ac`) navigate(`/ac-remote`); }}
                className={`relative flex flex-col bg-card rounded-2xl p-4 shadow-custom border border-border ${device.type === `ac` ? `cursor-pointer active:scale-95 transition-transform` : ``}`}
              >
                {/* Toggle — top right */}
                <button
                  onClick={e => { e.stopPropagation(); toggleDevice(device.id); }}
                  className={`absolute top-3 right-3 w-10 h-5 rounded-full transition-all flex-shrink-0 ${device.isOn ? `bg-primary` : `bg-muted`}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${device.isOn ? `left-5` : `left-0.5`}`} />
                </button>

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${device.isOn ? colors.on : `bg-muted text-muted-foreground`}`}>
                  <DevIcon size={18} strokeWidth={2} />
                </div>

                {/* Name & status */}
                <div className="text-sm font-semibold text-foreground leading-tight mb-0.5">{device.name}</div>
                <div className="text-xs text-muted-foreground">{device.isOn ? device.value : `已关闭`}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Shortcut Cards ── */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">快捷入口</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {SHORTCUT_CARDS.map(card => {
            const CardIcon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => toast.info(`打开${card.label}`)}
                className="w-[calc(33.333%-8px)] aspect-square bg-card rounded-2xl flex flex-col items-center justify-center gap-2 shadow-custom border border-border active:scale-95 transition-transform relative"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                  <CardIcon size={18} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{card.label}</span>
                {card.badge !== `` && (
                  <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${card.badge === `在线` ? `bg-emerald-500 text-white` : `bg-primary text-primary-foreground`}`}>
                    {card.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
