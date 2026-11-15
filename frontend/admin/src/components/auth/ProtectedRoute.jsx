import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../store/useAuthStore";

/**
 * ProtectedRoute: Kiểm tra quyền xác thực Quản trị viên (Admin)
 * - Nếu chưa đăng nhập: Lưu lại trang đang truy cập và điều hướng về /login
 * - Nếu đã đăng nhập: Cho phép truy cập và render các route con thông qua <Outlet />
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

