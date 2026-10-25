import api from '#/lib/axios';

/**
 * Tạo mới danh sách phát (Playlist) cho người dùng
 * Endpoint: POST /api/user/playlists
 * 
 * @param {FormData|Object} data - FormData hoặc { name: string, description?: string, coverFile?: File, coverImage?: File, isPublic?: boolean }
 * @returns {Promise<Object>} ApiResponse<PlaylistResponse>
 */
export const createPlaylistApi = async (data) => {
  let payload = data;
  if (!(data instanceof FormData)) {
    payload = new FormData();
    if (data.name) payload.append('name', data.name);
    if (data.description) payload.append('description', data.description);
    if (data.isPublic !== undefined) payload.append('isPublic', data.isPublic);
    if (data.coverFile) payload.append('coverFile', data.coverFile);
    else if (data.coverImage) payload.append('coverImage', data.coverImage);
  }
  const response = await api.post('/user/playlists', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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

/**
 * Lấy chi tiết thông tin một Playlist
 * Endpoint: GET /api/user/playlists/{playlistId}
 * 
 * @param {string} playlistId - UUID của Playlist
 * @returns {Promise<Object>} ApiResponse<PlaylistResponse>
 */
export const getPlaylistByIdApi = async (playlistId) => {
  const response = await api.get(`/user/playlists/${playlistId}`);
  return response.data;
};

/**
 * Cập nhật thông tin Playlist (tên, mô tả, ảnh bìa, công khai)
 * Endpoint: PUT /api/user/playlists/{playlistId}
 * 
 * @param {string} playlistId - UUID của Playlist
 * @param {FormData|Object} data - FormData hoặc { name?: string, description?: string, coverFile?: File, coverImage?: File|string, isPublic?: boolean }
 * @returns {Promise<Object>} ApiResponse<PlaylistResponse>
 */
export const updatePlaylistApi = async (playlistId, data) => {
  let payload = data;
  if (!(data instanceof FormData)) {
    payload = new FormData();
    if (data.name !== undefined && data.name !== null) payload.append('name', data.name);
    if (data.description !== undefined && data.description !== null) payload.append('description', data.description);
    if (data.isPublic !== undefined && data.isPublic !== null) payload.append('isPublic', data.isPublic);
    if (data.coverFile) payload.append('coverFile', data.coverFile);
    else if (data.coverImage instanceof File) payload.append('coverImage', data.coverImage);
  }
  const response = await api.put(`/user/playlists/${playlistId}`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Xóa một Playlist
 * Endpoint: DELETE /api/user/playlists/{playlistId}
 * 
 * @param {string} playlistId - UUID của Playlist
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const deletePlaylistApi = async (playlistId) => {
  const response = await api.delete(`/user/playlists/${playlistId}`);
  return response.data;
};

