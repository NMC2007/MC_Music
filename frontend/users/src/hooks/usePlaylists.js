import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { showLoginToast } from "../utils/toastUtils";
import {
  getUserPlaylistsApi,
  createPlaylistApi,
  updatePlaylistApi,
  deletePlaylistApi,
  addSongToPlaylistApi,
  removeSongFromPlaylistApi,
} from "../api/users/playlists";

export const USER_PLAYLISTS_QUERY_KEY = ["userPlaylists"];

/**
 * Custom hook quản lý danh sách phát cá nhân của người dùng (Playlists)
 * - Tự động đồng bộ với Backend qua TanStack Query khi user đăng nhập.
 * - Hỗ trợ tạo playlist mới và tự động cập nhật danh sách lập tức.
 * - Hỗ trợ thêm/xóa bài hát vào playlist.
 */
export const usePlaylists = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 1. Query lấy danh sách playlist của người dùng
  const playlistsQuery = useQuery({
    queryKey: USER_PLAYLISTS_QUERY_KEY,
    queryFn: () => getUserPlaylistsApi({ page: 0, size: 100 }),
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60 * 3, // 3 phút
  });

  const playlists = useMemo(() => {
    return playlistsQuery.data?.data?.content || [];
  }, [playlistsQuery.data]);

  // 2. Mutation tạo Playlist mới
  const createPlaylistMutation = useMutation({
    mutationFn: async (payload) => {
      return await createPlaylistApi(payload);
    },
    onSuccess: (res) => {
      const newPlaylist = res?.data;
      queryClient.invalidateQueries({ queryKey: USER_PLAYLISTS_QUERY_KEY });
      toast.success(`Đã tạo danh sách phát "${newPlaylist?.name || "mới"}"`);
    },
    onError: (err) => {
      const errorMsg =
        err?.response?.data?.message || "Không thể tạo playlist. Vui lòng thử lại!";
      toast.error(errorMsg);
      console.error("Lỗi khi tạo playlist:", err);
    },
  });

  // 3. Mutation thêm bài hát vào Playlist
  const addSongMutation = useMutation({
    mutationFn: async ({ playlistId, songId, playlistName }) => {
      const res = await addSongToPlaylistApi(playlistId, songId);
      return { res, playlistName };
    },
    onSuccess: ({ playlistName }) => {
      queryClient.invalidateQueries({ queryKey: USER_PLAYLISTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["playlistSongs"] });
      toast.success(
        playlistName
          ? `Đã thêm bài hát vào "${playlistName}"`
          : "Đã thêm bài hát vào danh sách phát"
      );
    },
    onError: (err) => {
      const errorMsg =
        err?.response?.data?.message || "Không thể thêm bài hát vào danh sách phát!";
      toast.error(errorMsg);
      console.error("Lỗi thêm bài hát vào playlist:", err);
    },
  });

  // 4. Mutation gỡ bài hát khỏi Playlist
  const removeSongMutation = useMutation({
    mutationFn: async ({ playlistId, songId }) => {
      return await removeSongFromPlaylistApi(playlistId, songId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PLAYLISTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["playlistSongs"] });
      toast.success("Đã xóa bài hát khỏi danh sách phát");
    },
    onError: (err) => {
      const errorMsg =
        err?.response?.data?.message || "Không thể xóa bài hát khỏi danh sách phát!";
      toast.error(errorMsg);
      console.error("Lỗi xóa bài hát khỏi playlist:", err);
    },
  });

  // 5. Mutation cập nhật Playlist
  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, data }) => {
      return await updatePlaylistApi(playlistId, data);
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_PLAYLISTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["playlistDetail", variables.playlistId] });
      toast.success("Đã cập nhật thông tin playlist thành công");
    },
    onError: (err) => {
      const errorMsg =
        err?.response?.data?.message || "Không thể cập nhật playlist. Vui lòng thử lại!";
      toast.error(errorMsg);
      console.error("Lỗi khi cập nhật playlist:", err);
    },
  });

  // 6. Mutation xóa Playlist
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId) => {
      return await deletePlaylistApi(playlistId);
    },
    onSuccess: (_, playlistId) => {
      queryClient.invalidateQueries({ queryKey: USER_PLAYLISTS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: ["playlistDetail", playlistId] });
      queryClient.removeQueries({ queryKey: ["playlistSongs", playlistId] });
      toast.success("Đã xóa danh sách phát thành công");
    },
    onError: (err) => {
      const errorMsg =
        err?.response?.data?.message || "Không thể xóa playlist. Vui lòng thử lại!";
      toast.error(errorMsg);
      console.error("Lỗi khi xóa playlist:", err);
    },
  });

  // Hàm kích hoạt tạo Playlist an toàn (kiểm tra auth)
  const createPlaylist = useCallback(
    async (payload) => {
      if (!isAuthenticated) {
        showLoginToast("tạo danh sách phát mới");
        return null;
      }
      return await createPlaylistMutation.mutateAsync(payload);
    },
    [isAuthenticated, createPlaylistMutation]
  );

  return {
    playlists,
    isLoadingPlaylists: playlistsQuery.isLoading,
    createPlaylist,
    isCreating: createPlaylistMutation.isPending,
    updatePlaylist: updatePlaylistMutation.mutateAsync,
    isUpdating: updatePlaylistMutation.isPending,
    deletePlaylist: deletePlaylistMutation.mutateAsync,
    isDeleting: deletePlaylistMutation.isPending,
    addSongToPlaylist: addSongMutation.mutateAsync,
    isAddingSong: addSongMutation.isPending,
    removeSongFromPlaylist: removeSongMutation.mutateAsync,
    isRemovingSong: removeSongMutation.isPending,
    refetchPlaylists: playlistsQuery.refetch,
  };
};
