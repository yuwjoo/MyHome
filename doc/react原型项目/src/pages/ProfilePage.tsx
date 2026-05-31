import { useState } from 'react';
import { toast } from 'sonner';
import {
  EditIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  SettingsIcon,
  LogOutIcon,
  InfoIcon,
  PackageIcon,
  CloudIcon,
  SmartphoneIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserInfo } from '../types';

const USER: UserInfo = {
  name: `陈小明`,
  avatar: ``,
  phone: `138****6789`,
  email: `user@example.com`,
  level: `高级会员`,
};

const STATS = [
  { label: `设备`, value: `8 台`, icon: SmartphoneIcon, color: `text-primary`, bg: `bg-primary/10` },
  { label: `快递`, value: `3 件`, icon: PackageIcon, color: `text-amber-500`, bg: `bg-amber-50` },
  { label: `云盘`, value: `14 G`, icon: CloudIcon, color: `text-emerald-500`, bg: `bg-emerald-50` },
];

const MENU_ITEMS = [
  { icon: HelpCircleIcon, label: `帮助与反馈`, color: `text-cyan-500`, bg: `bg-cyan-50` },
  { icon: InfoIcon, label: `关于`, color: `text-primary`, bg: `bg-primary/10` },
  { icon: SettingsIcon, label: `设置`, color: `text-muted-foreground`, bg: `bg-muted` },
];

interface ProfilePageProps {
  onLogout?: () => void;
}

export default function ProfilePage({ onLogout = () => {} }: ProfilePageProps) {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState(USER.name);

  const handleLogout = () => {
    console.log(`[Profile] user logout`);
    toast.success(`已退出登录`);
    setTimeout(() => {
      onLogout();
      navigate('/login');
    }, 800);
    setShowLogout(false);
  };

  const handleSaveName = () => {
    if (!editName.trim()) return;
    USER.name = editName.trim();
    toast.success(`昵称已更新`);
    setShowEditName(false);
  };

  return (
    <div data-cmp="ProfilePage" className="min-h-screen bg-background flex flex-col max-w-md mx-auto overflow-x-hidden">

      {/* ── 用户信息区域（透明背景） ── */}
      <button
        className="w-full text-left px-5 pt-10 pb-4 active:opacity-70 transition-opacity"
        onClick={() => navigate('/user-detail')}
      >
        <div className="flex items-center gap-4">
          {/* 头像 */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-custom">
            <span className="text-2xl font-bold text-primary">{USER.name.slice(0, 1)}</span>
          </div>
          {/* 名称 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-foreground text-lg font-bold leading-tight">{USER.name}</span>
              <button
                className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center active:scale-90 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditName(USER.name);
                  setShowEditName(true);
                }}
              >
                <EditIcon size={12} className="text-muted-foreground" strokeWidth={2.5} />
              </button>
            </div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              {USER.level}
            </div>
          </div>
        </div>
      </button>

      {/* ── 统计卡片 ── */}
      <div className="px-5 mb-5">
        <div className="bg-card rounded-3xl shadow-custom border border-border p-5">
          <div className="flex items-stretch justify-around">
            {STATS.map((stat) => {
              const Ic = stat.icon;
              return (
                <div key={stat.label} className="flex-1 flex flex-col items-center gap-2">
                  <div className={`w-11 h-11 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                    <Ic size={20} className={stat.color} strokeWidth={2} />
                  </div>
                  <div className="text-center">
                    <div className="text-foreground text-base font-bold leading-tight">{stat.value}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 菜单列表 ── */}
      <div className="px-5 mb-5">
        <div className="bg-card rounded-3xl border border-border shadow-custom overflow-hidden">
          {MENU_ITEMS.map((item, idx) => {
            const Ic = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => toast.info(item.label)}
                className={`w-full flex items-center gap-4 px-5 py-4.5 active:bg-muted transition-colors ${
                  idx < MENU_ITEMS.length - 1 ? `border-b border-border` : ``
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <Ic size={18} className={item.color} strokeWidth={2} />
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-foreground">{item.label}</span>
                <ChevronRightIcon size={15} className="text-muted-foreground" strokeWidth={2} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 退出登录 ── */}
      <div className="px-5 pb-32">
        <button
          onClick={() => setShowLogout(true)}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-3xl font-semibold text-sm active:opacity-80 transition-all shadow-custom"
          style={{
            background: `linear-gradient(135deg, rgba(234, 88, 60, 0.12) 0%, rgba(249, 115, 22, 0.10) 100%)`,
            border: `1.5px solid rgba(234, 88, 60, 0.28)`,
            color: `rgba(218, 72, 44, 1)`,
          }}
        >
          <LogOutIcon size={17} strokeWidth={2} />
          退出登录
        </button>
      </div>

      {/* ── 编辑昵称弹窗 ── */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-200 ${showEditName ? `opacity-100 pointer-events-auto` : `opacity-0 pointer-events-none`}`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditName(false)} />
        <div
          className={`relative w-full max-w-md bg-card rounded-t-3xl px-6 pt-5 pb-10 shadow-custom transition-transform duration-300 ${showEditName ? `translate-y-0` : `translate-y-full`}`}
        >
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
          <div className="text-base font-bold text-foreground mb-5">修改昵称</div>
          <input
            className="w-full bg-muted rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:border-primary transition-colors"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={`请输入新昵称`}
            maxLength={20}
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowEditName(false)}
              className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-semibold text-sm"
            >
              取消
            </button>
            <button
              onClick={handleSaveName}
              className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* ── 退出登录确认 ── */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-200 ${showLogout ? `opacity-100 pointer-events-auto` : `opacity-0 pointer-events-none`}`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogout(false)} />
        <div
          className={`relative w-full max-w-md bg-card rounded-t-3xl px-6 pt-5 pb-10 shadow-custom transition-transform duration-300 ${showLogout ? `translate-y-0` : `translate-y-full`}`}
        >
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-3" style={{ background: `rgba(234, 88, 60, 0.10)` }}>
              <LogOutIcon size={22} strokeWidth={2} style={{ color: `rgba(218, 72, 44, 1)` }} />
            </div>
            <div className="text-base font-bold text-foreground mb-1">确认退出登录？</div>
            <div className="text-xs text-muted-foreground">退出后将返回登录页面</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogout(false)}
              className="flex-1 py-4 rounded-2xl bg-muted text-foreground font-semibold text-sm"
            >
              取消
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-4 rounded-2xl font-semibold text-sm shadow-custom"
              style={{
                background: `linear-gradient(135deg, rgba(234, 88, 60, 0.90) 0%, rgba(249, 115, 22, 0.85) 100%)`,
                color: `#fff`,
              }}
            >
              确认退出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
