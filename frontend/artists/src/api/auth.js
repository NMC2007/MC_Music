import api from '#/lib/axios';

/**
 * Đăng nhập tài khoản Nghệ sĩ
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} ApiResponse chứa AuthResponse (artistId, email, stageName, accessToken, refreshToken)
 */
export const loginApi = async (credentials) => {
  const response = await api.post('/artist/auth/login', credentials);
  return response.data;
};

/**
 * Đăng ký tài khoản Nghệ sĩ mới
 * @param {Object} data - { email, password, stageName, biography }
 * @returns {Promise<Object>} ApiResponse chứa AuthResponse
 */
export const registerApi = async (data) => {
  const response = await api.post('/artist/auth/register', data);
  return response.data;
};

/**
 * Làm mới Access Token của Nghệ sĩ
 * @param {string} refreshToken
 * @returns {Promise<Object>} ApiResponse chứa TokenRefreshResponse (accessToken, refreshToken)
 */
export const refreshTokenApi = async (refreshToken) => {
  const response = await api.post('/artist/auth/refresh', { refreshToken });
  return response.data;
};

/**
 * Đăng xuất tài khoản Nghệ sĩ (thu hồi refresh token ở backend)
 * @param {string} refreshToken
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const logoutApi = async (refreshToken) => {
  const response = await api.post('/artist/auth/logout', { refreshToken });
  return response.data;
};

export {
  loginApi as login,
  registerApi as register,
  logoutApi as logout,
  refreshTokenApi as refreshToken,
};
