/**
 * 运行模式 - COOLING：制冷，HEATING：制热
 */
export type RunMode = "COOLING" | "HEATING";

/**
 * 风速 - -1：自动，1-7：风速档位
 */
export type FanSpeed = -1 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * 风向 - UP：上风，MIDDLE：中风，DOWN：下风，UNKNOWN：未知
 */
export type WindDirection = "UP" | "MIDDLE" | "DOWN" | "UNKNOWN";
