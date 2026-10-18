import api from '#/lib/axios';

/**
 * Tạo mới danh sách phát (Playlist) cho người dùng
 * Endpoint: POST /api/user/playlists
 * 
 * @param {Object} data - { name: string, description?: string, coverImage?: string, isPublic?: boolean }
 * @returns {Promise<Object>} ApiResponse<PlaylistResponse>
 */
export const createPlaylistApi = async (data) => {
  const response = await api.post('/user/playlists', data);
  return response.data;
};

/**
 * Lấy danh sách các Playlist do người dùng hiện tại tạo (có phân trang)
 * Endpoint: GET /api/user/playlists?page=0&size=50
 * 
 * @param {Object} params - { page?: number, size?: number }
 * @returns {Promise<Object>} ApiResponse<Page<PlaylistResponse>>
 */
export const getUserPlaylistsApi = async (params = {}) => {
  const response = await api.get('/user/playlists', { params });
  return response.data;
};

/**
 * Thêm một bài hát vào Playlist
 * Endpoint: POST /api/user/playlists/{playlistId}/songs
 * 
 * @param {string} playlistId - UUID của Playlist
 * @param {string} songId - UUID của Bài hát
 * @returns {Promise<Object>} ApiResponse<PlaylistSongResponse>
 */
export const addSongToPlaylistApi = async (playlistId, songId) => {
  const response = await api.post(`/user/playlists/${playlistId}/songs`, { songId });
  return response.data;
};

/**
 * Gỡ bỏ một bài hát khỏi Playlist
 * Endpoint: DELETE /api/user/playlists/{playlistId}/songs/{songId}
 * 
 * @param {string} playlistId - UUID của Playlist
 * @param {string} songId - UUID của Bài hát
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const removeSongFromPlaylistApi = async (playlistId, songId) => {
  const response = await api.delete(`/user/playlists/${playlistId}/songs/${songId}`);
  return response.data;
};

/**
 * Lấy danh sách bài hát bên trong một Playlist
 * Endpoint: GET /api/user/playlists/{playlistId}/songs?page=0&size=50
 * 
 * @param {string} playlistId - UUID của Playlist
 * @param {Object} params - { page?: number, size?: number }
 * @returns {Promise<Object>} ApiResponse<Page<PlaylistSongResponse>>
 */
export const getPlaylistSongsApi = async (playlistId, params = {}) => {
  const response = await api.get(`/user/playlists/${playlistId}/songs`, { params });
  return response.data;
};
