import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, PackageIcon, CloudIcon, UserIcon } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',        label: `首页`,  Icon: HomeIcon    },
  { path: '/express', label: `快递`,  Icon: PackageIcon },
  { path: '/cloud',   label: `云盘`,  Icon: CloudIcon   },
  { path: '/profile', label: `我的`,  Icon: UserIcon    },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <div data-cmp="BottomNav" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 w-full max-w-sm">
      <nav className="flex items-center bg-card/95 backdrop-blur-md border border-border shadow-custom rounded-full px-2 py-2 gap-1">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-full transition-all ${
                isActive
                  ? `bg-primary text-primary-foreground shadow-custom`
                  : `text-muted-foreground hover:text-foreground`
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-semibold leading-none ${isActive ? `text-primary-foreground` : ``}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
