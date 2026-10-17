import api from '#/lib/axios';

/**
 * Ghi nhận lượt nghe và lịch sử nghe nhạc của người dùng
 * Endpoint: POST /api/user/history
 * Backend tự động tăng playCount của bài hát tương ứng.
 * 
 * @param {Object} data - { songId: string, durationListened: number }
 * @returns {Promise<Object>} ApiResponse<Void>
 */
export const addPlayHistoryApi = async (data) => {
  const response = await api.post('/user/history', data);
  return response.data;
};

/**
 * Lấy danh sách lịch sử nghe nhạc của người dùng
 * Endpoint: GET /api/user/history?page=0&size=5
 * 
 * @param {Object} params - { page: number, size: number }
 * @returns {Promise<Object>} ApiResponse<Page<PlayHistoryResponse>>
 */
export const getUserPlayHistoryApi = async (params = { page: 0, size: 5 }) => {
  const response = await api.get('/user/history', { params });
  return response.data;
};
