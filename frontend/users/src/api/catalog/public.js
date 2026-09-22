import api from '#/lib/axios';

/**
 * Lấy danh sách bài hát công khai
 * @param {Object} params - { keyword, genreId, page, size }
 */
export const getPublicSongs = async (params = {}) => {
  const response = await api.get('/catalog/public/songs', { params });
  return response.data;
};

/**
 * Lấy danh sách tất cả thể loại
 */
export const getPublicGenres = async () => {
  const response = await api.get('/catalog/public/genres');
  return response.data;
};

/**
 * Lấy danh sách album công khai
 * @param {Object} params - { page, size }
 */
export const getPublicAlbums = async (params = {}) => {
  const response = await api.get('/catalog/public/albums', { params });
  return response.data;
};

/**
 * Lấy danh sách bài hát của một nghệ sĩ
 * @param {String} artistId 
 * @param {Object} params - { page, size }
 */
export const getArtistSongs = async (artistId, params = {}) => {
  const response = await api.get(`/catalog/public/artists/${artistId}/songs`, { params });
  return response.data;
};

/**
 * Lấy danh sách album của một nghệ sĩ
 * @param {String} artistId 
 * @param {Object} params - { page, size }
 */
export const getArtistAlbums = async (artistId, params = {}) => {
  const response = await api.get(`/catalog/public/artists/${artistId}/albums`, { params });
  return response.data;
};

/**
 * Lấy danh sách bài hát trong một album
 * @param {String} albumId 
 * @param {Object} params - { page, size }
 */
export const getAlbumSongs = async (albumId, params = {}) => {
  const response = await api.get(`/catalog/public/albums/${albumId}/songs`, { params });
  return response.data;
};
