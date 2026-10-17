import api from '#/lib/axios';

/**
 * Đăng nhập người dùng
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} ApiResponse chứa AuthResponse (userId, email, fullName, accessToken, refreshToken)
 */
export const loginApi = async (credentials) => {
  const response = await api.post('/user/auth/login', credentials);
  return response.data;
};

/**
 * Đăng ký tài khoản người dùng mới
 * @param {Object} data - { email, password, fullName }
 * @returns {Promise<Object>} ApiResponse chứa AuthResponse
 */
export const registerApi = async (data) => {
  const response = await api.post('/user/auth/register', data);
  return response.data;
};

/**
 * Làm mới Access Token bằng Refresh Token
 * @param {string} refreshToken
 * @returns {Promise<Object>} ApiResponse chứa TokenRefreshResponse (accessToken, refreshToken)
 */
export const refreshTokenApi = async (refreshToken) => {
  const response = await api.post('/user/auth/refresh', { refreshToken });
  return response.data;
};

/**
 * Đăng xuất tài khoản người dùng (hủy refresh token ở backend)
 * @param {string} refreshToken
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const logoutApi = async (refreshToken) => {
  const response = await api.post('/user/auth/logout', { refreshToken });
  return response.data;
};

/**
 * Lấy thông tin chi tiết của người dùng đang đăng nhập
 * @returns {Promise<Object>} ApiResponse chứa UserProfileResponse
 */
export const getCurrentUserApi = async () => {
  const response = await api.get('/user/me');
  return response.data;
};

/**
 * Cập nhật thông tin profile người dùng
 * @param {FormData} formData - form data chứa fullName và avatarFile (nếu có)
 * @returns {Promise<Object>} ApiResponse chứa UserProfileResponse
 */
export const updateProfileApi = async (formData) => {
  const response = await api.put('/user/me', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Export alias để linh hoạt trong việc import
export {
  loginApi as login,
  registerApi as register,
  logoutApi as logout,
  refreshTokenApi as refreshToken,
  getCurrentUserApi as getCurrentUser,
  updateProfileApi as updateProfile,
};
