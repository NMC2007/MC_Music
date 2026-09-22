import api from '#/lib/axios';

/**
 * Lấy danh sách tất cả nghệ sĩ đang hoạt động
 * @param {Object} params - { page, size }
 */
export const getPublicArtists = async (params = {}) => {
  const response = await api.get('/artist/public/artists', { params });
  return response.data;
};
