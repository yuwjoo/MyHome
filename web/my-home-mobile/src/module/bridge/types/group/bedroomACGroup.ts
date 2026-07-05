/**
 * 卧室空调分组消息
 */

/**
 * 空调运行模式
 */
export type ACMode = 'cool' | 'heat' | 'dry' | 'fan'

/**
 * 空调风速
 */
export type ACWindSpeed = 'auto' | 'low' | 'medium' | 'high'

/**
 * 卧室空调状态负载
 */
export interface AcStatePayload {
  /**
   * 电源开关
   */
  power: boolean

  /**
   * 设定温度
   */
  temperature: number

  /**
   * 运行模式
   */
  mode: ACMode

  /**
   * 摆风
   */
  swing: boolean

  /**
   * 风速
   */
  windSpeed: ACWindSpeed

  /**
   * 舒风模式
   */
  gentle: boolean

  /**
   * 屏显
   */
  light: boolean

  /**
   * 定时开机（分钟）
   */
  onTimer: number

  /**
   * 定时关机（分钟）
   */
  offTimer: number
}

export type BedroomACGroup = {
  /**
   * 开关电源
   */
  togglePower: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 温度 +1
   */
  increaseTemperature: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 温度 -1
   */
  decreaseTemperature: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 切换摆风
   */
  toggleSwing: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 制冷模式
   */
  setCoolingMode: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 制热模式
   */
  setHeatingMode: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 除湿模式
   */
  setDryMode: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 送风模式
   */
  setFanMode: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 切换风速
   */
  toggleWindSpeed: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 舒风模式
   */
  enableGentleMode: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 切换屏显
   */
  toggleLight: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 定时开机
   */
  setOnTimer: {
    type: 'action'
    params: { minutes: number }
    callbacks: Record<string, never>
  }

  /**
   * 定时关机
   */
  setOffTimer: {
    type: 'action'
    params: { minutes: number }
    callbacks: Record<string, never>
  }

  /**
   * 取消定时开机
   */
  cancelOnTimer: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 取消定时关机
   */
  cancelOffTimer: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: Record<string, never>
  }

  /**
   * 空调状态订阅
   */
  acState: {
    type: 'event'
    params: { action: 'on' | 'off' }
    callbacks: { onAcState: (data: AcStatePayload) => void }
  }
}
