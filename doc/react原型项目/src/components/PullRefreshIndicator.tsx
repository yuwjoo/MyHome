import { RefreshCwIcon } from 'lucide-react';

interface PullRefreshIndicatorProps {
  pulling?: boolean;
  refreshing?: boolean;
  pullDistance?: number;
  threshold?: number;
}

export function PullRefreshIndicator({
  pulling = false,
  refreshing = false,
  pullDistance = 0,
  threshold = 72,
}: PullRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  const visible = pulling || refreshing;

  return (
    <div
      data-cmp="PullRefreshIndicator"
      className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-200"
      style={{
        top: 0,
        height: visible ? `${Math.max(pullDistance, refreshing ? 52 : 0)}px` : '0px',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-custom"
        style={{ opacity: Math.max(progress, refreshing ? 1 : 0) }}
      >
        <RefreshCwIcon
          size={15}
          strokeWidth={2.5}
          className={`text-primary transition-transform ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${rotation}deg)` }}
        />
        <span className="text-xs font-semibold text-primary">
          {refreshing ? `刷新中...` : progress >= 1 ? `释放刷新` : `下拉刷新`}
        </span>
      </div>
    </div>
  );
}
