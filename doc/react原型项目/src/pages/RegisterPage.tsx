import { useState } from 'react';
import { toast } from 'sonner';
import { UserIcon, LockIcon, PhoneIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon, CheckIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState(``);
  const [phone, setPhone] = useState(``);
  const [password, setPassword] = useState(``);
  const [confirm, setConfirm] = useState(``);
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      toast.error(`请填写所有必填信息`);
      return;
    }
    if (password !== confirm) {
      toast.error(`两次密码输入不一致`);
      return;
    }
    if (!agreed) {
      toast.error(`请先同意用户协议`);
      return;
    }
    setLoading(true);
    console.log(`[Register] new account: ${phone}`);
    setTimeout(() => {
      setLoading(false);
      toast.success(`注册成功，请登录`);
      navigate('/login');
    }, 1000);
  };

  return (
    <div
      data-cmp="RegisterPage"
      className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, #181a3a 0%, #23206b 45%, #3b2070 100%)` }}
    >
      {/* bg decoration circles */}
      <div className="absolute top-[-60px] right-[-40px] w-56 h-56 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #a78bfa 0%, transparent 70%)` }} />
      <div className="absolute bottom-[240px] left-[-70px] w-44 h-44 rounded-full opacity-15" style={{ background: `radial-gradient(circle, #5b5de8 0%, transparent 70%)` }} />

      {/* content */}
      <div className="relative z-10 flex flex-col flex-1 px-7 pt-16 pb-12">

        {/* back */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-sm mb-10 w-fit"
          style={{ color: `rgba(255,255,255,0.45)` }}
        >
          <ArrowLeftIcon size={16} strokeWidth={2.5} />
          返回登录
        </button>

        {/* title */}
        <div className="mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: `rgba(255,255,255,0.12)` }}>
            <span className="text-3xl">✨</span>
          </div>
          <div className="text-white text-[2rem] font-bold leading-tight tracking-tight">创建账户</div>
          <div className="text-white/50 text-sm mt-1.5 font-normal">加入智慧家居，开启全新体验</div>
        </div>

        {/* inputs */}
        <div className="flex flex-col gap-3.5 mb-5">
          {/* name */}
          <div
            className="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
            style={{ background: `rgba(255,255,255,0.07)`, border: `1px solid rgba(255,255,255,0.10)` }}
          >
            <UserIcon size={17} className="flex-shrink-0" style={{ color: `rgba(255,255,255,0.45)` }} strokeWidth={2} />
            <input
              type="text"
              placeholder="昵称"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: `rgba(255,255,255,0.9)` }}
            />
          </div>

          {/* phone */}
          <div
            className="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
            style={{ background: `rgba(255,255,255,0.07)`, border: `1px solid rgba(255,255,255,0.10)` }}
          >
            <PhoneIcon size={17} className="flex-shrink-0" style={{ color: `rgba(255,255,255,0.45)` }} strokeWidth={2} />
            <input
              type="tel"
              placeholder="手机号"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: `rgba(255,255,255,0.9)` }}
            />
          </div>

          {/* password */}
          <div
            className="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
            style={{ background: `rgba(255,255,255,0.07)`, border: `1px solid rgba(255,255,255,0.10)` }}
          >
            <LockIcon size={17} className="flex-shrink-0" style={{ color: `rgba(255,255,255,0.45)` }} strokeWidth={2} />
            <input
              type={showPwd ? `text` : `password`}
              placeholder="设置密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: `rgba(255,255,255,0.9)` }}
            />
            <button onClick={() => setShowPwd(v => !v)} className="flex-shrink-0">
              {showPwd
                ? <EyeOffIcon size={16} strokeWidth={2} style={{ color: `rgba(255,255,255,0.40)` }} />
                : <EyeIcon    size={16} strokeWidth={2} style={{ color: `rgba(255,255,255,0.40)` }} />
              }
            </button>
          </div>

          {/* confirm */}
          <div
            className="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
            style={{ background: `rgba(255,255,255,0.07)`, border: `1px solid rgba(255,255,255,0.10)` }}
          >
            <LockIcon size={17} className="flex-shrink-0" style={{ color: `rgba(255,255,255,0.45)` }} strokeWidth={2} />
            <input
              type={showPwd ? `text` : `password`}
              placeholder="确认密码"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: `rgba(255,255,255,0.9)` }}
            />
            <div className={`flex-shrink-0 transition-opacity ${confirm && confirm === password ? `opacity-100` : `opacity-0`}`}>
              <CheckIcon size={16} strokeWidth={2.5} style={{ color: `#34d399` }} />
            </div>
          </div>
        </div>

        {/* agreement */}
        <button
          onClick={() => setAgreed(v => !v)}
          className="flex items-center gap-2 mb-6"
        >
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: agreed ? `#5b5de8` : `rgba(255,255,255,0.08)`,
              border: agreed ? `2px solid #5b5de8` : `2px solid rgba(255,255,255,0.18)`
            }}
          >
            <CheckIcon size={11} strokeWidth={3} style={{ color: `#fff` }} />
          </div>
          <span className="text-xs" style={{ color: `rgba(255,255,255,0.40)` }}>
            我已阅读并同意
            <span style={{ color: `rgba(167,139,250,0.85)` }}> 用户协议 </span>
            和
            <span style={{ color: `rgba(167,139,250,0.85)` }}> 隐私政策</span>
          </span>
        </button>

        {/* submit */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl text-sm active:opacity-80 transition-opacity mb-6"
          style={{ background: `linear-gradient(90deg, #5b5de8 0%, #8b5cf6 100%)`, color: `#fff` }}
        >
          {loading ? `注册中...` : `立即注册`}
        </button>

        {/* login link */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm" style={{ color: `rgba(255,255,255,0.38)` }}>已有账号？</span>
          <Link to="/login" className="text-sm font-semibold" style={{ color: `rgba(167,139,250,1)` }}>去登录</Link>
        </div>
      </div>
    </div>
  );
}
