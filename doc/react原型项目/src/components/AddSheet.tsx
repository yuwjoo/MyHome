import { useEffect, useRef, useState } from 'react';
import {
  PlusIcon,
  UploadIcon,
  FolderPlusIcon,
  XIcon,
} from 'lucide-react';

interface AddSheetProps {
  visible?: boolean;
  onClose?: () => void;
  onUploadFile?: () => void;
  onCreateFolder?: (name: string) => void;
}

export function AddSheet({
  visible = false,
  onClose = () => {},
  onUploadFile = () => {},
  onCreateFolder = () => {},
}: AddSheetProps) {
  const [animClass, setAnimClass] = useState('');
  const [rendered, setRendered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (folderDialogOpen) {
      setFolderName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [folderDialogOpen]);

  const handleConfirmCreateFolder = () => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    setFolderDialogOpen(false);
    onCreateFolder(trimmed);
    onClose();
  };

  return (
    <div data-cmp="AddSheet" className={`fixed inset-0 z-50 ${rendered ? '' : 'pointer-events-none'}`}>
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
        <div className="flex justify-center mb-5">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-base font-bold text-foreground">添加内容</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted active:bg-border transition-colors"
          >
            <XIcon size={16} className="text-muted-foreground" strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex gap-4">
          {/* Upload file */}
          <button
            onClick={() => { onUploadFile(); onClose(); }}
            className="flex-1 flex flex-col items-center gap-3 py-6 rounded-2xl bg-secondary/60 border border-primary/15 active:bg-secondary transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-custom">
              <UploadIcon size={22} className="text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="text-sm font-semibold text-foreground">上传文件</span>
            <span className="text-xs text-muted-foreground">从本地选择文件</span>
          </button>
          {/* Create folder */}
          <button
            onClick={() => setFolderDialogOpen(true)}
            className="flex-1 flex flex-col items-center gap-3 py-6 rounded-2xl bg-purple-50 border border-purple-100 active:bg-purple-100/80 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-custom">
              <FolderPlusIcon size={22} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-sm font-semibold text-foreground">新建文件夹</span>
            <span className="text-xs text-muted-foreground">创建空文件夹</span>
          </button>
        </div>
      </div>

      {/* Create Folder Dialog */}
      {folderDialogOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setFolderDialogOpen(false)}
          />
          <div className="relative w-full bg-card rounded-2xl shadow-custom px-5 py-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">新建文件夹</span>
              <button
                onClick={() => setFolderDialogOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted active:bg-border transition-colors"
              >
                <XIcon size={16} className="text-muted-foreground" strokeWidth={2.5} />
              </button>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmCreateFolder()}
              placeholder="请输入文件夹名称"
              className="w-full h-11 rounded-xl border border-border bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-400 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setFolderDialogOpen(false)}
                className="flex-1 h-11 rounded-xl bg-muted text-sm font-semibold text-muted-foreground active:bg-border transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCreateFolder}
                disabled={!folderName.trim()}
                className="flex-1 h-11 rounded-xl bg-purple-500 text-sm font-semibold text-white active:bg-purple-600 disabled:opacity-40 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Plus button
export function AddButton({ onClick = () => {} }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-primary active:bg-primary/80 transition-colors shadow-custom"
    >
      <PlusIcon size={20} className="text-primary-foreground" strokeWidth={2.5} />
    </button>
  );
}
