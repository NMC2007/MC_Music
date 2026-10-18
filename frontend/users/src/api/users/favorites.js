import api from '#/lib/axios';

/**
 * Thêm bài hát vào danh sách yêu thích của người dùng
 * Endpoint: POST /api/user/favorites/{songId}
 * 
 * @param {string} songId - UUID bài hát
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const addFavoriteSongApi = async (songId) => {
  const response = await api.post(`/user/favorites/${songId}`);
  return response.data;
};

/**
 * Xóa bài hát khỏi danh sách yêu thích của người dùng
 * Endpoint: DELETE /api/user/favorites/{songId}
 * 
 * @param {string} songId - UUID bài hát
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const removeFavoriteSongApi = async (songId) => {
  const response = await api.delete(`/user/favorites/${songId}`);
  return response.data;
};

/**
 * Lấy danh sách bài hát yêu thích của người dùng (phân trang)
 * Endpoint: GET /api/user/favorites?page=0&size=50
 * 
 * @param {Object} params - { page: number, size: number }
 * @returns {Promise<Object>} ApiResponse<Page<FavoriteResponse>>
 */
export const getUserFavoritesApi = async (params = { page: 0, size: 50 }) => {
  const response = await api.get('/user/favorites', { params });
  return response.data;
};

/**
 * Thêm album vào danh sách yêu thích của người dùng
 * Endpoint: POST /api/user/favorites/albums/{albumId}
 * 
 * @param {string} albumId - UUID album
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const addFavoriteAlbumApi = async (albumId) => {
  const response = await api.post(`/user/favorites/albums/${albumId}`);
  return response.data;
};

/**
 * Xóa album khỏi danh sách yêu thích của người dùng
 * Endpoint: DELETE /api/user/favorites/albums/{albumId}
 * 
 * @param {string} albumId - UUID album
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const removeFavoriteAlbumApi = async (albumId) => {
  const response = await api.delete(`/user/favorites/albums/${albumId}`);
  return response.data;
};

/**
 * Lấy danh sách album yêu thích của người dùng (phân trang)
 * Endpoint: GET /api/user/favorites/albums?page=0&size=50
 * 
 * @param {Object} params - { page: number, size: number }
 * @returns {Promise<Object>} ApiResponse<Page<FavoriteAlbumResponse>>
 */
export const getUserFavoriteAlbumsApi = async (params = { page: 0, size: 50 }) => {
  const response = await api.get('/user/favorites/albums', { params });
  return response.data;
};
