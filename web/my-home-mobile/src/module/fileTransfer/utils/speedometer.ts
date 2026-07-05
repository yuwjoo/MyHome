/**
 * 速度计算器
 * 基于滑动窗口实时计算瞬时传输速度
 * 200ms 采样一次，保留最近 10 个采样点（2 秒窗口）
 */
export class Speedometer {
  /** 采样窗口（最大 10 个点） */
  private samples: { time: number; loaded: number }[] = []
  /** 当前已传输量 */
  private currentLoaded = 0
  /** 速度变化回调 */
  private onChange: ((speed: number) => void) | null = null
  /** 定时器句柄 */
  private timerId: ReturnType<typeof setInterval> | null = null

  /** 采样间隔（毫秒） */
  private static readonly SAMPLE_INTERVAL = 200
  /** 最大采样点数 */
  private static readonly MAX_SAMPLES = 10

  /**
   * 启动速度计算
   * @param cb 速度变化回调，接收字节/秒
   */
  start(cb: (speed: number) => void): void {
    this.onChange = cb
    this.samples = []
    this.currentLoaded = 0
    this.timerId = setInterval(() => this.sample(), Speedometer.SAMPLE_INTERVAL)
  }

  /**
   * 更新当前已传输量（由 Engine 在 onProgress 中调用）
   */
  update(loaded: number): void {
    this.currentLoaded = loaded
  }

  /**
   * 停止速度计算并清空采样
   */
  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.samples = []
    this.onChange = null
  }

  /**
   * 重置（等同于 stop + 重置 currentLoaded）
   */
  reset(): void {
    this.stop()
    this.currentLoaded = 0
  }

  /**
   * 采样一次：记录当前时间和已传输量，计算瞬时速度
   */
  private sample(): void {
    const now = Date.now()
    this.samples.push({ time: now, loaded: this.currentLoaded })

    if (this.samples.length > Speedometer.MAX_SAMPLES) {
      this.samples.shift()
    }

    if (this.samples.length < 2 || !this.onChange) return

    const first = this.samples[0]!
    const last = this.samples[this.samples.length - 1]!
    const timeDelta = (last.time - first.time) / 1000
    if (timeDelta <= 0) return

    const speed = (last.loaded - first.loaded) / timeDelta
    this.onChange(speed)
  }
}
