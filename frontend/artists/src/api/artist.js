import api from '#/lib/axios';

/**
 * Lấy thông tin hồ sơ của Nghệ sĩ đang đăng nhập
 * @returns {Promise<Object>} ApiResponse chứa ArtistProfileResponse (id, email, stageName, biography, avatarUrl, coverUrl, followerCount)
 */
export const getArtistProfileApi = async () => {
  const response = await api.get('/artist/me');
  return response.data;
};

/**
 * Cập nhật hồ sơ Nghệ sĩ (hỗ trợ upload avatarFile, coverFile, stageName, biography qua multipart/form-data)
 * @param {FormData} formData
 * @returns {Promise<Object>} ApiResponse chứa ArtistProfileResponse
 */
export const updateArtistProfileApi = async (formData) => {
  const response = await api.put('/artist/me', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Lấy dữ liệu thống kê tổng quan của Nghệ sĩ (Dashboard)
 * @returns {Promise<Object>} ApiResponse chứa ArtistDashboardResponse (totalFollowers, totalSongs, totalPlays, totalLikes)
 */
export const getArtistDashboardApi = async () => {
  const response = await api.get('/artist/dashboard');
  return response.data;
};

export {
  getArtistProfileApi as getProfile,
  updateArtistProfileApi as updateProfile,
  getArtistDashboardApi as getDashboard,
};
