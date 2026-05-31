import { useEffect, useRef, useState } from 'react';
import {
  Trash2Icon,
  PencilIcon,
  InfoIcon,
  FolderInputIcon,
  DownloadIcon,
} from 'lucide-react';

interface SelectionFooterProps {
  visible?: boolean;
  selectedCount?: number;
  onDelete?: () => void;
  onRename?: () => void;
  onInfo?: () => void;
  onMove?: () => void;
  onDownload?: () => void;
}

interface ActionBtn {
  icon: React.ReactNode;
  label: string;
  handler: () => void;
  danger?: boolean;
}

export function SelectionFooter({
  visible = false,
  selectedCount = 0,
  onDelete = () => {},
  onRename = () => {},
  onInfo = () => {},
  onMove = () => {},
  onDownload = () => {},
}: SelectionFooterProps) {
  const [animClass, setAnimClass] = useState('');
  const [rendered, setRendered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      requestAnimationFrame(() => setAnimClass('action-footer-enter'));
    } else {
      setAnimClass('action-footer-leave');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setRendered(false), 240);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  const actions: ActionBtn[] = [
    { icon: <DownloadIcon size={20} strokeWidth={1.8} />, label: '下载', handler: onDownload },
    { icon: <FolderInputIcon size={20} strokeWidth={1.8} />, label: '移动', handler: onMove },
    { icon: <PencilIcon size={20} strokeWidth={1.8} />, label: '重命名', handler: onRename },
    { icon: <InfoIcon size={20} strokeWidth={1.8} />, label: '详情', handler: onInfo },
    { icon: <Trash2Icon size={20} strokeWidth={1.8} />, label: '删除', handler: onDelete, danger: true },
  ];

  const disabledRename = selectedCount > 1;

  return (
    <div
      data-cmp="SelectionFooter"
      className={`fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border ${rendered ? animClass : 'opacity-0 pointer-events-none'}`}
      style={{ boxShadow: `0 -4px 24px rgba(91,93,232,0.10)` }}
    >
      <div className="flex items-center justify-around px-2 pt-3 pb-safe">
        {actions.map((action) => {
          const isDisabled = action.label === '重命名' && disabledRename;
          return (
            <button
              key={action.label}
              onClick={() => !isDisabled && action.handler()}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-colors ${
                isDisabled
                  ? 'opacity-30 cursor-not-allowed'
                  : action.danger
                  ? 'text-destructive active:bg-destructive/10'
                  : 'text-foreground active:bg-muted'
              }`}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
      <div className="h-5 bg-card" />
    </div>
  );
}
