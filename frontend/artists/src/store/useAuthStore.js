import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '../lib/queryClient';

export const useAuthStore = create(
  persist(
    (set) => ({
      artist: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false, // Cờ kiểm tra đã hoàn thành hoặc bỏ qua cửa sổ Onboarding avatar/cover

      /**
       * Đăng nhập tài khoản Nghệ sĩ: hỗ trợ cả 2 cách truyền tham số:
       * 1. login(artist, accessToken, refreshToken)
       * 2. login(authResponseData) -> { artistId, email, stageName, accessToken, refreshToken }
       */
      login: (artistOrData, accessToken, refreshToken) => {
        try {
          queryClient.clear(); // Xóa sạch cache truy vấn của phiên trước
        } catch (e) {
          console.error("Lỗi khi xóa queryClient cache:", e);
        }

        if (typeof artistOrData === 'object' && artistOrData !== null && 'accessToken' in artistOrData) {
          const { accessToken: at, refreshToken: rt, artist: a, ...rest } = artistOrData;
          const artistObj = a || {
            id: rest.artistId || rest.id,
            artistId: rest.artistId || rest.id,
            email: rest.email,
            stageName: rest.stageName,
            avatarUrl: rest.avatarUrl || null,
            coverUrl: rest.coverUrl || null,
            biography: rest.biography || null,
          };

          set({
            artist: artistObj,
            accessToken: at,
            refreshToken: rt || null,
            isAuthenticated: true,
          });
        } else {
          set({
            artist: artistOrData,
            accessToken: accessToken,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
          });
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mc-artist-login'));
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
       * Cập nhật thông tin nghệ sĩ (sau khi gọi /api/artist/me hoặc cập nhật profile)
       */
      setArtist: (artist) =>
        set((state) => ({
          artist: typeof artist === 'function' ? artist(state.artist) : { ...state.artist, ...artist },
        })),

      /**
       * Đánh dấu đã xem hoặc bỏ qua Onboarding thiết lập ảnh đại diện / ảnh bìa
       */
      setOnboardingDismissed: () => set({ hasCompletedOnboarding: true }),

      /**
       * Đăng xuất tài khoản Nghệ sĩ: xóa sạch thông tin xác thực và cache dữ liệu
       */
      logout: () => {
        try {
          queryClient.clear();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mc-artist-logout'));
          }
        } catch (e) {
          console.error("Lỗi khi đăng xuất:", e);
        }

        set({
          artist: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
        });
      },
    }),
    {
      name: 'mc-artist-auth', // Phân tách key lưu trong localStorage của domain Artist
    }
  )
);
