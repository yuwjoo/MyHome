import { BreadcrumbItem } from '../types';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
}

export function BreadcrumbNav({
  items = [{ label: '全部文件', path: '/' }],
  onNavigate = () => {},
}: BreadcrumbNavProps) {
  return (
    <div data-cmp="BreadcrumbNav" className="flex items-center gap-1 px-5 py-2 overflow-x-auto">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.path} className="flex items-center gap-1 flex-shrink-0">
            {index === 0 && (
              <HomeIcon size={12} className="text-muted-foreground mr-0.5" strokeWidth={2} />
            )}
            <button
              onClick={() => !isLast && onNavigate(item.path)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors ${
                isLast
                  ? 'text-primary bg-secondary cursor-default'
                  : 'text-muted-foreground active:bg-muted'
              }`}
            >
              {item.label}
            </button>
            {!isLast && (
              <ChevronRightIcon size={12} className="text-muted-foreground/60" strokeWidth={2} />
            )}
          </div>
        );
      })}
    </div>
  );
}
