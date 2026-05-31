import { useState, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import {
  LayoutListIcon, LayoutGridIcon, CloudIcon, FolderIcon, ImageIcon, VideoIcon,
  MusicIcon, FileTextIcon, ArchiveIcon, PlusIcon, ArrowRightLeftIcon, ChevronDownIcon,
  SearchIcon, Trash2Icon, PencilIcon,
} from 'lucide-react';
import { FileItem, BreadcrumbItem, LayoutMode } from '../types';
import { BreadcrumbNav } from '../components/BreadcrumbNav';
import { FileList } from '../components/FileList';
import { AddSheet } from '../components/AddSheet';
import { SelectionHeader } from '../components/SelectionHeader';
import { SelectionFooter } from '../components/SelectionFooter';
import { FileActionSheet } from '../components/FileActionSheet';
import { PullRefreshIndicator } from '../components/PullRefreshIndicator';
import { usePullRefresh } from '../hooks/use-pull-refresh';
import { useNavigate } from 'react-router-dom';

// ─── Mock data ────────────────────────────────────────────────────────────────
const ROOT_FILES: FileItem[] = [
  { id: '1',  name: `我的文档`,       type: 'folder', modifiedAt: '2025-06-10T10:30:00', path: '/docs',        childCount: 12  },
  { id: '2',  name: `图片素材`,       type: 'folder', modifiedAt: '2025-06-09T16:00:00', path: '/images',      childCount: 87  },
  { id: '3',  name: `视频剪辑`,       type: 'folder', modifiedAt: '2025-06-08T09:15:00', path: '/videos',      childCount: 5   },
  { id: '4',  name: `项目报告.pdf`,   type: 'doc',    modifiedAt: '2025-06-12T14:22:00', path: '/report.pdf',  size: '3.2 MB'  },
  { id: '5',  name: `产品设计稿.png`, type: 'image',  modifiedAt: '2025-06-11T11:45:00', path: '/design.png',  size: '8.7 MB'  },
  { id: '6',  name: `宣传视频.mp4`,   type: 'video',  modifiedAt: '2025-06-07T20:00:00', path: '/promo.mp4',   size: '124 MB'  },
  { id: '7',  name: `音乐收藏`,       type: 'folder', modifiedAt: '2025-06-05T08:30:00', path: '/music',       childCount: 33  },
  { id: '8',  name: `源代码备份.zip`, type: 'zip',    modifiedAt: '2025-06-04T15:00:00', path: '/src.zip',     size: '45.1 MB' },
  { id: '9',  name: `会议录音.mp3`,   type: 'audio',  modifiedAt: '2025-06-03T13:00:00', path: '/meet.mp3',    size: '22 MB'   },
  { id: '10', name: `财务数据.xlsx`,  type: 'doc',    modifiedAt: '2025-06-02T10:00:00', path: '/finance.xlsx',size: '1.1 MB'  },
];

const DOCS_FILES: FileItem[] = [
  { id: 'd1', name: `季度报告Q2`,       type: 'folder', modifiedAt: '2025-06-10T09:00:00', path: '/docs/q2',            childCount: 4    },
  { id: 'd2', name: `合同模板.docx`,    type: 'doc',    modifiedAt: '2025-06-09T14:00:00', path: '/docs/contract.docx', size: '512 KB'   },
  { id: 'd3', name: `产品规划.pptx`,    type: 'doc',    modifiedAt: '2025-06-08T11:00:00', path: '/docs/plan.pptx',     size: '2.4 MB'   },
  { id: 'd4', name: `用户调研报告.pdf`, type: 'doc',    modifiedAt: '2025-06-07T16:30:00', path: '/docs/research.pdf',  size: '6.8 MB'   },
];

const IMAGES_FILES: FileItem[] = [
  { id: 'i1', name: `品牌LOGO.png`,    type: 'image', modifiedAt: '2025-06-11T10:00:00', path: '/images/logo.png',   size: '450 KB' },
  { id: 'i2', name: `首页Banner.jpg`,  type: 'image', modifiedAt: '2025-06-10T15:30:00', path: '/images/banner.jpg', size: '2.1 MB' },
  { id: 'i3', name: `产品图1.png`,     type: 'image', modifiedAt: '2025-06-09T09:45:00', path: '/images/prod1.png',  size: '1.3 MB' },
  { id: 'i4', name: `产品图2.png`,     type: 'image', modifiedAt: '2025-06-08T14:20:00', path: '/images/prod2.png',  size: '1.5 MB' },
  { id: 'i5', name: `团队合照.jpg`,    type: 'image', modifiedAt: '2025-06-07T17:00:00', path: '/images/team.jpg',   size: '4.2 MB' },
];

const FILE_MAP: Record<string, FileItem[]> = {
  '/':       ROOT_FILES,
  '/docs':   DOCS_FILES,
  '/images': IMAGES_FILES,
};

function getFilesForPath(path: string): FileItem[] {
  return FILE_MAP[path] ?? [];
}

// ─── Type filter ───────────────────────────────────────────────────────────────
type FileTypeFilter = 'all' | 'folder' | 'image' | 'video' | 'audio' | 'doc' | 'zip';

const TYPE_TABS: {
  key: FileTypeFilter;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}[] = [
  { key: 'all',    label: `全部`,   Icon: CloudIcon     },
  { key: 'folder', label: `文件夹`, Icon: FolderIcon    },
  { key: 'image',  label: `图片`,   Icon: ImageIcon     },
  { key: 'video',  label: `视频`,   Icon: VideoIcon     },
  { key: 'audio',  label: `音频`,   Icon: MusicIcon     },
  { key: 'doc',    label: `文档`,   Icon: FileTextIcon  },
  { key: 'zip',    label: `压缩包`, Icon: ArchiveIcon   },
];

const TAB_COLORS: Record<FileTypeFilter, { active: string; dot: string }> = {
  all:    { active: 'text-primary',     dot: 'bg-primary'     },
  folder: { active: 'text-indigo-500',  dot: 'bg-indigo-500'  },
  image:  { active: 'text-emerald-500', dot: 'bg-emerald-500' },
  video:  { active: 'text-rose-400',    dot: 'bg-rose-400'    },
  audio:  { active: 'text-amber-500',   dot: 'bg-amber-500'   },
  doc:    { active: 'text-blue-500',    dot: 'bg-blue-500'    },
  zip:    { active: 'text-purple-500',  dot: 'bg-purple-500'  },
};

// ─── Storage stats ────────────────────────────────────────────────────────────
const STORAGE_USED_GB = 14.3;
const STORAGE_TOTAL_GB = 50;
const STORAGE_PCT = Math.round((STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100);

// ─── Category Popover ─────────────────────────────────────────────────────────
interface CategoryPopoverProps {
  visible: boolean;
  current: FileTypeFilter;
  onSelect: (key: FileTypeFilter) => void;
  onClose: () => void;
}

function CategoryPopover({ visible, current, onSelect, onClose }: CategoryPopoverProps) {
  const rows: (typeof TYPE_TABS[number] | null)[][] = [
    [TYPE_TABS[0], TYPE_TABS[1], TYPE_TABS[2]],
    [TYPE_TABS[3], TYPE_TABS[4], TYPE_TABS[5]],
    [TYPE_TABS[6], null, null],
  ];

  return (
    <div
      data-cmp="CategoryPopover"
      className={`fixed inset-0 z-50 ${visible ? '' : 'pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`absolute inset-0 bg-foreground/20 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-custom border-t border-border px-4 pt-4 pb-8 transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-stretch gap-2 mb-2 last:mb-0">
            {row.map((tab, ci) => {
              if (!tab) return <div key={ci} className="flex-1" />;
              const isActive = current === tab.key;
              const colors = TAB_COLORS[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => { onSelect(tab.key); onClose(); }}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all ${
                    isActive
                      ? `${colors.active} tab-active-pill border border-primary/20`
                      : `text-muted-foreground bg-muted/40 active:bg-muted`
                  }`}
                >
                  <tab.Icon size={20} strokeWidth={2} />
                  <span className="text-xs font-medium leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
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
        {/* icon */}
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

  // sync when dialog opens with a new file
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-8" onClick={onCancel}>
      <div className="absolute inset-0 bg-foreground/40" />
      <div
        className="relative bg-card rounded-3xl shadow-custom border border-border w-full max-w-xs p-6 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* icon */}
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function FilesPage() {
  const navigate = useNavigate();
  const [pathStack, setPathStack] = useState<BreadcrumbItem[]>([{ label: `全部文件`, path: '/' }]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [layout, setLayout] = useState<LayoutMode>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>('all');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [fileActionTarget, setFileActionTarget] = useState<FileItem | null>(null);

  // dialog states
  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; label: string; onConfirm: () => void }>({
    visible: false, label: '', onConfirm: () => {},
  });
  const [renameDialog, setRenameDialog] = useState<{ visible: boolean; initialName: string; onConfirm: (n: string) => void }>({
    visible: false, initialName: '', onConfirm: () => {},
  });

  // download task count (badge)
  const [downloadCount, setDownloadCount] = useState(0);

  // ── Pull to refresh ──
  const { containerRef, pulling, refreshing, pullDistance, threshold, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullRefresh({
    onRefresh: async () => {
      await new Promise((r) => setTimeout(r, 1200));
      setRefreshKey((k) => k + 1);
      toast.success(`云盘文件已刷新`);
      console.log(`[FilesPage] pull refresh done`);
    },
  });

  const currentPath = pathStack[pathStack.length - 1].path;
  const rawFiles = getFilesForPath(currentPath);
  const files = typeFilter === 'all' ? rawFiles : rawFiles.filter((f) => f.type === typeFilter);

  const isSelecting = selectedIds.size > 0;
  const allSelected = selectedIds.size === files.length && files.length > 0;
  const isAtRoot = pathStack.length === 1;

  const currentTab = TYPE_TABS.find((t) => t.key === typeFilter)!;

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      console.log(`[FileSelect] toggled ${id}, now:`, Array.from(next));
      return next;
    });
  }, []);

  const handleOpenFolder = useCallback((file: FileItem) => {
    console.log(`[Navigate] folder: ${file.name} -> ${file.path}`);
    setPathStack((prev) => [...prev, { label: file.name, path: file.path }]);
    setSelectedIds(new Set());
    setTypeFilter('all');
  }, []);

  const handleOpenFile = useCallback((file: FileItem) => {
    console.log(`[Navigate] file detail: ${file.name}`);
    navigate('/file-detail', { state: file });
  }, [navigate]);

  const handleNavigateBreadcrumb = useCallback((path: string) => {
    console.log(`[Breadcrumb] -> ${path}`);
    setPathStack((prev) => {
      const idx = prev.findIndex((b) => b.path === path);
      return idx >= 0 ? prev.slice(0, idx + 1) : prev;
    });
    setSelectedIds(new Set());
    setTypeFilter('all');
  }, []);

  const handleCancelSelection = () => setSelectedIds(new Set());
  const handleSelectAll      = () => setSelectedIds(new Set(files.map((f) => f.id)));
  const handleDeselectAll    = () => setSelectedIds(new Set());

  // ── Selection footer actions ──
  const handleDelete = () => {
    const count = selectedIds.size;
    setDeleteDialog({
      visible: true,
      label: `${count} 个文件`,
      onConfirm: () => {
        toast.success(`已删除 ${count} 个文件`);
        setSelectedIds(new Set());
        setDeleteDialog((d) => ({ ...d, visible: false }));
      },
    });
  };

  const handleRename = () => {
    const f = files.find((f) => selectedIds.has(f.id));
    if (!f) return;
    setRenameDialog({
      visible: true,
      initialName: f.name,
      onConfirm: (newName) => {
        toast.success(`已重命名为：${newName}`);
        setRenameDialog((d) => ({ ...d, visible: false }));
      },
    });
  };

  const handleInfo = () => {
    const f = files.find((fi) => selectedIds.has(fi.id));
    if (f) navigate('/file-detail', { state: f });
  };

  const handleMove = () => {
    const names = files.filter((f) => selectedIds.has(f.id)).map((f) => f.name);
    navigate('/move-file', { state: { names } });
  };

  const handleDownload = () => {
    const count = selectedIds.size;
    setDownloadCount((c) => c + count);
    toast.success(`已添加 ${count} 个下载任务`);
    setSelectedIds(new Set());
  };

  const handleUploadFile   = () => toast.success(`文件上传功能已打开`);
  const handleCreateFolder = (name: string) => toast.success(`文件夹「${name}」已创建`);

  const handleFileAction = useCallback((file: FileItem) => { setFileActionTarget(file); }, []);

  // ── FileActionSheet callbacks ──
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

  return (
    <div
      data-cmp="FilesPage"
      ref={containerRef}
      className="relative min-h-screen bg-transparent flex flex-col max-w-md mx-auto overflow-x-hidden overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: pulling || refreshing ? `translateY(${Math.min(pullDistance, threshold * 1.2)}px)` : undefined, transition: pulling ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.1,0.64,1)' }}
    >
      <Toaster position="top-center" richColors />

      {/* ── Pull Refresh Indicator ── */}
      <PullRefreshIndicator pulling={pulling} refreshing={refreshing} pullDistance={pullDistance} threshold={threshold} />

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

      {/* ── Selection Action Header ── */}
      <SelectionHeader
        visible={isSelecting}
        selectedCount={selectedIds.size}
        totalCount={files.length}
        allSelected={allSelected}
        onCancel={handleCancelSelection}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      {/* ── Top Bar: Search (left ~47%) + Transfer + Add (right) ── */}
      <header className="px-5 pt-10 pb-4 bg-transparent flex items-center justify-between gap-2">
        {/* Search — 约47%宽 */}
        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 h-10 px-3.5 rounded-2xl bg-card border border-border shadow-custom active:border-primary/40 transition-colors"
          style={{ width: '47%', minWidth: 0 }}
        >
          <SearchIcon size={14} className="text-muted-foreground flex-shrink-0" strokeWidth={2.5} />
          <span className="text-sm text-muted-foreground truncate">{`搜索文件...`}</span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Transfer button with badge */}
          <div className="relative">
            <button
              onClick={() => navigate('/transfer')}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom active:bg-muted transition-colors"
            >
              <ArrowRightLeftIcon size={16} className="text-foreground" strokeWidth={2} />
            </button>
            {downloadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none shadow-sm">
                {downloadCount > 99 ? '99+' : downloadCount}
              </span>
            )}
          </div>
          {/* Add button */}
          <button
            onClick={() => setAddSheetOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary active:bg-primary/80 transition-colors shadow-custom"
          >
            <PlusIcon size={20} className="text-primary-foreground" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* ── Storage Card (root only, compact) ── */}
      <div className={`px-4 mb-3 ${isAtRoot ? '' : 'hidden'}`}>
        <div className="storage-gradient rounded-2xl px-4 py-3 shadow-custom">
          <div className="flex items-center justify-between">
            {/* Left: icon + used */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <CloudIcon size={14} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <div className="text-white text-sm font-bold leading-none">{STORAGE_USED_GB} <span className="text-xs font-normal opacity-70">GB</span></div>
                <div className="text-white/60 text-xs mt-0.5">/ {STORAGE_TOTAL_GB} GB</div>
              </div>
            </div>
            {/* Right: pct badge */}
            <span className="text-white text-xs font-medium bg-white/20 px-2.5 py-1 rounded-full">{STORAGE_PCT}% 已用</span>
          </div>
          {/* Progress */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-white rounded-full storage-bar"
              style={{ '--fill-pct': `${STORAGE_PCT}%`, width: `${STORAGE_PCT}%` } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      {/* ── Sticky area ── */}
      <div className="sticky top-0 z-20 bg-background">
        {/* Breadcrumb (non-root) */}
        <div className={isAtRoot ? 'hidden' : ''}>
          <BreadcrumbNav items={pathStack} onNavigate={handleNavigateBreadcrumb} />
        </div>

        {/* Category selector + layout toggle */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Category selector pill */}
          <button
            onClick={() => setCategoryOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all text-xs font-semibold shadow-custom ${
              typeFilter === 'all'
                ? `text-primary tab-active-pill`
                : `${TAB_COLORS[typeFilter].active} tab-active-pill`
            }`}
          >
            <currentTab.Icon size={13} strokeWidth={2.2} />
            <span>{currentTab.label}</span>
            <ChevronDownIcon size={12} strokeWidth={2.5} className="ml-0.5 opacity-70" />
          </button>

          {/* Layout toggle */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-custom">
            <button
              onClick={() => setLayout('list')}
              className={`flex items-center justify-center w-8 h-6 rounded-lg transition-all ${
                layout === 'list' ? 'bg-primary text-primary-foreground shadow-custom' : 'text-muted-foreground'
              }`}
            >
              <LayoutListIcon size={13} strokeWidth={2} />
            </button>
            <button
              onClick={() => setLayout('grid')}
              className={`flex items-center justify-center w-8 h-6 rounded-lg transition-all ${
                layout === 'grid' ? 'bg-primary text-primary-foreground shadow-custom' : 'text-muted-foreground'
              }`}
            >
              <LayoutGridIcon size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Category Popover ── */}
      <CategoryPopover
        visible={categoryOpen}
        current={typeFilter}
        onSelect={(key) => { setTypeFilter(key); console.log(`[CategoryFilter] set: ${key}`); }}
        onClose={() => setCategoryOpen(false)}
      />

      {/* ── File List ── */}
      <div className={`flex-1 ${isSelecting ? 'pb-44' : 'pb-32'}`}>
        <FileList
          key={refreshKey}
          files={files}
          layout={layout}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onOpenFolder={handleOpenFolder}
          onOpenFile={handleOpenFile}
          onFileAction={handleFileAction}
        />
      </div>

      {/* ── Add Sheet ── */}
      <AddSheet
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onUploadFile={handleUploadFile}
        onCreateFolder={handleCreateFolder}
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

      {/* ── Selection Footer ── */}
      <SelectionFooter
        visible={isSelecting}
        selectedCount={selectedIds.size}
        onDelete={handleDelete}
        onRename={handleRename}
        onInfo={handleInfo}
        onMove={handleMove}
        onDownload={handleDownload}
      />
    </div>
  );
}
