import { useState } from 'react';
import { toast } from 'sonner';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLogin?: () => void;
}

export default function LoginPage({ onLogin = () => {} }: LoginPageProps) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(``);
  const [password, setPassword] = useState(``);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!phone.trim() || !password.trim()) {
      toast.error(`请填写账号和密码`);
      return;
    }
    setLoading(true);
    console.log(`[Login] attempt: ${phone}`);
    setTimeout(() => {
      setLoading(false);
      toast.success(`登录成功`);
      onLogin();
      navigate('/');
    }, 1000);
  };

  return (
    <div
      data-cmp="LoginPage"
      className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, #181a3a 0%, #23206b 45%, #3b2070 100%)` }}
    >
      {/* bg decoration circles */}
      <div className="absolute top-[-80px] right-[-60px] w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #a78bfa 0%, transparent 70%)` }} />
      <div className="absolute bottom-[200px] left-[-80px] w-48 h-48 rounded-full opacity-15" style={{ background: `radial-gradient(circle, #5b5de8 0%, transparent 70%)` }} />

      {/* content */}
      <div className="relative z-10 flex flex-col flex-1 px-7 pt-24 pb-12">

        {/* logo + title */}
        <div className="mb-14">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: `rgba(255,255,255,0.12)` }}>
            <span className="text-3xl">🏠</span>
          </div>
          <div className="text-white text-[2rem] font-bold leading-tight tracking-tight">欢迎回家</div>
          <div className="text-white/50 text-sm mt-1.5 font-normal">登录你的账户，继续使用</div>
        </div>

        {/* inputs */}
        <div className="flex flex-col gap-3.5 mb-6">
          {/* phone */}
          <div
            className="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
            style={{ background: `rgba(255,255,255,0.07)`, border: `1px solid rgba(255,255,255,0.10)` }}
          >
            <UserIcon size={17} className="flex-shrink-0" style={{ color: `rgba(255,255,255,0.45)` }} strokeWidth={2} />
            <input
              type="text"
              placeholder="手机号 / 账号"
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
              placeholder="密码"
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
        </div>

        {/* login btn */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl text-sm active:opacity-80 transition-opacity mb-8"
          style={{ background: `linear-gradient(90deg, #5b5de8 0%, #8b5cf6 100%)`, color: `#fff` }}
        >
          {loading ? `登录中...` : `登 录`}
          <ArrowRightIcon size={16} strokeWidth={2.5} className={loading ? `hidden` : ``} />
        </button>

        {/* register link */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm" style={{ color: `rgba(255,255,255,0.38)` }}>还没有账号？</span>
          <Link to="/register" className="text-sm font-semibold" style={{ color: `rgba(167,139,250,1)` }}>立即注册</Link>
        </div>
      </div>
    </div>
  );
}
