/**
 * 分组消息类型聚合
 */

import type { BedroomACGroup } from './bedroomACGroup'
import type { SensorGroup } from './sensorGroup'
import type { DeviceStatusGroup } from './deviceStatusGroup'
import type { LanUdpGroup } from './lanUdpGroup'

export interface Groups {
  /**
   * 卧室空调
   */
  bedroomAC: BedroomACGroup

  /**
   * 传感器
   */
  sensor: SensorGroup

  /**
   * ESP8266 设备状态
   */
  deviceStatus: DeviceStatusGroup

  /**
   * 局域网 UDP 设备
   */
  lanUdp: LanUdpGroup
}
