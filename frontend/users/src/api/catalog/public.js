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

/**
 * Lấy thông tin chi tiết một bài hát theo ID
 * @param {String} id 
 */
export const getSongById = async (id) => {
  const response = await api.get(`/catalog/public/songs/${id}`);
  return response.data;
};

/**
 * Lấy lời bài hát theo ID bài hát
 * @param {String} songId 
 * @returns {Promise<Object>} ApiResponse chứa LyricsResponse (id, content, language)
 */
export const getSongLyrics = async (songId) => {
  const response = await api.get(`/catalog/public/songs/${songId}/lyrics`);
  return response.data;
};

/**
 * Lấy thông tin chi tiết một album theo ID
 * @param {String} id 
 */
export const getAlbumById = async (id) => {
  const response = await api.get(`/catalog/public/albums/${id}`);
  return response.data;
};

