import { useEffect, useRef, useState } from 'react';
import {
  Trash2Icon,
  PencilIcon,
  InfoIcon,
  FolderInputIcon,
  DownloadIcon,
  XIcon,
} from 'lucide-react';
import { FileItem } from '../types';
import { FileIconDisplay } from './FileIconDisplay';

interface FileActionSheetProps {
  visible?: boolean;
  file?: FileItem | null;
  onClose?: () => void;
  onDelete?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onInfo?: (file: FileItem) => void;
  onMove?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
}

interface ActionBtn {
  icon: React.ReactNode;
  label: string;
  handler: () => void;
  danger?: boolean;
}

export function FileActionSheet({
  visible = false,
  file = null,
  onClose = () => {},
  onDelete = () => {},
  onRename = () => {},
  onInfo = () => {},
  onMove = () => {},
  onDownload = () => {},
}: FileActionSheetProps) {
  const [animClass, setAnimClass] = useState('');
  const [rendered, setRendered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      requestAnimationFrame(() => setAnimClass('add-sheet-enter'));
    } else {
      setAnimClass('add-sheet-leave');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setRendered(false), 240);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  if (!rendered) return null;

  const actions: ActionBtn[] = file
    ? [
        { icon: <DownloadIcon size={20} strokeWidth={1.8} />, label: '下载', handler: () => { onDownload(file); onClose(); } },
        { icon: <FolderInputIcon size={20} strokeWidth={1.8} />, label: '移动', handler: () => { onMove(file); onClose(); } },
        { icon: <PencilIcon size={20} strokeWidth={1.8} />, label: '重命名', handler: () => { onRename(file); onClose(); } },
        { icon: <InfoIcon size={20} strokeWidth={1.8} />, label: '详情', handler: () => { onInfo(file); onClose(); } },
        { icon: <Trash2Icon size={20} strokeWidth={1.8} />, label: '删除', handler: () => { onDelete(file); onClose(); }, danger: true },
      ]
    : [];

  return (
    <div data-cmp="FileActionSheet" className={`fixed inset-0 z-50 ${rendered ? '' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${rendered ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: `rgba(18,22,42,0.45)` }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl pb-10 pt-5 px-5 shadow-custom ${rendered ? animClass : 'translate-y-full'}`}
      >
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* File info header */}
        {file && (
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <FileIconDisplay type={file.type} size={22} />
              <div className="min-w-0">
                <div className="text-sm font-bold text-foreground truncate leading-snug">{file.name}</div>
                {file.size && (
                  <div className="text-xs text-muted-foreground mt-0.5">{file.size}</div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted active:bg-border transition-colors flex-shrink-0 ml-3"
            >
              <XIcon size={16} className="text-muted-foreground" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-around">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.handler}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-colors ${
                action.danger
                  ? 'text-destructive active:bg-destructive/10'
                  : 'text-foreground active:bg-muted'
              }`}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
