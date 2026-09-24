import api from '#/lib/axios';

/**
 * Lấy danh sách tất cả nghệ sĩ đang hoạt động
 * @param {Object} params - { page, size, sort }
 */
export const getPublicArtists = async (params = {}) => {
  const response = await api.get('/artist/public/artists', { params });
  return response.data;
};

/**
 * Lấy thông tin chi tiết (profile) của một nghệ sĩ theo ID
 * @param {String} artistId - UUID của nghệ sĩ
 */
export const getArtistDetail = async (artistId) => {
  const response = await api.get(`/artist/public/artists/${artistId}`);
  return response.data;
};
