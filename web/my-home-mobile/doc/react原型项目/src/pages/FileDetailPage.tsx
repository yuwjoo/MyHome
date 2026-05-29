import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, DownloadIcon, FileTextIcon, ImageIcon, VideoIcon, MusicIcon, ArchiveIcon, FileIcon, FolderIcon, CalendarIcon, HardDriveIcon, FolderOpenIcon, HashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FileItem, FileType } from '../types';

const TYPE_META: Record<FileType, {
  label: string;
  iconBg: string;
  iconColor: string;
  heroBg: string;
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}> = {
  folder:  { label: '文件夹',  iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-500',  heroBg: 'from-indigo-50 to-indigo-100/60',   Icon: FolderIcon   },
  image:   { label: '图片',    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500', heroBg: 'from-emerald-50 to-emerald-100/60', Icon: ImageIcon    },
  video:   { label: '视频',    iconBg: 'bg-rose-100',    iconColor: 'text-rose-400',    heroBg: 'from-rose-50 to-rose-100/60',       Icon: VideoIcon    },
  audio:   { label: '音频',    iconBg: 'bg-amber-100',   iconColor: 'text-amber-500',   heroBg: 'from-amber-50 to-amber-100/60',     Icon: MusicIcon    },
  doc:     { label: '文档',    iconBg: 'bg-blue-100',    iconColor: 'text-blue-500',    heroBg: 'from-blue-50 to-blue-100/60',       Icon: FileTextIcon },
  zip:     { label: '压缩包',  iconBg: 'bg-purple-100',  iconColor: 'text-purple-500',  heroBg: 'from-purple-50 to-purple-100/60',   Icon: ArchiveIcon  },
  default: { label: '文件',    iconBg: 'bg-slate-100',   iconColor: 'text-slate-400',   heroBg: 'from-slate-50 to-slate-100/60',     Icon: FileIcon     },
};

function formatDate(str: string) {
  const d = new Date(str);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}  ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

interface InfoRowProps { icon: React.ReactNode; label: string; value: string }
function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border last:border-b-0">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-sm text-muted-foreground flex-shrink-0 w-16">{label}</span>
      <span className="text-sm font-medium text-foreground flex-1 text-right truncate">{value}</span>
    </div>
  );
}

export default function FileDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const file = (location.state as FileItem | null) ?? {
    id: '4',
    name: '项目报告.pdf',
    type: 'doc' as FileType,
    size: '3.2 MB',
    modifiedAt: '2025-06-12T14:22:00',
    path: '/report.pdf',
  };

  const meta = TYPE_META[file.type as FileType] ?? TYPE_META.default;
  const FileTypeIcon = meta.Icon;

  const handleDownload = () => {
    toast.success(`已添加下载任务：${file.name}`);
    console.log(`[FileDetail] download: ${file.name}`);
  };

  return (
    <div data-cmp="FileDetailPage" className="min-h-screen bg-background flex flex-col max-w-md mx-auto">

      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 px-5 pt-10 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom active:bg-muted transition-colors flex-shrink-0"
        >
          <ArrowLeftIcon size={18} className="text-foreground" strokeWidth={2.2} />
        </button>
        <div className="text-base font-bold text-foreground flex-1 truncate">文件详情</div>
      </header>

      {/* ── Hero: file icon + name ── */}
      <div className="mx-5 mb-5">
        <div className={`rounded-3xl bg-gradient-to-b ${meta.heroBg} border border-border shadow-custom flex flex-col items-center justify-center py-10 px-6`}>
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${meta.iconBg} shadow-sm mb-4`}>
            <FileTypeIcon size={36} className={meta.iconColor} strokeWidth={1.5} />
          </div>
          <div className="text-base font-bold text-foreground text-center leading-snug px-2 mb-2">{file.name}</div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.iconBg} ${meta.iconColor}`}>{meta.label}</span>
            {file.size && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 text-muted-foreground border border-border">{file.size}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── File info card ── */}
      <div className="mx-5 mb-5">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">基本信息</div>
        <div className="bg-card rounded-2xl border border-border shadow-custom px-4">
          <InfoRow
            icon={<HashIcon size={13} className="text-muted-foreground" strokeWidth={2} />}
            label="文件名"
            value={file.name}
          />
          {file.size && (
            <InfoRow
              icon={<HardDriveIcon size={13} className="text-muted-foreground" strokeWidth={2} />}
              label="大小"
              value={file.size}
            />
          )}
          <InfoRow
            icon={<FolderOpenIcon size={13} className="text-muted-foreground" strokeWidth={2} />}
            label="路径"
            value={file.path}
          />
          <InfoRow
            icon={<CalendarIcon size={13} className="text-muted-foreground" strokeWidth={2} />}
            label="修改时间"
            value={formatDate(file.modifiedAt)}
          />
          {file.type === 'folder' && file.childCount !== undefined && (
            <InfoRow
              icon={<FolderIcon size={13} className="text-muted-foreground" strokeWidth={2} />}
              label="包含"
              value={`${file.childCount} 项`}
            />
          )}
        </div>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Download button ── */}
      <div className="px-5 pb-10">
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:opacity-80 transition-opacity shadow-custom"
        >
          <DownloadIcon size={20} strokeWidth={2} />
          下载文件
        </button>
        <p className="text-center text-xs text-muted-foreground mt-2.5">下载任务将在传输页面中显示进度</p>
      </div>
    </div>
  );
}
