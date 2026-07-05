/**
 * ESP8266 设备状态分组消息
 */

/**
 * ESP8266 设备负载
 */
export interface DeviceStatusPayload {
  /**
   * 是否在线
   */
  isOnline: boolean

  /**
   * 更新时间戳
   */
  updateTime: number
}

export type DeviceStatusGroup = {
  /**
   * 设备在线状态订阅
   */
  deviceStatus: {
    type: 'event'
    params: { action: 'on' | 'off' }
    callbacks: { onDeviceStatus: (data: DeviceStatusPayload) => void }
  }
}
