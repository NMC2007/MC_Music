import api from "../lib/axios";

/**
 * Lấy danh sách nghệ sĩ hệ thống (Artist)
 * @param {Object} params - { page = 0, size = 10, sort }
 */
export const getArtistsApi = async (params = {}) => {
  const { page = 0, size = 10, sort } = params;
  const response = await api.get("/admin/artists", {
    params: { page, size, sort },
  });
  return response.data;
};

/**
 * Lấy thông tin chi tiết nghệ sĩ
 * @param {string} id - UUID nghệ sĩ
 */
export const getArtistByIdApi = async (id) => {
  const response = await api.get(`/admin/artists/${id}`);
  return response.data;
};

/**
 * Khóa hoặc Mở khóa tài khoản nghệ sĩ
 * @param {string} id - UUID nghệ sĩ
 * @param {boolean} isActive - true: mở khóa, false: khóa
 */
export const updateArtistStatusApi = async (id, isActive) => {
  const response = await api.patch(`/admin/artists/${id}/status`, { isActive });
  return response.data;
};

