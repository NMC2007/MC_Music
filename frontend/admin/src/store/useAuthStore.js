import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '../lib/queryClient';

export const useAuthStore = create(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      /**
       * Đăng nhập tài khoản Quản trị viên (Admin / Super Admin):
       * Hỗ trợ 2 định dạng truyền tham số:
       * 1. login(adminUser, accessToken, refreshToken)
       * 2. login(authResponseData) -> { admin, accessToken, refreshToken } hoặc { id, email, fullName, role, accessToken, refreshToken }
       */
      login: (adminOrData, accessToken, refreshToken) => {
        try {
          queryClient.clear(); // Xóa sạch cache truy vấn của phiên trước
        } catch (e) {
          console.error("Lỗi khi xóa queryClient cache:", e);
        }

        if (typeof adminOrData === 'object' && adminOrData !== null && 'accessToken' in adminOrData) {
          const { accessToken: at, refreshToken: rt, admin: a, user: u, ...rest } = adminOrData;
          const adminObj = a || u || {
            id: rest.id || rest.adminId,
            email: rest.email,
            fullName: rest.fullName || rest.name,
            role: rest.role || 'ADMIN',
          };

          set({
            admin: adminObj,
            accessToken: at,
            refreshToken: rt || null,
            isAuthenticated: true,
          });
        } else {
          set({
            admin: adminOrData,
            accessToken: accessToken,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
          });
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mc-admin-login'));
        }
      },

      /**
       * Cập nhật Access Token và Refresh Token sau khi làm mới token thành công
       */
      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken || state.refreshToken,
          isAuthenticated: !!accessToken,
        })),

      /**
       * Cập nhật thông tin Quản trị viên
       */
      setAdmin: (admin) =>
        set((state) => ({
          admin: typeof admin === 'function' ? admin(state.admin) : { ...state.admin, ...admin },
        })),

      /**
       * Đăng xuất tài khoản Quản trị viên: xóa sạch thông tin xác thực và cache truy vấn
       */
      logout: () => {
        try {
          queryClient.clear();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mc-admin-logout'));
          }
        } catch (e) {
          console.error("Lỗi khi đăng xuất:", e);
        }

        set({
          admin: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'mc-music-admin-auth', // Tách biệt key lưu trữ trong localStorage của domain Admin
      partialize: (state) => ({
        admin: state.admin,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;

