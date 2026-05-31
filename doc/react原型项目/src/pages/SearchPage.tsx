import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { ArrowLeftIcon, SearchIcon, XCircleIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { FileItem } from '../types';
import { FileIconDisplay } from '../components/FileIconDisplay';
import { FileActionSheet } from '../components/FileActionSheet';

const ALL_FILES: FileItem[] = [
  { id: '1',  name: '我的文档',      type: 'folder', modifiedAt: '2025-06-10T10:30:00', path: '/docs' },
  { id: '2',  name: '图片素材',      type: 'folder', modifiedAt: '2025-06-09T16:00:00', path: '/images' },
  { id: '4',  name: '项目报告.pdf',  type: 'doc',    modifiedAt: '2025-06-12T14:22:00', path: '/report.pdf',  size: '3.2 MB' },
  { id: '5',  name: '产品设计稿.png',type: 'image',  modifiedAt: '2025-06-11T11:45:00', path: '/design.png',  size: '8.7 MB' },
  { id: '6',  name: '宣传视频.mp4',  type: 'video',  modifiedAt: '2025-06-07T20:00:00', path: '/promo.mp4',   size: '124 MB' },
  { id: '8',  name: '源代码备份.zip',type: 'zip',    modifiedAt: '2025-06-04T15:00:00', path: '/src.zip',     size: '45.1 MB' },
  { id: '9',  name: '会议录音.mp3',  type: 'audio',  modifiedAt: '2025-06-03T13:00:00', path: '/meet.mp3',    size: '22 MB' },
  { id: '10', name: '财务数据.xlsx', type: 'doc',    modifiedAt: '2025-06-02T10:00:00', path: '/finance.xlsx',size: '1.1 MB' },
  { id: 'd2', name: '合同模板.docx', type: 'doc',    modifiedAt: '2025-06-09T14:00:00', path: '/docs/contract.docx', size: '512 KB' },
  { id: 'i1', name: '品牌LOGO.png',  type: 'image',  modifiedAt: '2025-06-11T10:00:00', path: '/images/logo.png', size: '450 KB' },
];

function formatDate(str: string) {
  const d = new Date(str);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
interface DeleteDialogProps {
  visible: boolean;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteDialog({ visible, fileName, onConfirm, onCancel }: DeleteDialogProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-8" onClick={onCancel}>
      <div className="absolute inset-0 bg-foreground/40" />
      <div
        className="relative bg-card rounded-3xl shadow-custom border border-border w-full max-w-xs p-6 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Trash2Icon size={26} className="text-destructive" strokeWidth={1.8} />
        </div>
        <div className="text-base font-bold text-foreground mb-2">确认删除</div>
        <div className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
          确定要删除 <span className="font-semibold text-foreground break-all">{fileName}</span> 吗？此操作不可撤销。
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-muted text-foreground font-semibold text-sm active:opacity-80 transition-opacity border border-border"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-destructive text-white font-semibold text-sm active:opacity-80 transition-opacity shadow-custom"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rename Dialog ────────────────────────────────────────────────────────────
interface RenameDialogProps {
  visible: boolean;
  initialName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

function RenameDialog({ visible, initialName, onConfirm, onCancel }: RenameDialogProps) {
  const [value, setValue] = useState(initialName);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-8" onClick={onCancel}>
      <div className="absolute inset-0 bg-foreground/40" />
      <div
        className="relative bg-card rounded-3xl shadow-custom border border-border w-full max-w-xs p-6 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <PencilIcon size={24} className="text-primary" strokeWidth={1.8} />
        </div>
        <div className="text-base font-bold text-foreground mb-5">重命名</div>
        <input
          className="w-full h-11 px-4 rounded-2xl bg-muted border border-border text-sm text-foreground font-medium focus:outline-none focus:border-primary transition-colors mb-5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onConfirm(value.trim()); }}
        />
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-muted text-foreground font-semibold text-sm active:opacity-80 transition-opacity border border-border"
          >
            取消
          </button>
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:opacity-80 transition-opacity shadow-custom"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [fileActionTarget, setFileActionTarget] = useState<FileItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; label: string; onConfirm: () => void }>({
    visible: false, label: '', onConfirm: () => {},
  });
  const [renameDialog, setRenameDialog] = useState<{ visible: boolean; initialName: string; onConfirm: (n: string) => void }>({
    visible: false, initialName: '', onConfirm: () => {},
  });
  const [downloadCount, setDownloadCount] = useState(0);

  const handleFileActionDelete = (file: FileItem) => {
    setFileActionTarget(null);
    setDeleteDialog({
      visible: true,
      label: file.name,
      onConfirm: () => {
        toast.success(`已删除：${file.name}`);
        setDeleteDialog((d) => ({ ...d, visible: false }));
      },
    });
  };

  const handleFileActionRename = (file: FileItem) => {
    setFileActionTarget(null);
    setRenameDialog({
      visible: true,
      initialName: file.name,
      onConfirm: (newName) => {
        toast.success(`已重命名为：${newName}`);
        setRenameDialog((d) => ({ ...d, visible: false }));
      },
    });
  };

  const handleFileActionInfo = (file: FileItem) => {
    setFileActionTarget(null);
    navigate('/file-detail', { state: file });
  };

  const handleFileActionMove = (file: FileItem) => {
    setFileActionTarget(null);
    navigate('/move-file', { state: { name: file.name } });
  };

  const handleFileActionDownload = (file: FileItem) => {
    setDownloadCount((c) => c + 1);
    toast.success(`已添加下载任务：${file.name}`);
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return ALL_FILES.filter((f) =>
      f.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const isEmpty = query.trim().length > 0 && results.length === 0;

  return (
    <div data-cmp="SearchPage" className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      <Toaster position="top-center" richColors />

      {/* ── Delete Confirm Dialog ── */}
      <DeleteDialog
        visible={deleteDialog.visible}
        fileName={deleteDialog.label}
        onConfirm={deleteDialog.onConfirm}
        onCancel={() => setDeleteDialog((d) => ({ ...d, visible: false }))}
      />

      {/* ── Rename Dialog ── */}
      <RenameDialog
        visible={renameDialog.visible}
        initialName={renameDialog.initialName}
        onConfirm={renameDialog.onConfirm}
        onCancel={() => setRenameDialog((d) => ({ ...d, visible: false }))}
      />

      {/* ── File Action Sheet ── */}
      <FileActionSheet
        visible={fileActionTarget !== null}
        file={fileActionTarget}
        onClose={() => setFileActionTarget(null)}
        onDelete={handleFileActionDelete}
        onRename={handleFileActionRename}
        onInfo={handleFileActionInfo}
        onMove={handleFileActionMove}
        onDownload={handleFileActionDownload}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="h-safe-top bg-card" />
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-muted transition-colors"
          >
            <ArrowLeftIcon size={20} className="text-foreground" strokeWidth={2.2} />
          </button>
          <div className="flex-1 flex items-center gap-2.5 h-9 px-3.5 rounded-full bg-muted border border-border focus-within:border-primary/50 transition-colors">
            <SearchIcon size={15} className="text-muted-foreground flex-shrink-0" strokeWidth={2.5} />
            <input
              autoFocus
              type="text"
              placeholder={`搜索文件名...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => setQuery('')}
              className={`transition-opacity ${query ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <XCircleIcon size={15} className="text-muted-foreground" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        {/* Empty state: no query */}
        <div className={query.trim() ? 'hidden' : 'flex flex-col items-center justify-center py-24 text-muted-foreground'}>
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <SearchIcon size={28} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="text-sm font-medium">输入关键词搜索文件</div>
          <div className="text-xs mt-1">支持按文件名搜索</div>
        </div>

        {/* No results */}
        <div className={isEmpty ? 'flex flex-col items-center justify-center py-24 text-muted-foreground' : 'hidden'}>
          <div className="text-3xl mb-3">🔍</div>
          <div className="text-sm font-medium">未找到匹配的文件</div>
          <div className="text-xs mt-1">换个关键词试试</div>
        </div>

        {/* Results */}
        <div className={results.length > 0 ? '' : 'hidden'}>
          <div className="px-4 py-2.5 border-b border-border">
            <span className="text-xs text-muted-foreground">找到 {results.length} 个结果</span>
          </div>
          {results.map((file, i) => (
            <div
              key={file.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card active:bg-muted transition-colors file-item-appear"
              style={{ animationDelay: `${i * 0.04}s` }}
              onClick={() => {
                if (file.type !== 'folder') {
                  navigate('/file-detail', { state: file });
                }
              }}
            >
              <FileIconDisplay type={file.type} size={20} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>{file.path}</span>
                  {file.size && <span>· {file.size}</span>}
                  <span>· {formatDate(file.modifiedAt)}</span>
                </div>
              </div>
              {file.type !== 'folder' && (
                <div className="flex-shrink-0">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted active:bg-border transition-colors"
                    onClick={(e) => { e.stopPropagation(); setFileActionTarget(file); }}
                  >
                    <MoreHorizontalIcon size={14} className="text-muted-foreground" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
