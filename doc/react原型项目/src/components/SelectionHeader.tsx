import { useEffect, useRef, useState } from 'react';
import {
  XIcon,
  CheckSquareIcon,
  SquareIcon,
} from 'lucide-react';

interface SelectionHeaderProps {
  visible?: boolean;
  selectedCount?: number;
  totalCount?: number;
  allSelected?: boolean;
  onCancel?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

export function SelectionHeader({
  visible = false,
  selectedCount = 0,
  totalCount = 0,
  allSelected = false,
  onCancel = () => {},
  onSelectAll = () => {},
  onDeselectAll = () => {},
}: SelectionHeaderProps) {
  const [animClass, setAnimClass] = useState('');
  const [rendered, setRendered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      requestAnimationFrame(() => setAnimClass('action-header-enter'));
    } else {
      setAnimClass('action-header-leave');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setRendered(false), 240);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  return (
    <div
      data-cmp="SelectionHeader"
      className={`absolute top-0 left-0 right-0 z-30 bg-primary ${rendered ? animClass : 'opacity-0 pointer-events-none'}`}
      style={{ boxShadow: `0 4px 24px rgba(91,93,232,0.22)` }}
    >
      {/* safe area top spacing */}
      <div className="h-safe-top bg-primary" />
      <div className="flex items-center justify-between px-5 h-14">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-primary-foreground/90 active:text-primary-foreground transition-colors"
        >
          <XIcon size={18} strokeWidth={2.5} />
          <span className="text-sm font-medium">取消</span>
        </button>
        <span className="text-sm font-bold text-primary-foreground">
          已选 {selectedCount} 项
        </span>
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="flex items-center gap-1.5 text-primary-foreground/90 active:text-primary-foreground transition-colors"
        >
          {allSelected ? (
            <CheckSquareIcon size={18} strokeWidth={2} />
          ) : (
            <SquareIcon size={18} strokeWidth={2} />
          )}
          <span className="text-sm font-medium">{allSelected ? '取消全选' : '全选'}</span>
        </button>
      </div>
    </div>
  );
}
