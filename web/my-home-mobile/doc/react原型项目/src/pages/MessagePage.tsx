import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, BellIcon, CheckCheckIcon } from 'lucide-react';

const MESSAGES = [
  { id: 'm1', title: '设备提醒', desc: '客厅灯已连续开启超过 8 小时', time: '10分钟前', read: false },
  { id: 'm2', title: '安全警报', desc: '入户门锁检测到异常开锁尝试', time: '1小时前', read: false },
  { id: 'm3', title: '场景通知', desc: '睡眠模式已于 23:00 自动启动', time: '昨天', read: true },
  { id: 'm4', title: '设备离线', desc: '走廊摄像头已离线，请检查网络', time: '昨天', read: true },
  { id: 'm5', title: '用电提醒', desc: '本月用电量已超过上月同期 20%', time: '2天前', read: true },
];

export default function MessagePage() {
  const navigate = useNavigate();

  return (
    <div data-cmp="MessagePage" className="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32">
      {/* Header */}
      <header className="px-5 pt-10 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom"
        >
          <ChevronLeftIcon size={18} className="text-foreground" strokeWidth={2} />
        </button>
        <span className="text-lg font-bold text-foreground">消息中心</span>
        <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom">
          <CheckCheckIcon size={18} className="text-primary" strokeWidth={2} />
        </button>
      </header>

      {/* Message List */}
      <div className="px-5 flex flex-col gap-3">
        {MESSAGES.map(msg => (
          <div
            key={msg.id}
            className="flex items-start gap-3 bg-card rounded-2xl px-4 py-4 shadow-custom border border-border"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
              <BellIcon size={18} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold text-foreground">{msg.title}</span>
                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{msg.time}</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">{msg.desc}</div>
            </div>
            {!msg.read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
