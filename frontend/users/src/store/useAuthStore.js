import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      /**
       * Đăng nhập: hỗ trợ cả 2 cách truyền tham số:
       * 1. login(user, accessToken, refreshToken)
       * 2. login(authResponseData) -> { userId, email, fullName, accessToken, refreshToken }
       */
      login: (userOrData, accessToken, refreshToken) => {
        if (typeof userOrData === 'object' && userOrData !== null && 'accessToken' in userOrData) {
          const { accessToken: at, refreshToken: rt, user: u, ...rest } = userOrData;
          const userObj = u || {
            userId: rest.userId,
            email: rest.email,
            fullName: rest.fullName,
          };
          set({
            user: userObj,
            accessToken: at,
            refreshToken: rt || null,
            isAuthenticated: true,
          });
        } else {
          set({
            user: userOrData,
            accessToken: accessToken,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
          });
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mc-music-login'));
        }
      },

      /**
       * Cập nhật access token và refresh token (sau khi refresh token thành công)
       */
      setTokens: (accessToken, refreshToken) => set((state) => ({
        accessToken,
        refreshToken: refreshToken || state.refreshToken,
        isAuthenticated: !!accessToken,
      })),

      /**
       * Cập nhật thông tin user (ví dụ sau khi fetch /api/user/me hoặc đổi avatar/tên)
       */
      setUser: (user) => set({ user }),
      
      /**
       * Đăng xuất: xóa toàn bộ dữ liệu xác thực và trạng thái phát nhạc
       */
      logout: () => {
        try {
          localStorage.removeItem('mc-music-player');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mc-music-logout'));
          }
        } catch (e) {
          console.error(e);
        }
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null,
          isAuthenticated: false 
        });
      },
    }),
    {
      name: 'mc-music-auth', // Tên key lưu trong localStorage
    }
  )
);
