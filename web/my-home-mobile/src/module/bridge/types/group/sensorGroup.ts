/**
 * 传感器分组消息
 */

/**
 * 温湿度传感器负载
 */
export interface TempHumidPayload {
  /**
   * 温度
   */
  temperature: number

  /**
   * 湿度
   */
  humidity: number
}

export type SensorGroup = {
  /**
   * 温湿度状态订阅
   */
  tempHumid: {
    type: 'event'
    params: { action: 'on' | 'off' }
    callbacks: { onTempHumid: (data: TempHumidPayload) => void }
  }
}
