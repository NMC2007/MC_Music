import { toast } from "sonner";

/**
 * Hiển thị thông báo (toast) yêu cầu đăng nhập với thiết kế màu xanh đồng nhất.
 * @param {string} actionName - Hành động người dùng muốn thực hiện (VD: "tạo danh sách phát mới")
 */
export const showLoginToast = (actionName) => {
  toast("Vui lòng đăng nhập để sử dụng tính năng này!", {
    description: `Bạn cần đăng nhập để ${actionName}.`,
    style: {
      background: "#2563eb", // blue-600
      color: "#ffffff",
      border: "none",
    },
  });
};
