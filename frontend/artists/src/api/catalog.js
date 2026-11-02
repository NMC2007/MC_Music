import api from '#/lib/axios';

/**
 * ─── PHÂN HỆ QUẢN LÝ BÀI HÁT (SONGS) ─────────────────────────────────────────
 */

/**
 * Lấy danh sách bài hát do Nghệ sĩ hiện tại sở hữu
 * @param {Object} params - { page, size }
 * @returns {Promise<Object>} ApiResponse chứa Page<SongResponse>
 */
export const getMySongsApi = async (params = { page: 0, size: 10 }) => {
  const response = await api.get('/catalog/artist/songs', { params });
  return response.data;
};

/**
 * Đăng tải bài hát mới lên Catalog Service (upload file audio và ảnh cover lên Cloudinary)
 * @param {FormData} formData - Chứa title, audioFile, coverImage, albumId, explicit, genreIds...
 * @param {Function} [onUploadProgress] - Callback theo dõi tiến trình upload (0% - 100%)
 * @returns {Promise<Object>} ApiResponse chứa SongResponse
 */
export const uploadSongApi = async (formData, onUploadProgress) => {
  const response = await api.post('/catalog/artist/songs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

/**
 * Cập nhật lời bài hát cho một bài hát cụ thể
 * @param {string} songId - UUID bài hát
 * @param {Object} data - { content, language }
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const updateLyricsApi = async (songId, data) => {
  const response = await api.post(`/catalog/artist/songs/${songId}/lyrics`, data);
  return response.data;
};

/**
 * Thêm nghệ sĩ phụ (Feat / Producer) vào bài hát
 * @param {string} songId - UUID bài hát
 * @param {Object} data - { artistId, role }
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const addSongArtistApi = async (songId, data) => {
  const response = await api.post(`/catalog/artist/songs/${songId}/artists`, data);
  return response.data;
};

/**
 * ─── PHÂN HỆ QUẢN LÝ ALBUM (ALBUMS) ──────────────────────────────────────────
 */

/**
 * Lấy danh sách Album do Nghệ sĩ hiện tại sở hữu
 * @param {Object} params - { page, size }
 * @returns {Promise<Object>} ApiResponse chứa Page<AlbumResponse>
 */
export const getMyAlbumsApi = async (params = { page: 0, size: 10 }) => {
  const response = await api.get('/catalog/artist/albums', { params });
  return response.data;
};

/**
 * Tạo Album / EP / Single mới
 * @param {FormData} formData - Chứa title, albumType, description, coverImage, releaseDate
 * @returns {Promise<Object>} ApiResponse chứa AlbumResponse
 */
export const createAlbumApi = async (formData) => {
  const response = await api.post('/catalog/artist/albums', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Thêm một bài hát vào album
 * @param {string} albumId - UUID album
 * @param {Object} data - { songId, trackNumber }
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const addSongToAlbumApi = async (albumId, data) => {
  const response = await api.post(`/catalog/artist/albums/${albumId}/songs`, data);
  return response.data;
};

/**
 * Cập nhật lại thứ tự các bài hát trong album
 * @param {string} albumId - UUID album
 * @param {Object} data - { songOrders: [{ songId, trackNumber }] }
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const reorderSongsInAlbumApi = async (albumId, data) => {
  const response = await api.put(`/catalog/artist/albums/${albumId}/songs/reorder`, data);
  return response.data;
};

/**
 * ─── THỂ LOẠI & DỮ LIỆU CÔNG KHAI (GENRES & PUBLIC CATALOG) ──────────────────
 */

/**
 * Lấy danh sách toàn bộ các thể loại âm nhạc để chọn khi tải bài hát lên
 * @returns {Promise<Object>} ApiResponse chứa List<GenreResponse> (id, name, coverImage)
 */
export const getPublicGenresApi = async () => {
  const response = await api.get('/catalog/public/genres');
  return response.data;
};

/**
 * Lấy danh sách bài hát thuộc một Album
 * @param {string} albumId - UUID album
 * @param {Object} params - { page, size, sort }
 * @returns {Promise<Object>} ApiResponse chứa Page<SongResponse>
 */
export const getSongsByAlbumApi = async (albumId, params = { page: 0, size: 50 }) => {
  const response = await api.get(`/catalog/public/albums/${albumId}/songs`, { params });
  return response.data;
};

/**
 * Lấy chi tiết lời bài hát theo songId
 * @param {string} songId - UUID bài hát
 * @returns {Promise<Object>} ApiResponse chứa LyricsResponse (id, songId, content, language)
 */
export const getSongLyricsApi = async (songId) => {
  const response = await api.get(`/catalog/public/songs/${songId}/lyrics`);
  return response.data;
};

export {
  getMySongsApi as getSongs,
  uploadSongApi as uploadSong,
  updateLyricsApi as updateLyrics,
  addSongArtistApi as addFeaturedArtist,
  getMyAlbumsApi as getAlbums,
  createAlbumApi as createAlbum,
  addSongToAlbumApi as addSongToAlbum,
  reorderSongsInAlbumApi as reorderAlbumSongs,
  getPublicGenresApi as getGenres,
  getSongsByAlbumApi as getAlbumSongs,
  getSongLyricsApi as getLyrics,
};
