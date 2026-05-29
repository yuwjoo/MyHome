// 用户个人信息相关API模拟

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
 * 获取用户信息
 * @returns 用户信息
 */
export const getUserInfo = async (): Promise<UserInfo> => {
  // 模拟API请求延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 返回模拟的用户数据
  return {
    id: "1234567890",
    nickname: "MYHOME",
    avatar: "https://img.icons8.com/color/200/user-male-circle--v1.png"
  };
};

/**
 * 更新用户头像
 * @param avatarUrl 新头像URL
 * @returns 更新是否成功
 */
export const updateAvatar = async (avatarUrl: string): Promise<boolean> => {
  // 模拟API请求延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 模拟成功响应
  console.log("头像更新成功:", avatarUrl);
  return true;
};

/**
 * 更新用户昵称
 * @param nickname 新昵称
 * @returns 更新是否成功
 */
export const updateNickname = async (nickname: string): Promise<boolean> => {
  // 模拟API请求延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 模拟成功响应
  console.log("昵称更新成功:", nickname);
  return true;
};

/**
 * 退出登录
 * @returns 退出是否成功
 */
export const logout = async (): Promise<boolean> => {
  // 模拟API请求延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 模拟成功响应
  console.log("用户退出登录");
  return true;
};
