/**
 * 局域网 UDP 设备分组消息
 */

/**
 * 内网设备负载
 */
export interface LanDevicePayload {
  /**
   * IP 地址
   */
  ipAddress: string

  /**
   * 设备名称
   */
  deviceName: string

  /**
   * 在线状态
   */
  online: boolean

  /**
   * 能力列表
   */
  abilities: string[]
}

/**
 * 设备列表负载
 */
export interface LanDeviceListPayload {
  /**
   * 设备列表
   */
  devices: LanDevicePayload[]
}

export type LanUdpGroup = {
  /**
   * 获取内网设备列表
   */
  getDeviceList: {
    type: 'action'
    params: Record<string, unknown>
    callbacks: { onResult: (data: LanDeviceListPayload) => void }
  }

  /**
   * 设备变更事件
   */
  devices: {
    type: 'event'
    params: { action: 'on' | 'off' }
    callbacks: { onDevices: (data: LanDeviceListPayload) => void }
  }

  /**
   * 连接状态变更事件
   */
  connection: {
    type: 'event'
    params: { action: 'on' | 'off' }
    callbacks: { onConnection: (data: { connected: boolean }) => void }
  }
}
