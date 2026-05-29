import { useState } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeftIcon,
  EditIcon,
  CameraIcon,
  ImageIcon,
  PhoneIcon,
  UserIcon,
  MailIcon,
  ShieldIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserDetailData {
  name: string;
  phone: string;
  email: string;
  gender: string;
  avatar: string;
}

const INITIAL_USER: UserDetailData = {
  name: `陈小明`,
  phone: `138****6789`,
  email: `user@example.com`,
  gender: `男`,
  avatar: ``,
};

type EditField = 'name' | 'phone' | 'email' | 'gender' | null;

const FIELD_LABELS: Record<string, string> = {
  name: `用户名称`,
  phone: `手机号码`,
  email: `邮箱地址`,
  gender: `性别`,
};

const INFO_ROWS = [
  { key: `name` as EditField, icon: UserIcon, label: `用户名称`, color: `text-primary`, bg: `bg-primary/10` },
  { key: `phone` as EditField, icon: PhoneIcon, label: `手机号码`, color: `text-emerald-500`, bg: `bg-emerald-50` },
  { key: `email` as EditField, icon: MailIcon, label: `邮箱地址`, color: `text-amber-500`, bg: `bg-amber-50` },
  { key: `gender` as EditField, icon: ShieldIcon, label: `性别`, color: `text-purple-500`, bg: `bg-purple-50` },
];

export default function UserDetailPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetailData>(INITIAL_USER);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [editField, setEditField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState(``);

  const openEdit = (field: EditField) => {
    if (!field) return;
    setEditValue(user[field]);
    setEditField(field);
    console.log(`[UserDetail] open edit: ${field}`);
  };

  const saveEdit = () => {
    if (!editField || !editValue.trim()) return;
    setUser(prev => ({ ...prev, [editField]: editValue.trim() }));
    toast.success(`${FIELD_LABELS[editField]}已更新`);
    setEditField(null);
  };

  const handleAvatarOption = (option: string) => {
    console.log(`[UserDetail] avatar option: ${option}`);
    toast.info(option);
    setShowAvatarSheet(false);
  };

  const showModal = editField !== null;
  const showSheet = showAvatarSheet;

  return (
    <div data-cmp="UserDetailPage" className="min-h-screen bg-background flex flex-col max-w-md mx-auto overflow-x-hidden">

      {/* ── 顶部导航（透明背景） ── */}
      <div className="flex items-center gap-3 px-5 pt-10 pb-4">
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-custom active:opacity-60 transition-opacity"
        >
          <ChevronLeftIcon size={20} className="text-foreground" strokeWidth={2.5} />
        </button>
        <span className="text-base font-bold text-foreground">个人资料</span>
      </div>

      {/* ── 头像区域（透明背景） ── */}
      <div className="flex flex-col items-center pt-6 pb-8">
        <button
          className="relative group active:scale-95 transition-transform"
          onClick={() => setShowAvatarSheet(true)}
        >
          <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-custom">
            <span className="text-4xl font-bold text-primary">{user.name.slice(0, 1)}</span>
          </div>
          {/* 相机角标 */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-custom">
            <CameraIcon size={14} className="text-white" strokeWidth={2.5} />
          </div>
        </button>
        <div className="mt-4 text-foreground text-lg font-bold">{user.name}</div>
        <div className="mt-1.5 text-xs px-3 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
          高级会员
        </div>
      </div>

      {/* ── 信息卡片 ── */}
      <div className="px-5 mb-6">
        <div className="bg-card rounded-3xl border border-border shadow-custom overflow-hidden">
          {INFO_ROWS.map((row, idx) => {
            const Ic = row.icon;
            const value = user[row.key as keyof UserDetailData];
            return (
              <button
                key={row.key}
                className={`w-full flex items-center gap-4 px-5 py-4.5 active:bg-muted transition-colors ${idx < INFO_ROWS.length - 1 ? `border-b border-border` : ``}`}
                onClick={() => openEdit(row.key)}
              >
                <div className={`w-10 h-10 rounded-2xl ${row.bg} flex items-center justify-center flex-shrink-0`}>
                  <Ic size={18} className={row.color} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs text-muted-foreground mb-0.5">{row.label}</div>
                  <div className="text-sm font-semibold text-foreground truncate">{value}</div>
                </div>
                <EditIcon size={14} className="text-muted-foreground flex-shrink-0" strokeWidth={2} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 账号安全 ── */}
      <div className="px-5 mb-10">
        <div className="text-xs font-semibold text-muted-foreground mb-3 px-1">账号安全</div>
        <div className="bg-card rounded-3xl border border-border shadow-custom overflow-hidden">
          <button
            onClick={() => toast.info(`修改密码`)}
            className="w-full flex items-center gap-4 px-5 py-4.5 border-b border-border active:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
              <ShieldIcon size={18} className="text-rose-500" strokeWidth={2} />
            </div>
            <span className="flex-1 text-left text-sm font-semibold text-foreground">修改密码</span>
            <ChevronRightIcon size={15} className="text-muted-foreground" strokeWidth={2} />
          </button>
          <button
            onClick={() => toast.info(`账号注销`)}
            className="w-full flex items-center gap-4 px-5 py-4.5 active:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
              <UserIcon size={18} className="text-muted-foreground" strokeWidth={2} />
            </div>
            <span className="flex-1 text-left text-sm font-semibold text-foreground">账号注销</span>
            <ChevronRightIcon size={15} className="text-muted-foreground" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── 底部头像选择 Sheet ── */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-200 ${showSheet ? `opacity-100 pointer-events-auto` : `opacity-0 pointer-events-none`}`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowAvatarSheet(false)} />
        <div
          className={`relative w-full max-w-md bg-card rounded-t-3xl px-5 pt-5 pb-12 shadow-custom transition-transform duration-300 ${showSheet ? `translate-y-0` : `translate-y-full`}`}
        >
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
          <div className="text-base font-bold text-foreground mb-6 text-center">更换头像</div>
          <div className="flex gap-4 mb-5">
            <button
              onClick={() => handleAvatarOption(`本地相册`)}
              className="flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl bg-muted active:bg-border transition-colors border border-border"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ImageIcon size={22} className="text-primary" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-foreground">本地相册</span>
            </button>
            <button
              onClick={() => handleAvatarOption(`本地文件`)}
              className="flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl bg-muted active:bg-border transition-colors border border-border"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <CameraIcon size={22} className="text-amber-500" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-foreground">本地文件</span>
            </button>
          </div>
          <button
            onClick={() => setShowAvatarSheet(false)}
            className="w-full py-4 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm active:bg-border transition-colors"
          >
            取消
          </button>
        </div>
      </div>

      {/* ── 编辑字段弹窗 ── */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-200 ${showModal ? `opacity-100 pointer-events-auto` : `opacity-0 pointer-events-none`}`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setEditField(null)} />
        <div
          className={`relative w-full max-w-md bg-card rounded-t-3xl px-6 pt-5 pb-10 shadow-custom transition-transform duration-300 ${showModal ? `translate-y-0` : `translate-y-full`}`}
        >
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
          <div className="text-base font-bold text-foreground mb-5">
            修改{editField ? FIELD_LABELS[editField] : ``}
          </div>
          <input
            className="w-full bg-muted rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:border-primary transition-colors"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={`请输入${editField ? FIELD_LABELS[editField] : ``}`}
            maxLength={30}
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setEditField(null)}
              className="flex-1 py-4 rounded-2xl bg-muted text-foreground font-semibold text-sm"
            >
              取消
            </button>
            <button
              onClick={saveEdit}
              className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
