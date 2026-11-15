import api from "../lib/axios";

/**
 * Lấy danh sách bài hát đang chờ kiểm duyệt (status = PENDING)
 * @param {Object} params - { page = 0, size = 10, sort = "createdAt,desc" }
 */
export const getPendingSongsApi = async (params = {}) => {
  const { page = 0, size = 10, sort = "createdAt,desc" } = params;
  const response = await api.get("/catalog/admin/songs/pending", {
    params: { page, size, sort },
  });
  return response.data;
};

/**
 * Cập nhật trạng thái bài hát (Duyệt, Từ chối, Gỡ bỏ)
 * @param {string} songId - UUID của bài hát
 * @param {Object} payload - { status: "APPROVED" | "REJECTED" | "TAKEDOWN", rejectionReason?: string }
 */
export const updateSongStatusApi = async (songId, payload) => {
  const response = await api.patch(`/catalog/admin/songs/${songId}/status`, payload);
  return response.data;
};

/**
 * Lấy danh sách Album đang chờ kiểm duyệt (status = PENDING)
 * @param {Object} params - { page = 0, size = 10, sort = "createdAt,desc" }
 */
export const getPendingAlbumsApi = async (params = {}) => {
  const { page = 0, size = 10, sort = "createdAt,desc" } = params;
  const response = await api.get("/catalog/admin/albums/pending", {
    params: { page, size, sort },
  });
  return response.data;
};

/**
 * Lấy lời bài hát (Lyrics) phục vụ thẩm định ca từ
 * Ưu tiên gọi Admin endpoint để đọc được cả ca từ của bài hát PENDING
 * @param {string} songId - UUID của bài hát
 */
export const getSongLyricsApi = async (songId) => {
  try {
    const response = await api.get(`/catalog/admin/songs/${songId}/lyrics`);
    return response.data;
  } catch {
    try {
      const fallbackRes = await api.get(`/catalog/public/songs/${songId}/lyrics`);
      return fallbackRes.data;
    } catch {
      return { data: null };
    }
  }
};

/**
 * Lấy danh sách bài hát thuộc một Album
 * Ưu tiên gọi Admin endpoint để tải được các track PENDING trong album đang duyệt
 * @param {string} albumId - UUID album
 * @param {Object} params - { page = 0, size = 50 }
 */
export const getSongsByAlbumApi = async (albumId, params = { page: 0, size: 50 }) => {
  try {
    const response = await api.get(`/catalog/admin/albums/${albumId}/songs`);
    return response.data;
  } catch {
    const fallbackRes = await api.get(`/catalog/public/albums/${albumId}/songs`, { params });
    return fallbackRes.data;
  }
};

/**
 * Cập nhật trạng thái album (Duyệt, Từ chối, Gỡ bỏ)
 * @param {string} albumId - UUID của album
 * @param {Object} payload - { status: "APPROVED" | "REJECTED" | "TAKEDOWN", rejectionReason?: string }
 */
export const updateAlbumStatusApi = async (albumId, payload) => {
  const response = await api.patch(`/catalog/admin/albums/${albumId}/status`, payload);
  return response.data;
};

