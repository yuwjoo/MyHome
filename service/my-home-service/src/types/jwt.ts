/**
 * JWT令牌负载
 */
export interface JwtPayload {
  userId: number; // 用户id
  userAccount: string; // 用户账号
}
