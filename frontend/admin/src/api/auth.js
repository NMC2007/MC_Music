import api from "../lib/axios";

/**
 * Đăng nhập tài khoản Admin
 * @param {Object} credentials - { email, password }
 */
export const loginApi = async (credentials) => {
  const response = await api.post("/admin/auth/login", credentials);
  return response.data;
};

/**
 * Làm mới Access Token bằng Refresh Token
 * @param {string} refreshToken
 */
export const refreshTokenApi = async (refreshToken) => {
  const response = await api.post("/admin/auth/refresh", { refreshToken });
  return response.data;
};

/**
 * Đăng xuất tài khoản Admin
 * @param {string} refreshToken
 */
export const logoutApi = async (refreshToken) => {
  const response = await api.post("/admin/auth/logout", { refreshToken });
  return response.data;
};

