import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "#/store/useAuthStore";

/**
 * ProtectedRoute: Kiểm tra trạng thái xác thực của Nghệ sĩ
 * - Nếu chưa đăng nhập: Lưu lại trang hiện tại và chuyển hướng về /login
 * - Nếu đã đăng nhập: Render các route con thông qua <Outlet />
 */
export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
