import { toast } from "sonner";

/**
 * Hiển thị thông báo (toast) yêu cầu đăng nhập với thiết kế màu xanh đồng nhất kèm nút Đăng nhập.
 * @param {string} actionName - Hành động người dùng muốn thực hiện (VD: "thêm bài hát vào danh sách yêu thích")
 * @param {string} [redirectPath] - Đường dẫn muốn quay lại sau khi đăng nhập (tùy chọn)
 */
export const showLoginToast = (actionName, redirectPath) => {
  const currentPath = redirectPath || window.location.pathname;

  toast("Yêu cầu đăng nhập", {
    description: `Bạn cần đăng nhập để ${actionName}.`,
    action: {
      label: "Đăng nhập",
      onClick: () => {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      },
    },
    style: {
      background: "#2563eb", // blue-600
      color: "#ffffff",
      border: "none",
    },
    actionButtonStyle: {
      background: "#ffffff",
      color: "#1d4ed8",
      fontWeight: "bold",
      borderRadius: "9999px",
      padding: "6px 14px",
    },
  });
};
