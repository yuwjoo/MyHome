import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ArrowLeftIcon, UploadIcon, DownloadIcon, CheckCircleIcon, CircleIcon, XCircleIcon, RefreshCwIcon } from 'lucide-react';

type TransferStatus = 'uploading' | 'downloading' | 'done' | 'failed' | 'waiting';

interface TransferTask {
  id: string;
  name: string;
  size: string;
  type: TransferStatus;
  progress: number;
  speed?: string;
  time?: string;
}

const MOCK_TASKS: TransferTask[] = [
  { id: '1', name: `宣传视频.mp4`,        size: `124 MB`, type: 'uploading',   progress: 68, speed: `2.3 MB/s` },
  { id: '2', name: `源代码备份.zip`,       size: `45.1 MB`, type: 'uploading',  progress: 31, speed: `1.1 MB/s` },
  { id: '3', name: `产品设计稿.png`,       size: `8.7 MB`,  type: 'done',       progress: 100, time: `刚刚` },
  { id: '4', name: `项目报告.pdf`,         size: `3.2 MB`,  type: 'done',       progress: 100, time: `2分钟前` },
  { id: '5', name: `会议录音.mp3`,         size: `22 MB`,   type: 'downloading', progress: 55, speed: `3.8 MB/s` },
  { id: '6', name: `财务数据.xlsx`,        size: `1.1 MB`,  type: 'failed',     progress: 42, time: `5分钟前` },
  { id: '7', name: `团队合照.jpg`,         size: `4.2 MB`,  type: 'waiting',    progress: 0 },
  { id: '8', name: `品牌LOGO.png`,         size: `450 KB`,  type: 'waiting',    progress: 0 },
];

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; dotColor: string }> = {
  uploading:   { label: `上传中`,   color: `text-primary`,      dotColor: `bg-primary`      },
  downloading: { label: `下载中`,   color: `text-emerald-500`,  dotColor: `bg-emerald-500`  },
  done:        { label: `已完成`,   color: `text-muted-foreground`, dotColor: `bg-emerald-400` },
  failed:      { label: `失败`,     color: `text-destructive`,  dotColor: `bg-destructive`  },
  waiting:     { label: `等待中`,   color: `text-muted-foreground`, dotColor: `bg-muted-foreground` },
};

type TabKey = 'all' | 'uploading' | 'downloading' | 'done';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',         label: `全部`   },
  { key: 'uploading',   label: `上传`   },
  { key: 'downloading', label: `下载`   },
  { key: 'done',        label: `已完成` },
];

export default function TransferPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const filteredTasks = MOCK_TASKS.filter((t) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'uploading') return t.type === 'uploading' || (t.type === 'waiting');
    if (activeTab === 'downloading') return t.type === 'downloading';
    if (activeTab === 'done') return t.type === 'done' || t.type === 'failed';
    return true;
  });

  const activeCount = MOCK_TASKS.filter((t) => t.type === 'uploading' || t.type === 'downloading').length;

  console.log(`[TransferPage] tab=${activeTab}, visible=${filteredTasks.length}`);

  return (
    <div data-cmp="TransferPage" className="relative min-h-screen bg-background flex flex-col max-w-md mx-auto overflow-x-hidden">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="px-5 pt-10 pb-4 bg-transparent">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/cloud')}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom active:bg-muted transition-colors"
          >
            <ArrowLeftIcon size={16} className="text-foreground" strokeWidth={2.5} />
          </button>
          <div>
            <div className="text-lg font-bold text-foreground">{`文件传输`}</div>
            <div className="text-xs text-muted-foreground">{activeCount} 个任务进行中</div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex items-center gap-2 px-5 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-2xl text-xs font-semibold transition-all flex-shrink-0 ${
              activeTab === tab.key
                ? `bg-primary text-primary-foreground shadow-custom`
                : `bg-card border border-border text-muted-foreground`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 px-4 pb-32 flex flex-col gap-2.5">
        {filteredTasks.map((task, i) => {
          const cfg = STATUS_CONFIG[task.type];
          const isActive = task.type === 'uploading' || task.type === 'downloading';
          return (
            <div
              key={task.id}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-card border border-transparent shadow-custom file-item-appear"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* type icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                task.type === 'uploading'   ? `bg-secondary`    :
                task.type === 'downloading' ? `bg-emerald-50`   :
                task.type === 'done'        ? `bg-muted`        :
                task.type === 'failed'      ? `bg-destructive/10` : `bg-muted`
              }`}>
                {task.type === 'uploading'   && <UploadIcon    size={16} className="text-primary"      strokeWidth={2} />}
                {task.type === 'downloading' && <DownloadIcon  size={16} className="text-emerald-500"  strokeWidth={2} />}
                {task.type === 'done'        && <CheckCircleIcon size={16} className="text-emerald-400" strokeWidth={2} />}
                {task.type === 'failed'      && <XCircleIcon   size={16} className="text-destructive"  strokeWidth={2} />}
                {task.type === 'waiting'     && <CircleIcon    size={16} className="text-muted-foreground" strokeWidth={2} />}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground truncate max-w-[60%]">{task.name}</span>
                  <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
                {/* progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      task.type === 'uploading'   ? `bg-primary`       :
                      task.type === 'downloading' ? `bg-emerald-400`   :
                      task.type === 'done'        ? `bg-emerald-400`   :
                      task.type === 'failed'      ? `bg-destructive`   : `bg-muted-foreground/30`
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{task.size}</span>
                  <span className="text-xs text-muted-foreground">
                    {isActive ? task.speed : task.time ?? ``}
                    {task.type !== 'waiting' && !isActive ? `` : ``}
                  </span>
                </div>
              </div>

              {/* action */}
              <div className="flex-shrink-0">
                {task.type === 'failed' && (
                  <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted active:bg-border transition-colors">
                    <RefreshCwIcon size={14} className="text-muted-foreground" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-sm font-medium">{`暂无传输任务`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
