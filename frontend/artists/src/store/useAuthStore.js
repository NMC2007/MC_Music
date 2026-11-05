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
      hasCompletedOnboarding: true, // Mặc định true để không tự động bật cho tài khoản đã có
      pendingNewAccountOnboarding: false, // Chỉ bật khi vừa đăng ký tài khoản mới thành công
      dismissedOnboardingArtistIds: [], // Danh sách artistId đã hoàn tất hoặc bỏ qua onboarding

      /**
       * Đăng nhập tài khoản Nghệ sĩ: hỗ trợ cả 2 cách truyền tham số:
       * 1. login(artist, accessToken, refreshToken, options)
       * 2. login(authResponseData, null, null, options) -> { artistId, email, stageName, accessToken, refreshToken }
       */
      login: (artistOrData, accessToken, refreshToken, options = {}) => {
        try {
          queryClient.clear(); // Xóa sạch cache truy vấn của phiên trước
        } catch (e) {
          console.error("Lỗi khi xóa queryClient cache:", e);
        }

        const isNewAccount = Boolean(options?.isNewAccount);

        if (typeof artistOrData === 'object' && artistOrData !== null && 'accessToken' in artistOrData) {
          const { accessToken: at, refreshToken: rt, artist: a, ...rest } = artistOrData;
          const artistId = rest.artistId || rest.id || a?.id || a?.artistId;
          const artistObj = a || {
            id: artistId,
            artistId: artistId,
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
            pendingNewAccountOnboarding: isNewAccount,
            hasCompletedOnboarding: !isNewAccount,
          });
        } else {
          set({
            artist: artistOrData,
            accessToken: accessToken,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            pendingNewAccountOnboarding: isNewAccount,
            hasCompletedOnboarding: !isNewAccount,
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
      setOnboardingDismissed: (artistId) =>
        set((state) => {
          const id = artistId || state.artist?.id || state.artist?.artistId;
          const currentList = state.dismissedOnboardingArtistIds || [];
          const updated = id && !currentList.includes(id) ? [...currentList, id] : currentList;
          return {
            pendingNewAccountOnboarding: false,
            dismissedOnboardingArtistIds: updated,
            hasCompletedOnboarding: true,
          };
        }),

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

        set((state) => ({
          artist: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          pendingNewAccountOnboarding: false,
          dismissedOnboardingArtistIds: state.dismissedOnboardingArtistIds || [],
          hasCompletedOnboarding: true,
        }));
      },
    }),
    {
      name: 'mc-artist-auth', // Phân tách key lưu trong localStorage của domain Artist
      partialize: (state) => ({
        artist: state.artist,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        pendingNewAccountOnboarding: state.pendingNewAccountOnboarding,
        dismissedOnboardingArtistIds: state.dismissedOnboardingArtistIds,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
