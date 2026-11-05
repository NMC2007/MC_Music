import api from '#/lib/axios';

/**
 * ─── PHÂN HỆ QUẢN LÝ BÀI HÁT (SONGS) ─────────────────────────────────────────
 */

/**
 * Lấy danh sách bài hát do Nghệ sĩ hiện tại sở hữu (hỗ trợ lọc status, isDeleted, keyword)
 * @param {Object} params - { page, size, status, isDeleted, keyword }
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
 * @returns {Promise<Object>} ApiResponse chứa SongResponse (status: PENDING)
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
 * Chỉnh sửa bài hát (tên, cover, thể loại, đổi/gỡ album, explicit)
 * Lưu ý: Trạng thái bài hát sau khi sửa sẽ tự động chuyển về PENDING để Admin duyệt lại.
 * @param {string} songId - UUID bài hát
 * @param {FormData} formData - Chứa title, coverImage (tùy chọn), genreIds, albumId, clearAlbum, explicit...
 * @returns {Promise<Object>} ApiResponse chứa SongResponse
 */
export const updateSongApi = async (songId, formData) => {
  const response = await api.put(`/catalog/artist/songs/${songId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Xóa mềm bài hát (chuyển vào thùng rác is_deleted = true)
 * Không xóa file trên Cloudinary; tự động giảm total_tracks của album nếu thuộc album.
 * @param {string} songId - UUID bài hát
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const deleteSongApi = async (songId) => {
  const response = await api.delete(`/catalog/artist/songs/${songId}`);
  return response.data;
};

/**
 * Khôi phục bài hát từ thùng rác (is_deleted = false)
 * Giữ nguyên trạng thái status trước khi xóa; tự động tăng lại total_tracks của album tương ứng.
 * @param {string} songId - UUID bài hát
 * @returns {Promise<Object>} ApiResponse chứa SongResponse
 */
export const restoreSongApi = async (songId) => {
  const response = await api.put(`/catalog/artist/songs/${songId}/restore`);
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
 * @param {Object} data - { artistId, role } (role: FEATURED | PRODUCER)
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const addSongArtistApi = async (songId, data) => {
  const response = await api.post(`/catalog/artist/songs/${songId}/artists`, data);
  return response.data;
};

/**
 * Gỡ nghệ sĩ phụ (Feat / Producer) khỏi bài hát
 * @param {string} songId - UUID bài hát
 * @param {string} artistId - UUID nghệ sĩ phụ cần gỡ
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const removeSongArtistApi = async (songId, artistId) => {
  const response = await api.delete(`/catalog/artist/songs/${songId}/artists/${artistId}`);
  return response.data;
};

/**
 * ─── PHÂN HỆ QUẢN LÝ ALBUM (ALBUMS) ──────────────────────────────────────────
 */

/**
 * Lấy danh sách Album do Nghệ sĩ hiện tại sở hữu (hỗ trợ lọc isDeleted: false/true)
 * @param {Object} params - { page, size, isDeleted }
 * @returns {Promise<Object>} ApiResponse chứa Page<AlbumResponse>
 */
export const getMyAlbumsApi = async (params = { page: 0, size: 10 }) => {
  const response = await api.get('/catalog/artist/albums', { params });
  return response.data;
};

/**
 * Tạo Album / EP / Single mới (upload ảnh cover lên Cloudinary)
 * Trạng thái mặc định ban đầu là PENDING.
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
 * Chỉnh sửa thông tin Album (tên, mô tả, phân loại, ngày phát hành, ảnh bìa mới)
 * Lưu ý: Trạng thái album sau khi sửa sẽ tự động chuyển về PENDING để Admin duyệt lại.
 * @param {string} albumId - UUID album
 * @param {FormData} formData - Chứa title, description, albumType, releaseDate, coverImage (tùy chọn)
 * @returns {Promise<Object>} ApiResponse chứa AlbumResponse
 */
export const updateAlbumApi = async (albumId, formData) => {
  const response = await api.put(`/catalog/artist/albums/${albumId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Xóa mềm Album (chuyển vào thùng rác is_deleted = true)
 * Cascade: Tự động xóa mềm toàn bộ bài hát thuộc album này.
 * @param {string} albumId - UUID album
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const deleteAlbumApi = async (albumId) => {
  const response = await api.delete(`/catalog/artist/albums/${albumId}`);
  return response.data;
};

/**
 * Khôi phục Album từ thùng rác (is_deleted = false)
 * Cascade: Tự động khôi phục toàn bộ bài hát thuộc album này.
 * @param {string} albumId - UUID album
 * @returns {Promise<Object>} ApiResponse chứa AlbumResponse
 */
export const restoreAlbumApi = async (albumId) => {
  const response = await api.put(`/catalog/artist/albums/${albumId}/restore`);
  return response.data;
};

/**
 * Thêm một bài hát đã đăng tải vào album
 * @param {string} albumId - UUID album
 * @param {Object} data - { songId, trackNumber } (nếu không truyền trackNumber, hệ thống tự đánh số tiếp theo)
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const addSongToAlbumApi = async (albumId, data) => {
  const response = await api.post(`/catalog/artist/albums/${albumId}/songs`, data);
  return response.data;
};

/**
 * Gỡ một bài hát khỏi album (chuyển thành bài lẻ Single, tự giảm total_tracks của album)
 * @param {string} albumId - UUID album
 * @param {string} songId - UUID bài hát cần gỡ
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const removeSongFromAlbumApi = async (albumId, songId) => {
  const response = await api.delete(`/catalog/artist/albums/${albumId}/songs/${songId}`);
  return response.data;
};

/**
 * Cập nhật lại số thứ tự (trackNumber) của các bài hát trong album
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
 * Lấy danh sách toàn bộ các thể loại âm nhạc để chọn khi tải/sửa bài hát
 * @returns {Promise<Object>} ApiResponse chứa List<GenreResponse> (id, name, coverImage)
 */
export const getPublicGenresApi = async () => {
  const response = await api.get('/catalog/public/genres');
  return response.data;
};

/**
 * Lấy chi tiết thông tin một Album công khai theo ID
 * @param {string} albumId - UUID album
 * @returns {Promise<Object>} ApiResponse chứa AlbumResponse
 */
export const getPublicAlbumByIdApi = async (albumId) => {
  const response = await api.get(`/catalog/public/albums/${albumId}`);
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
 * Lấy chi tiết một bài hát theo ID
 * @param {string} songId - UUID bài hát
 * @returns {Promise<Object>} ApiResponse chứa SongResponse
 */
export const getPublicSongByIdApi = async (songId) => {
  const response = await api.get(`/catalog/public/songs/${songId}`);
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
  updateSongApi as updateSong,
  deleteSongApi as deleteSong,
  restoreSongApi as restoreSong,
  updateLyricsApi as updateLyrics,
  addSongArtistApi as addFeaturedArtist,
  removeSongArtistApi as removeFeaturedArtist,
  getMyAlbumsApi as getAlbums,
  createAlbumApi as createAlbum,
  updateAlbumApi as updateAlbum,
  deleteAlbumApi as deleteAlbum,
  restoreAlbumApi as restoreAlbum,
  addSongToAlbumApi as addSongToAlbum,
  removeSongFromAlbumApi as removeSongFromAlbum,
  reorderSongsInAlbumApi as reorderAlbumSongs,
  getPublicGenresApi as getGenres,
  getPublicAlbumByIdApi as getAlbumById,
  getSongsByAlbumApi as getAlbumSongs,
  getPublicSongByIdApi as getSongById,
  getSongLyricsApi as getLyrics,
};
