import type { RegisterParams } from "@/api/auth/types";

export type RegisterForm = RegisterParams & {
  confirmPassword: ""; // 确认密码
};
