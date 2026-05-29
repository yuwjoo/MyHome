import { Channel } from "./channel";

class ChannelStore {
  private channelMap: Map<string, Channel> = new Map(); // 通道Map

  /**
   * @description: 添加通道
   * @param {Channel} channel 通道
   */
  public add(channel: Channel): void {
    this.channelMap.set(channel.id, channel);
  }

  /**
   * @description: 获取通道
   * @param {string} id 通道id
   * @return {Channel | undefined} 通道
   */
  public get(id: string): Channel | undefined {
    return this.channelMap.get(id);
  }

  /**
   * @description: 删除通道
   * @param {string} id 通道id
   */
  public delete(id: string): void {
    this.channelMap.delete(id);
  }
}

export const channelStore = new ChannelStore();
