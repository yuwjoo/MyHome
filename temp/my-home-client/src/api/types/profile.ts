// 用户个人信息相关类型定义

/**
 * 用户信息接口
 */
export interface UserInfo {
  /** 用户ID */
  id: string;
  /** 用户昵称 */
  nickname: string;
  /** 用户头像URL */
  avatar: string;
}

/**
 * 更新用户信息请求参数
 */
export interface UpdateUserInfoParams {
  /** 用户昵称（可选） */
  nickname?: string;
  /** 用户头像URL（可选） */
  avatar?: string;
}
