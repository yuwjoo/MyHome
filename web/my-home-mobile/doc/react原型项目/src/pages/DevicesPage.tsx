import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import {
  ChevronLeftIcon,
  ThermometerIcon, WindIcon, TvIcon, LockIcon, CameraIcon, SunIcon, MusicIcon,
  ZapIcon, SearchIcon
} from 'lucide-react';
import { SmartDevice } from '../types';

// ── Shared mock data (same as HomePage) ──
const INITIAL_DEVICES: SmartDevice[] = [
  { id: 'd1', name: `客厅灯`,     type: 'light',   room: `客厅`, isOn: true,  value: `75%`    },
  { id: 'd2', name: `主卧空调`,   type: 'ac',      room: `主卧`, isOn: true,  value: `26°C`   },
  { id: 'd3', name: `客厅电视`,   type: 'tv',      room: `客厅`, isOn: false, value: `已关闭` },
  { id: 'd4', name: `入户门锁`,   type: 'lock',    room: `玄关`, isOn: true,  value: `已锁定` },
  { id: 'd5', name: `走廊摄像头`, type: 'camera',  room: `走廊`, isOn: true,  value: `录制中` },
  { id: 'd6', name: `卧室窗帘`,   type: 'curtain', room: `主卧`, isOn: false, value: `已收起` },
  { id: 'd7', name: `客厅风扇`,   type: 'fan',     room: `客厅`, isOn: true,  value: `3档`    },
  { id: 'd8', name: `智能音箱`,   type: 'speaker', room: `书房`, isOn: true,  value: `播放中` },
];

const DEVICE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  light:   SunIcon,
  ac:      ThermometerIcon,
  tv:      TvIcon,
  fan:     WindIcon,
  lock:    LockIcon,
  camera:  CameraIcon,
  curtain: WindIcon,
  speaker: MusicIcon,
};

const DEVICE_COLORS: Record<string, { on: string }> = {
  light:   { on: `bg-amber-100 text-amber-600`    },
  ac:      { on: `bg-cyan-100 text-cyan-600`      },
  tv:      { on: `bg-blue-100 text-blue-600`      },
  fan:     { on: `bg-emerald-100 text-emerald-600`},
  lock:    { on: `bg-green-100 text-green-600`    },
  camera:  { on: `bg-rose-100 text-rose-500`      },
  curtain: { on: `bg-indigo-100 text-indigo-500`  },
  speaker: { on: `bg-purple-100 text-purple-600`  },
};

const DEVICE_LABELS: Record<string, string> = {
  light:   `灯光`,
  ac:      `空调`,
  tv:      `电视`,
  fan:     `风扇`,
  lock:    `门锁`,
  camera:  `摄像头`,
  curtain: `窗帘`,
  speaker: `音箱`,
};

const ALL_TAB = `全部`;

export default function DevicesPage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<SmartDevice[]>(INITIAL_DEVICES);
  const [activeRoom, setActiveRoom] = useState<string>(ALL_TAB);
  const [search, setSearch] = useState(``);

  const rooms = [ALL_TAB, ...Array.from(new Set(INITIAL_DEVICES.map(d => d.room)))];

  const onCount = devices.filter(d => d.isOn).length;

  const toggleDevice = (id: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id !== id) return d;
      const next = { ...d, isOn: !d.isOn };
      toast.success(`${next.name} 已${next.isOn ? `开启` : `关闭`}`);
      return next;
    }));
  };

  const filtered = devices.filter(d => {
    const matchRoom = activeRoom === ALL_TAB || d.room === activeRoom;
    const matchSearch = search === `` || d.name.includes(search) || d.room.includes(search) || DEVICE_LABELS[d.type]?.includes(search);
    return matchRoom && matchSearch;
  });

  return (
    <div data-cmp="DevicesPage" className="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32">
      <Toaster position="top-center" richColors />

      {/* ── Header ── */}
      <header className="px-5 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom"
          >
            <ChevronLeftIcon size={18} className="text-foreground" strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <div className="text-xl font-bold text-foreground">设备控制</div>
            <div className="text-xs text-muted-foreground mt-0.5">{onCount} 台运行中 · 共 {devices.length} 台</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索设备名称 / 房间 / 类型"
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div className="px-5 mb-4">
        <div className="storage-gradient rounded-2xl px-4 py-3 flex items-center justify-between shadow-custom">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <ZapIcon size={16} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="text-white text-sm font-bold">{onCount} / {devices.length} 台运行中</div>
              <div className="text-white/60 text-[11px]">点击开关可控制设备</div>
            </div>
          </div>
          <button
            onClick={() => {
              const allOn = devices.every(d => d.isOn);
              setDevices(prev => prev.map(d => ({ ...d, isOn: !allOn })));
              toast.success(allOn ? `已关闭所有设备` : `已开启所有设备`);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-semibold active:scale-95 transition-transform"
          >
            {devices.every(d => d.isOn) ? `全部关闭` : `全部开启`}
          </button>
        </div>
      </div>

      {/* ── Room Tabs ── */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {rooms.map(room => (
            <button
              key={room}
              onClick={() => setActiveRoom(room)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeRoom === room
                  ? `bg-primary text-primary-foreground shadow-custom`
                  : `bg-card border border-border text-muted-foreground`
              }`}
            >
              {room}
            </button>
          ))}
        </div>
      </div>

      {/* ── Device List ── */}
      <div className="px-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <SearchIcon size={36} strokeWidth={1.5} className="mb-3 opacity-30" />
            <div className="text-sm font-medium">未找到匹配设备</div>
            <div className="text-xs mt-1 opacity-60">试试换个关键词或房间</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(device => {
              const DevIcon = DEVICE_ICON_MAP[device.type] ?? SunIcon;
              const colors = DEVICE_COLORS[device.type];
              return (
                <div
                  key={device.id}
                  className={`relative flex flex-col bg-card rounded-2xl p-4 shadow-custom border transition-all ${device.isOn ? `border-primary/20` : `border-border`}`}
                >
                  {/* Toggle — top right */}
                  <button
                    onClick={() => toggleDevice(device.id)}
                    className={`absolute top-3 right-3 w-10 h-5 rounded-full transition-all flex-shrink-0 ${device.isOn ? `bg-primary` : `bg-muted`}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${device.isOn ? `left-5` : `left-0.5`}`} />
                  </button>

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${device.isOn ? colors.on : `bg-muted text-muted-foreground`}`}>
                    <DevIcon size={18} strokeWidth={2} />
                  </div>

                  {/* Name */}
                  <div className="text-sm font-semibold text-foreground leading-tight mb-0.5">{device.name}</div>

                  {/* Room + status */}
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{device.room}</span>
                    <span className={`text-[11px] font-medium ${device.isOn ? `text-primary` : `text-muted-foreground`}`}>
                      {device.isOn ? device.value : `已关闭`}
                    </span>
                  </div>

                  {/* Type label */}
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                      {DEVICE_LABELS[device.type]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
