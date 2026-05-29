import { FileItem, LayoutMode } from '../types';
import { FileIconDisplay } from './FileIconDisplay';
import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

interface FileListProps {
  files?: FileItem[];
  layout?: LayoutMode;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onOpenFolder?: (file: FileItem) => void;
  onOpenFile?: (file: FileItem) => void;
  onFileAction?: (file: FileItem) => void;
}

function formatDate(str: string) {
  const d = new Date(str);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  if (diffDays === 1) return `昨天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  if (diffDays < 7) return `${diffDays}天前`;
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}

export function FileList({
  files = [],
  layout = 'list',
  selectedIds = new Set(),
  onToggleSelect = () => {},
  onOpenFolder = () => {},
  onOpenFile = () => {},
  onFileAction = () => {},
}: FileListProps) {
  const isSelecting = selectedIds.size > 0;

  const handleItemClick = (file: FileItem) => {
    if (isSelecting) {
      onToggleSelect(file.id);
    } else if (file.type === 'folder') {
      onOpenFolder(file);
    } else {
      onOpenFile(file);
    }
  };

  if (layout === 'list') {
    return (
      <div data-cmp="FileList" className="flex flex-col px-4 py-2 gap-2">
        {files.map((file, i) => {
          const selected = selectedIds.has(file.id);
          return (
            <div
              key={file.id}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all file-item-appear shadow-custom ${
                selected
                  ? 'bg-secondary border border-primary/25'
                  : 'bg-card border border-transparent'
              }`}
              style={{ animationDelay: `${i * 0.035}s` }}
              onClick={() => handleItemClick(file)}
              onContextMenu={(e) => { e.preventDefault(); onToggleSelect(file.id); }}
            >
              {/* checkbox */}
              <div className={`transition-all duration-200 overflow-hidden flex-shrink-0 ${isSelecting ? 'w-6 opacity-100' : 'w-0 opacity-0'}`}>
                <input
                  type="checkbox"
                  className="file-checkbox"
                  checked={selected}
                  onChange={() => onToggleSelect(file.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* icon */}
              <FileIconDisplay type={file.type} size={22} />

              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate leading-snug">{file.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <span>{formatDate(file.modifiedAt)}</span>
                  {file.size && (
                    <>
                      <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                      <span>{file.size}</span>
                    </>
                  )}
                  {file.type === 'folder' && file.childCount !== undefined && (
                    <>
                      <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                      <span>{file.childCount} 项</span>
                    </>
                  )}
                </div>
              </div>

              {/* right indicator */}
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 flex items-center justify-center rounded-xl bg-muted ${isSelecting ? 'hidden' : ''}`}>
                  {file.type === 'folder'
                    ? <ChevronRightIcon size={14} className="text-muted-foreground" strokeWidth={2.5} />
                    : (
                      <button
                        className="w-full h-full flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); onFileAction(file); }}
                      >
                        <MoreHorizontalIcon size={14} className="text-muted-foreground" strokeWidth={2.5} />
                      </button>
                    )
                  }
                </div>
              </div>
            </div>
          );
        })}

        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="text-5xl mb-4">📂</div>
            <div className="text-sm font-medium">{`此文件夹为空`}</div>
          </div>
        )}
      </div>
    );
  }

  // Grid layout — 去除 size / childCount 信息，仅展示名称，压缩高度
  return (
    <div data-cmp="FileList" className="px-4 py-2">
      <div className="flex flex-wrap gap-2.5">
        {files.map((file, i) => {
          const selected = selectedIds.has(file.id);
          return (
            <div
              key={file.id}
              className={`relative flex flex-col rounded-2xl transition-all file-item-appear shadow-custom overflow-hidden ${
                selected ? 'bg-secondary border border-primary/25' : 'bg-card border border-transparent'
              }`}
              style={{ width: 'calc(33.333% - 7px)', animationDelay: `${i * 0.035}s` }}
              onClick={() => handleItemClick(file)}
              onContextMenu={(e) => { e.preventDefault(); onToggleSelect(file.id); }}
            >
              {/* icon area — compact */}
              <div className="flex items-center justify-center pt-4 pb-2.5">
                <FileIconDisplay type={file.type} size={26} />
              </div>

              {/* name only */}
              <div className="px-2 pb-3">
                <div className="text-xs font-semibold text-foreground text-center truncate leading-snug">{file.name}</div>
              </div>

              {/* top-right overlay: checkbox (selecting) or more button (file, not selecting) */}
              {isSelecting ? (
                <div className="absolute top-2 right-2">
                  <input
                    type="checkbox"
                    className="file-checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(file.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : file.type !== 'folder' ? (
                <button
                  className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-lg bg-transparent active:bg-black/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onFileAction(file); }}
                >
                  <MoreHorizontalIcon size={13} className="text-foreground/60" strokeWidth={2.5} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <div className="text-5xl mb-4">📂</div>
          <div className="text-sm font-medium">{`此文件夹为空`}</div>
        </div>
      )}
    </div>
  );
}
