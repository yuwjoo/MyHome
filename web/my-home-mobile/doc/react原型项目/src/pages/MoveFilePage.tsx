import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, FolderIcon, ChevronRightIcon, CheckIcon, FolderOpenIcon } from 'lucide-react';
import { toast } from 'sonner';

interface FolderNode {
  id: string;
  name: string;
  path: string;
  children?: FolderNode[];
}

const FOLDER_TREE: FolderNode[] = [
  {
    id: 'root',
    name: '全部文件',
    path: '/',
    children: [
      {
        id: '1',
        name: '我的文档',
        path: '/docs',
        children: [
          { id: 'd1', name: '季度报告Q2', path: '/docs/q2' },
        ],
      },
      {
        id: '2',
        name: '图片素材',
        path: '/images',
        children: [],
      },
      {
        id: '3',
        name: '视频剪辑',
        path: '/videos',
        children: [],
      },
      {
        id: '7',
        name: '音乐收藏',
        path: '/music',
        children: [],
      },
    ],
  },
];

function FolderTreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FolderNode;
  depth: number;
  selectedPath: string;
  onSelect: (path: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.path, node.name);
          if (hasChildren) setExpanded((v) => !v);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
          isSelected
            ? 'bg-primary/10 border border-primary/25'
            : 'bg-transparent active:bg-muted'
        }`}
        style={{ paddingLeft: `${16 + depth * 20}px` }}
      >
        {/* expand toggle */}
        <div className="w-4 flex-shrink-0 flex items-center justify-center">
          {hasChildren ? (
            <ChevronRightIcon
              size={13}
              strokeWidth={2.5}
              className={`text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            />
          ) : (
            <span className="w-4" />
          )}
        </div>

        {/* folder icon */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary/20' : 'bg-indigo-50'}`}>
          {expanded && hasChildren
            ? <FolderOpenIcon size={16} className={isSelected ? 'text-primary' : 'text-indigo-400'} strokeWidth={2} />
            : <FolderIcon size={16} className={isSelected ? 'text-primary' : 'text-indigo-400'} strokeWidth={2} />
          }
        </div>

        {/* name */}
        <span className={`flex-1 text-sm font-medium text-left truncate ${isSelected ? 'text-primary font-semibold' : 'text-foreground'}`}>
          {node.name}
        </span>

        {/* check mark */}
        {isSelected && (
          <CheckIcon size={15} className="text-primary flex-shrink-0" strokeWidth={2.5} />
        )}
      </button>

      {/* children */}
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FolderTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MoveFilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const file = location.state as { name?: string; names?: string[] } | null;
  const fileName = file?.name ?? (file?.names ? `${file.names.length} 个文件` : '文件');

  const [selectedPath, setSelectedPath] = useState('/');
  const [selectedName, setSelectedName] = useState('全部文件');

  const handleSelect = (path: string, name: string) => {
    setSelectedPath(path);
    setSelectedName(name);
  };

  const handleConfirm = () => {
    toast.success(`已将 ${fileName} 移动到 ${selectedName}`);
    navigate(-1);
  };

  return (
    <div data-cmp="MoveFilePage" className="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-0">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-5 pt-10 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom active:bg-muted transition-colors"
        >
          <ArrowLeftIcon size={18} className="text-foreground" strokeWidth={2.2} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-base font-bold text-foreground">移动文件</div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate px-4">{fileName}</div>
        </div>
        <div className="w-10" />
      </header>

      {/* ── Destination hint ── */}
      <div className="mx-5 mb-4 px-4 py-3 bg-primary/8 rounded-2xl border border-primary/15 flex items-center gap-2">
        <FolderIcon size={14} className="text-primary flex-shrink-0" strokeWidth={2} />
        <span className="text-xs text-primary font-medium">移动到：</span>
        <span className="text-xs text-primary font-semibold truncate">{selectedName}</span>
      </div>

      {/* ── Folder tree ── */}
      <div className="flex-1 px-4 overflow-y-auto pb-36">
        <div className="bg-card rounded-2xl border border-border shadow-custom px-2 py-2">
          {FOLDER_TREE.map((node) => (
            <FolderTreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-5 pt-4 pb-8 flex gap-3 max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-semibold text-sm active:opacity-80 transition-opacity border border-border"
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:opacity-80 transition-opacity shadow-custom"
        >
          移动到此处
        </button>
      </div>
    </div>
  );
}
