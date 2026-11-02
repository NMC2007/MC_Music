import { toast } from "sonner";

/**
 * Hiển thị thông báo (toast) tính năng đang xây dựng với thiết kế màu xanh đồng nhất (#2563eb) giống frontend/users.
 * Dùng cho các nút hành động như Sửa, Xóa bài hát/album khi backend chưa có API.
 * 
 * @param {string} [featureName="Tính năng này"] - Tên chức năng vừa click (VD: "Chỉnh sửa bài hát", "Xóa bài hát")
 */
export const notifyFeatureInDevelopment = (featureName = "Tính năng này") => {
  toast(`${featureName} đang được xây dựng`, {
    description: "Tính năng đang được phát triển và sẽ sớm ra mắt ở phiên bản tiếp theo.",
    style: {
      background: "#2563eb", // blue-600 đồng nhất với frontend/users
      color: "#ffffff",
      border: "none",
    },
  });
};

export default notifyFeatureInDevelopment;
