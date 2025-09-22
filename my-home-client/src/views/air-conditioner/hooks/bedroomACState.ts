import type { FanSpeed, RunMode, WindDirection } from "../types/bedroomACState";

/**
 * 卧室空调状态管理 Hook
 */
export function useBedroomACState() {
  const isPowerOn = ref(false); // 电源状态(开机/关机)
  const temperature = ref(25); // 温度（摄氏度）
  const mode = ref<RunMode>("COOLING"); // 运行模式
  const fanSpeed = ref<FanSpeed>(-1); // 风速
  const windDirection = ref<WindDirection>("UNKNOWN"); // 风向
  const isAutoSwing = ref(false); // 是否自动扫风
  const isScreenDisplay = ref(false); // 是否屏显
  const timerStartTimestamp = ref(0); // 定时开始时间戳（毫秒）
  const timerEndTimestamp = ref(0); // 定时结束时间戳（毫秒）

  return {
    isPowerOn,
    temperature,
    mode,
    fanSpeed,
    windDirection,
    isAutoSwing,
    isScreenDisplay,
    timerStartTimestamp,
    timerEndTimestamp
  };
}
