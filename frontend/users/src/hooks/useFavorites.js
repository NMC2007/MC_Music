import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { showLoginToast } from "../utils/toastUtils";
import {
  getUserFavoritesApi,
  addFavoriteSongApi,
  removeFavoriteSongApi,
  getUserFavoriteAlbumsApi,
  addFavoriteAlbumApi,
  removeFavoriteAlbumApi,
} from "../api/users/favorites";
import { getPublicAlbums } from "../api/catalog/public";

export const FAVORITES_QUERY_KEY = ["userFavorites", "songs"];
export const FAVORITE_ALBUMS_QUERY_KEY = ["userFavorites", "albums"];

/**
 * Custom hook quản lý trạng thái Yêu thích (Songs & Albums)
 * - Tự động đồng bộ với backend khi user đăng nhập.
 * - Cung cấp hàm kiểm tra isFavoriteSong(songId) và isFavoriteAlbum(albumId) tức thời.
 * - Hỗ trợ Optimistic Update: Icon chuyển màu và Toast hiển thị ngay lập tức (0ms).
 * - Tự động rollback dữ liệu và thông báo lỗi nếu API gặp sự cố.
 * - Tự động chặn và hiển thị showLoginToast khi người dùng chưa đăng nhập.
 */
export const useFavorites = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 1. Query danh sách bài hát yêu thích
  const songsQuery = useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: () => getUserFavoritesApi({ page: 0, size: 100 }),
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });

  // 2. Query danh sách album yêu thích
  const albumsQuery = useQuery({
    queryKey: FAVORITE_ALBUMS_QUERY_KEY,
    queryFn: () => getUserFavoriteAlbumsApi({ page: 0, size: 100 }),
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  // 3. Query danh sách album công khai từ Catalog để enrich metadata (albumType: 'EP' vs 'ALBUM')
  const publicAlbumsQuery = useQuery({
    queryKey: ["publicAlbums", "catalogLookup"],
    queryFn: () => getPublicAlbums({ size: 100 }),
    staleTime: 1000 * 60 * 10,
  });

  const publicAlbumsMap = useMemo(() => {
    const map = new Map();
    const list = publicAlbumsQuery.data?.data?.content || [];
    list.forEach((alb) => {
      if (alb.id) map.set(alb.id, alb);
    });
    return map;
  }, [publicAlbumsQuery.data]);

  // Danh sách bài hát yêu thích dạng mảng
  const favoriteSongs = useMemo(() => {
    return songsQuery.data?.data?.content || [];
  }, [songsQuery.data]);

  // Set chứa songId để tra cứu O(1)
  const favoriteSongIds = useMemo(() => {
    return new Set(favoriteSongs.map((s) => s.songId).filter(Boolean));
  }, [favoriteSongs]);

  // Danh sách album yêu thích dạng mảng (đã chuẩn hóa albumType chính xác từ Catalog)
  const favoriteAlbums = useMemo(() => {
    const rawList = albumsQuery.data?.data?.content || [];
    return rawList.map((item) => {
      const publicMeta = publicAlbumsMap.get(item.albumId);
      const albumType = item.albumType || publicMeta?.albumType || "ALBUM";
      return {
        ...item,
        albumType,
        title: item.albumTitle || item.title,
        ownerName: item.artistName || publicMeta?.ownerName,
        raw: {
          ...publicMeta,
          ...item,
          albumType,
        },
      };
    });
  }, [albumsQuery.data, publicAlbumsMap]);

  // Set chứa albumId để tra cứu O(1)
  const favoriteAlbumIds = useMemo(() => {
    return new Set(favoriteAlbums.map((a) => a.albumId).filter(Boolean));
  }, [favoriteAlbums]);

  // Kiểm tra bài hát đã được yêu thích chưa
  const isFavoriteSong = useCallback(
    (songId) => {
      if (!songId || !isAuthenticated) return false;
      return favoriteSongIds.has(songId);
    },
    [favoriteSongIds, isAuthenticated]
  );

  // Kiểm tra album đã được yêu thích chưa
  const isFavoriteAlbum = useCallback(
    (albumId) => {
      if (!albumId || !isAuthenticated) return false;
      return favoriteAlbumIds.has(albumId);
    },
    [favoriteAlbumIds, isAuthenticated]
  );

  // ── MUTATION THẢ TIM BÀI HÁT (OPTIMISTIC UPDATE) ──
  const toggleFavoriteSongMutation = useMutation({
    mutationFn: async ({ song, isLiked }) => {
      const songId = song.id || song.songId;
      if (isLiked) {
        return await removeFavoriteSongApi(songId);
      } else {
        return await addFavoriteSongApi(songId);
      }
    },
    onMutate: async ({ song, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previousData = queryClient.getQueryData(FAVORITES_QUERY_KEY);

      const songId = song.id || song.songId;
      const songTitle = song.title || song.songTitle || "bài hát";

      queryClient.setQueryData(FAVORITES_QUERY_KEY, (old) => {
        if (!old) {
          if (isLiked) return old;
          return {
            code: 1000,
            message: "Success",
            data: {
              content: [
                {
                  songId,
                  songTitle,
                  artistName:
                    song.artist ||
                    song.ownerName ||
                    song.artistName ||
                    "Nghệ sĩ",
                  coverImage: song.coverUrl || song.coverImage || "",
                  createdAt: new Date().toISOString(),
                },
              ],
              page: { size: 100, number: 0, totalElements: 1, totalPages: 1 },
            },
          };
        }

        const currentContent = old.data?.content || [];
        let newContent;

        if (isLiked) {
          newContent = currentContent.filter((item) => item.songId !== songId);
        } else {
          const newItem = {
            songId,
            songTitle,
            artistName:
              song.artist || song.ownerName || song.artistName || "Nghệ sĩ",
            coverImage: song.coverUrl || song.coverImage || "",
            createdAt: new Date().toISOString(),
          };
          newContent = [
            newItem,
            ...currentContent.filter((item) => item.songId !== songId),
          ];
        }

        return {
          ...old,
          data: {
            ...old.data,
            content: newContent,
            page: {
              ...old.data?.page,
              totalElements: isLiked
                ? Math.max(0, (old.data?.page?.totalElements || 1) - 1)
                : (old.data?.page?.totalElements || 0) + 1,
            },
          },
        };
      });

      // Toast tức thời
      if (isLiked) {
        toast.info(`Đã xóa "${songTitle}" khỏi Bài hát đã thích`);
      } else {
        toast.success(`Đã thêm "${songTitle}" vào Bài hát đã thích`);
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previousData);
      }
      toast.error("Không thể cập nhật danh sách yêu thích. Vui lòng thử lại!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });

  // Hàm gọi thả tim / bỏ thích bài hát (có kiểm tra login)
  const toggleFavoriteSong = useCallback(
    (song) => {
      if (!song) return;

      if (!isAuthenticated) {
        showLoginToast("thêm bài hát vào danh sách yêu thích");
        return;
      }

      const songId = song.id || song.songId;
      if (!songId) return;

      const isLiked = favoriteSongIds.has(songId);
      toggleFavoriteSongMutation.mutate({ song, isLiked });
    },
    [isAuthenticated, favoriteSongIds, toggleFavoriteSongMutation]
  );

  // ── MUTATION THẢ TIM ALBUM (OPTIMISTIC UPDATE) ──
  const toggleFavoriteAlbumMutation = useMutation({
    mutationFn: async ({ album, isLiked }) => {
      const albumId = album.id || album.albumId;
      if (isLiked) {
        return await removeFavoriteAlbumApi(albumId);
      } else {
        return await addFavoriteAlbumApi(albumId);
      }
    },
    onMutate: async ({ album, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITE_ALBUMS_QUERY_KEY });
      const previousData = queryClient.getQueryData(FAVORITE_ALBUMS_QUERY_KEY);

      const albumId = album.id || album.albumId;
      const albumTitle = album.title || album.albumTitle || "Album";
      const albumType = album.albumType || publicAlbumsMap.get(albumId)?.albumType || "ALBUM";

      queryClient.setQueryData(FAVORITE_ALBUMS_QUERY_KEY, (old) => {
        if (!old) {
          if (isLiked) return old;
          return {
            code: 1000,
            message: "Success",
            data: {
              content: [
                {
                  albumId,
                  albumTitle,
                  albumType,
                  artistName:
                    album.artist ||
                    album.artistName ||
                    album.ownerName ||
                    "Nghệ sĩ",
                  coverImage: album.coverImage || album.coverUrl || "",
                  createdAt: new Date().toISOString(),
                },
              ],
              page: { size: 100, number: 0, totalElements: 1, totalPages: 1 },
            },
          };
        }

        const currentContent = old.data?.content || [];
        let newContent;

        if (isLiked) {
          newContent = currentContent.filter((item) => item.albumId !== albumId);
        } else {
          const newItem = {
            albumId,
            albumTitle,
            albumType,
            artistName:
              album.artist ||
              album.artistName ||
              album.ownerName ||
              "Nghệ sĩ",
            coverImage: album.coverImage || album.coverUrl || "",
            createdAt: new Date().toISOString(),
          };
          newContent = [
            newItem,
            ...currentContent.filter((item) => item.albumId !== albumId),
          ];
        }

        return {
          ...old,
          data: {
            ...old.data,
            content: newContent,
            page: {
              ...old.data?.page,
              totalElements: isLiked
                ? Math.max(0, (old.data?.page?.totalElements || 1) - 1)
                : (old.data?.page?.totalElements || 0) + 1,
            },
          },
        };
      });

      if (isLiked) {
        toast.info(`Đã xóa album "${albumTitle}" khỏi Thư viện`);
      } else {
        toast.success(`Đã lưu album "${albumTitle}" vào Thư viện`);
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(FAVORITE_ALBUMS_QUERY_KEY, context.previousData);
      }
      toast.error("Không thể cập nhật album yêu thích. Vui lòng thử lại!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITE_ALBUMS_QUERY_KEY });
    },
  });

  // Hàm gọi thả tim / bỏ thích album (có kiểm tra login)
  const toggleFavoriteAlbum = useCallback(
    (album) => {
      if (!album) return;

      if (!isAuthenticated) {
        showLoginToast("thêm album vào danh sách yêu thích");
        return;
      }

      const albumId = album.id || album.albumId;
      if (!albumId) return;

      const isLiked = favoriteAlbumIds.has(albumId);
      toggleFavoriteAlbumMutation.mutate({ album, isLiked });
    },
    [isAuthenticated, favoriteAlbumIds, toggleFavoriteAlbumMutation]
  );

  return {
    // Songs
    favoriteSongs,
    favoriteSongIds,
    isLoadingSongs: songsQuery.isLoading,
    isFavoriteSong,
    toggleFavoriteSong,
    isTogglingSong: toggleFavoriteSongMutation.isPending,

    // Albums
    favoriteAlbums,
    favoriteAlbumIds,
    isLoadingAlbums: albumsQuery.isLoading,
    isFavoriteAlbum,
    toggleFavoriteAlbum,
    isTogglingAlbum: toggleFavoriteAlbumMutation.isPending,

    // Refetch helpers
    refetchFavorites: songsQuery.refetch,
    refetchFavoriteAlbums: albumsQuery.refetch,
  };
};
