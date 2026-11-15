import api from "../lib/axios";

/**
 * Lấy danh sách người dùng hệ thống (User)
 * @param {Object} params - { page = 0, size = 10, sort }
 */
export const getUsersApi = async (params = {}) => {
  const { page = 0, size = 10, sort } = params;
  const response = await api.get("/admin/users", {
    params: { page, size, sort },
  });
  return response.data;
};

/**
 * Lấy thông tin chi tiết người dùng
 * @param {string} id - UUID người dùng
 */
export const getUserByIdApi = async (id) => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
};

/**
 * Khóa hoặc Mở khóa tài khoản người dùng
 * @param {string} id - UUID người dùng
 * @param {boolean} isActive - true: mở khóa, false: khóa
 */
export const updateUserStatusApi = async (id, isActive) => {
  const response = await api.patch(`/admin/users/${id}/status`, { isActive });
  return response.data;
};

