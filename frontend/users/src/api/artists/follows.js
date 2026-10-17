import api from '#/lib/axios';

/**
 * Theo dõi một nghệ sĩ
 * @param {string} artistId - UUID của nghệ sĩ
 */
export const followArtistApi = async (artistId) => {
  const response = await api.post(`/user/follows/artists/${artistId}`);
  return response.data;
};

/**
 * Hủy theo dõi một nghệ sĩ
 * @param {string} artistId - UUID của nghệ sĩ
 */
export const unfollowArtistApi = async (artistId) => {
  const response = await api.delete(`/user/follows/artists/${artistId}`);
  return response.data;
};

/**
 * Lấy danh sách nghệ sĩ mà người dùng đang theo dõi
 * @param {Object} params - { page, size }
 */
export const getUserFollowedArtistsApi = async (params = {}) => {
  const response = await api.get('/user/follows/artists', { params });
  return response.data;
};
