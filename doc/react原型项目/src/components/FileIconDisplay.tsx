import { FileType } from '../types';
import {
  FolderIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileTextIcon,
  ArchiveIcon,
  FileIcon,
} from 'lucide-react';

interface FileIconDisplayProps {
  type: FileType;
  size?: number;
  className?: string;
}

const typeConfig: Record<FileType, {
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  colorClass: string;
  bgClass: string;
}> = {
  folder:  { Icon: FolderIcon,   colorClass: 'text-indigo-500',  bgClass: 'bg-indigo-100/80'  },
  image:   { Icon: ImageIcon,    colorClass: 'text-emerald-500', bgClass: 'bg-emerald-100/80' },
  video:   { Icon: VideoIcon,    colorClass: 'text-rose-400',    bgClass: 'bg-rose-100/80'    },
  audio:   { Icon: MusicIcon,    colorClass: 'text-amber-500',   bgClass: 'bg-amber-100/80'   },
  doc:     { Icon: FileTextIcon, colorClass: 'text-blue-500',    bgClass: 'bg-blue-100/80'    },
  zip:     { Icon: ArchiveIcon,  colorClass: 'text-purple-500',  bgClass: 'bg-purple-100/80'  },
  default: { Icon: FileIcon,     colorClass: 'text-slate-400',   bgClass: 'bg-slate-100/80'   },
};

export function FileIconDisplay({ type, size = 22, className = '' }: FileIconDisplayProps) {
  const cfg = typeConfig[type] ?? typeConfig.default;
  const { Icon, colorClass, bgClass } = cfg;
  const containerSize = Math.round(size * 2.1);
  return (
    <div
      data-cmp="FileIconDisplay"
      className={`flex items-center justify-center rounded-2xl ${bgClass} ${className}`}
      style={{ width: containerSize, height: containerSize, flexShrink: 0 }}
    >
      <Icon size={size} className={colorClass} strokeWidth={1.6} />
    </div>
  );
}

export function getFileTypeColor(type: FileType): string {
  return typeConfig[type]?.colorClass ?? typeConfig.default.colorClass;
}
