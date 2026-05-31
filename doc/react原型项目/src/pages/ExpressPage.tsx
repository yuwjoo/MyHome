import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { PackageIcon, CopyIcon, ChevronRightIcon, MapPinIcon, ClockIcon, TruckIcon, CheckCircleIcon, SlidersHorizontalIcon, XIcon, SearchIcon } from 'lucide-react';
import { ExpressItem } from '../types';
import { PullRefreshIndicator } from '../components/PullRefreshIndicator';
import { usePullRefresh } from '../hooks/use-pull-refresh';

const EXPRESS_LIST: ExpressItem[] = [
  {
    id: 'e1',
    company: `顺丰速运`,
    trackingNo: `SF3112456789012`,
    pickupCode: `7823`,
    deadline: `今天 18:00前取件`,
    status: 'arrived',
    address: `智慧园区菜鸟驿站 1号柜`,
    name: `小米充电宝 (×1)`,
  },
  {
    id: 'e2',
    company: `京东物流`,
    trackingNo: `JD00243816312`,
    pickupCode: `4561`,
    deadline: `明天 12:00前取件`,
    status: 'arrived',
    address: `智慧园区菜鸟驿站 3号柜`,
    name: `《深度学习》书籍 (×2)`,
  },
  {
    id: 'e3',
    company: `中通快递`,
    trackingNo: `ZT7809341527`,
    pickupCode: ``,
    deadline: `预计明天下午到`,
    status: 'arriving',
    address: `—`,
    name: `运动鞋 (×1)`,
  },
  {
    id: 'e4',
    company: `圆通速递`,
    trackingNo: `YT2987654321`,
    pickupCode: ``,
    deadline: `预计后天上午到`,
    status: 'pending',
    address: `—`,
    name: `键盘 (×1)`,
  },
];

const STATUS_LABEL: Record<ExpressItem['status'], { text: string; style: string; dot: string }> = {
  arrived:  { text: `已到达`,   style: `bg-emerald-100 text-emerald-600`, dot: `bg-emerald-500` },
  arriving: { text: `派送中`,   style: `bg-amber-100 text-amber-600`,    dot: `bg-amber-500`   },
  pending:  { text: `待揽收`,   style: `bg-muted text-muted-foreground`, dot: `bg-muted-foreground` },
};

const COMPANY_COLORS: Record<string, string> = {
  '顺丰速运': `bg-red-100 text-red-500`,
  '京东物流': `bg-rose-100 text-rose-600`,
  '中通快递': `bg-amber-100 text-amber-600`,
  '圆通速递': `bg-yellow-100 text-yellow-600`,
};

const TIME_OPTIONS = ['全部时间', '今天', '近3天', '近7天', '近30天'];
const COMPANY_OPTIONS = ['全部公司', '顺丰速运', '京东物流', '中通快递', '圆通速递'];
const STATUS_OPTIONS: { label: string; value: ExpressItem['status'] | 'all' }[] = [
  { label: '全部状态', value: 'all' },
  { label: '已到达', value: 'arrived' },
  { label: '派送中', value: 'arriving' },
  { label: '待揽收', value: 'pending' },
];

function getCompanyInitial(name: string) {
  return name.slice(0, 1);
}

export default function ExpressPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Pull to refresh ──
  const { containerRef, pulling, refreshing, pullDistance, threshold, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullRefresh({
    onRefresh: async () => {
      await new Promise((r) => setTimeout(r, 1200));
      setRefreshKey((k) => k + 1);
      toast.success(`快递信息已刷新`);
      console.log(`[ExpressPage] pull refresh done`);
    },
  });

  // filter states
  const [filterTime, setFilterTime] = useState('全部时间');
  const [filterCompany, setFilterCompany] = useState('全部公司');
  const [filterStatus, setFilterStatus] = useState<ExpressItem['status'] | 'all'>('all');
  const [filterKeyword, setFilterKeyword] = useState('');

  // temp states inside drawer
  const [tempTime, setTempTime] = useState('全部时间');
  const [tempCompany, setTempCompany] = useState('全部公司');
  const [tempStatus, setTempStatus] = useState<ExpressItem['status'] | 'all'>('all');
  const [tempKeyword, setTempKeyword] = useState('');

  const openFilter = () => {
    setTempTime(filterTime);
    setTempCompany(filterCompany);
    setTempStatus(filterStatus);
    setTempKeyword(filterKeyword);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setFilterTime(tempTime);
    setFilterCompany(tempCompany);
    setFilterStatus(tempStatus);
    setFilterKeyword(tempKeyword);
    setFilterOpen(false);
  };

  const resetFilter = () => {
    setTempTime('全部时间');
    setTempCompany('全部公司');
    setTempStatus('all');
    setTempKeyword('');
  };

  const activeFilterCount = [
    filterTime !== '全部时间',
    filterCompany !== '全部公司',
    filterStatus !== 'all',
    filterKeyword.trim() !== '',
  ].filter(Boolean).length;

  const displayed = EXPRESS_LIST.filter(e => {
    if (tab === 'pending' && e.status === 'arrived') return false;
    if (filterCompany !== '全部公司' && e.company !== filterCompany) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterKeyword.trim() && !e.company.includes(filterKeyword) && !e.trackingNo.includes(filterKeyword) && !e.name.includes(filterKeyword)) return false;
    return true;
  });

  const arrivedCount = EXPRESS_LIST.filter(e => e.status === 'arrived').length;

  const copyCode = (item: ExpressItem) => {
    toast.success(`取件码 ${item.pickupCode} 已复制`);
    console.log(`[Express] copy pickup code: ${item.pickupCode}`);
  };

  return (
    <div
      data-cmp="ExpressPage"
      ref={containerRef}
      className="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: pulling || refreshing ? `translateY(${Math.min(pullDistance, threshold * 1.2)}px)` : undefined, transition: pulling ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.1,0.64,1)' }}
    >
      <Toaster position="top-center" richColors />

      {/* ── Pull Refresh Indicator ── */}
      <PullRefreshIndicator pulling={pulling} refreshing={refreshing} pullDistance={pullDistance} threshold={threshold} />

      {/* ── Header ── */}
      <header className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-xs text-muted-foreground font-medium">快递管理</div>
            <div className="text-xl font-bold text-foreground">我的快递</div>
          </div>
          <button
            onClick={openFilter}
            className="relative w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-custom"
          >
            <SlidersHorizontalIcon size={18} className="text-primary-foreground" strokeWidth={2} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Summary Card ── */}
      <div className="px-5 mb-5">
        <div className="storage-gradient rounded-3xl p-5 shadow-custom">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/80 text-xs font-medium mb-1">待取件</div>
              <div className="text-white text-3xl font-bold">{arrivedCount}</div>
              <div className="text-white/60 text-xs mt-0.5">件包裹等你去拿</div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white/90 text-xs">已到达 {arrivedCount} 件</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-white/90 text-xs">派送中 {EXPRESS_LIST.filter(e => e.status === 'arriving').length} 件</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab ── */}
      <div className="px-5 mb-3">
        <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5 shadow-custom">
          {([['pending', `待取件`], ['all', `全部快递`]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === key ? `bg-primary text-primary-foreground shadow-custom` : `text-muted-foreground`}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Express List ── */}
      <div className="px-5 flex flex-col gap-3">
        {displayed.map(item => {
          const st = STATUS_LABEL[item.status];
          const companyColor = COMPANY_COLORS[item.company] ?? `bg-primary/10 text-primary`;
          return (
            <div key={item.id} className="bg-card rounded-2xl p-4 shadow-custom border border-border">
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${companyColor}`}>
                    {getCompanyInitial(item.company)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{item.company}</div>
                    <div className="text-[10px] text-muted-foreground">{item.trackingNo}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.style}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.text}
                </div>
              </div>

              {/* Package name */}
              <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                <PackageIcon size={11} strokeWidth={2} />
                {item.name}
              </div>

              {/* Pickup code area */}
              <div className={`rounded-xl p-3 mb-3 ${item.status === 'arrived' ? `bg-primary/8 border border-primary/20` : `bg-muted`}`}>
                {item.status === 'arrived' ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-0.5">取件码</div>
                      <div className="flex items-center gap-2">
                        {item.pickupCode.split('').map((ch, i) => (
                          <span key={i} className="w-8 h-8 bg-card rounded-xl flex items-center justify-center text-lg font-bold text-primary shadow-custom border border-border">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => copyCode(item)}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-semibold shadow-custom"
                    >
                      <CopyIcon size={12} strokeWidth={2.5} />
                      复制
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <TruckIcon size={14} className="text-muted-foreground" strokeWidth={2} />
                    <span className="text-xs text-muted-foreground">取件码将在到达后显示</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPinIcon size={10} strokeWidth={2} />
                  <span>{item.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon size={10} strokeWidth={2} />
                  <span>{item.deadline}</span>
                </div>
              </div>
            </div>
          );
        })}
        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <PackageIcon size={36} strokeWidth={1.5} className="mb-3 opacity-30" />
            <span className="text-sm">暂无符合条件的快递</span>
          </div>
        )}
      </div>

      {/* Already taken hint */}
      <div className="px-5 mt-4 mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-2xl px-4 py-3">
          <CheckCircleIcon size={14} strokeWidth={2} className="text-emerald-500 flex-shrink-0" />
          <span>近 7 天已签收 5 件，<span className="text-primary font-medium">查看历史</span></span>
          <ChevronRightIcon size={12} strokeWidth={2.5} className="ml-auto" />
        </div>
      </div>

      {/* ── Filter Drawer ── */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-md mx-auto">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setFilterOpen(false)}
          />
          {/* Drawer */}
          <div className="relative bg-background rounded-t-3xl shadow-2xl px-5 pt-5 pb-8 flex flex-col gap-5 z-10">
            {/* Handle */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border" />

            {/* Header */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-bold text-foreground">筛选快递</span>
              <button onClick={() => setFilterOpen(false)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <XIcon size={16} strokeWidth={2} className="text-muted-foreground" />
              </button>
            </div>

            {/* Keyword Search */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">模糊搜索</div>
              <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 py-2.5 border border-border">
                <SearchIcon size={14} strokeWidth={2} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={tempKeyword}
                  onChange={e => setTempKeyword(e.target.value)}
                  placeholder="公司名、单号、商品名..."
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                />
                {tempKeyword && (
                  <button onClick={() => setTempKeyword('')}>
                    <XIcon size={13} strokeWidth={2} className="text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Time Filter */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">时间范围</div>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setTempTime(opt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tempTime === opt ? 'bg-primary text-primary-foreground shadow-custom' : 'bg-muted text-muted-foreground'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Company Filter */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">快递公司</div>
              <div className="flex flex-wrap gap-2">
                {COMPANY_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setTempCompany(opt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tempCompany === opt ? 'bg-primary text-primary-foreground shadow-custom' : 'bg-muted text-muted-foreground'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">快递状态</div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTempStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tempStatus === opt.value ? 'bg-primary text-primary-foreground shadow-custom' : 'bg-muted text-muted-foreground'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-1">
              <button
                onClick={resetFilter}
                className="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground text-sm font-semibold"
              >
                重置
              </button>
              <button
                onClick={applyFilter}
                className="flex-2 flex-[2] py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-custom"
              >
                应用筛选
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
