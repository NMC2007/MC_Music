import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { showLoginToast } from "../utils/toastUtils";
import {
  getUserFollowedArtistsApi,
  followArtistApi,
  unfollowArtistApi,
} from "../api/artists/follows";

export const FOLLOWED_ARTISTS_QUERY_KEY = ["userFollowedArtists"];

/**
 * Custom hook quản lý trạng thái Theo dõi nghệ sĩ (Follow Artists)
 * - Tra cứu O(1) qua Set followedArtistIds.
 * - Hỗ trợ Optimistic Update: Chuyển đổi trạng thái nút lập tức (0ms).
 * - Tự động rollback nếu API gặp sự cố.
 * - Tự động hiển thị Toast thông báo đăng nhập nếu là Guest.
 */
export const useFollowArtists = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 1. Query danh sách nghệ sĩ đang theo dõi
  const followedQuery = useQuery({
    queryKey: FOLLOWED_ARTISTS_QUERY_KEY,
    queryFn: () => getUserFollowedArtistsApi({ page: 0, size: 100 }),
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });

  const followedArtists = useMemo(() => {
    return followedQuery.data?.data?.content || [];
  }, [followedQuery.data]);

  const followedArtistIds = useMemo(() => {
    return new Set(
      followedArtists
        .map((a) => a.artistId || a.id)
        .filter(Boolean)
    );
  }, [followedArtists]);

  const isFollowing = useCallback(
    (artistId) => {
      if (!artistId || !isAuthenticated) return false;
      return followedArtistIds.has(artistId);
    },
    [followedArtistIds, isAuthenticated]
  );

  // 2. Mutation Theo dõi / Hủy theo dõi
  const toggleFollowMutation = useMutation({
    mutationFn: async ({ artist, isFollowed }) => {
      const artistId = artist.artistId || artist.id;
      if (isFollowed) {
        return await unfollowArtistApi(artistId);
      } else {
        return await followArtistApi(artistId);
      }
    },
    onMutate: async ({ artist, isFollowed }) => {
      await queryClient.cancelQueries({ queryKey: FOLLOWED_ARTISTS_QUERY_KEY });
      const previousData = queryClient.getQueryData(FOLLOWED_ARTISTS_QUERY_KEY);

      const artistId = artist.artistId || artist.id;
      const artistName = artist.artistName || artist.stageName || "nghệ sĩ";

      // Optimistic update
      queryClient.setQueryData(FOLLOWED_ARTISTS_QUERY_KEY, (old) => {
        if (!old) return old;
        const currentList = old?.data?.content || [];
        let updatedList;
        if (isFollowed) {
          updatedList = currentList.filter(
            (a) => (a.artistId || a.id) !== artistId
          );
        } else {
          const newFollowed = {
            artistId,
            id: artistId,
            artistName,
            avatar: artist.avatar || artist.avatarUrl || artist.coverUrl || "",
          };
          updatedList = [newFollowed, ...currentList];
        }

        return {
          ...old,
          data: {
            ...old.data,
            content: updatedList,
            totalElements: isFollowed
              ? Math.max(0, (old.data?.totalElements || 1) - 1)
              : (old.data?.totalElements || 0) + 1,
          },
        };
      });

      // Toast tức thời
      if (isFollowed) {
        toast.info(`Đã hủy theo dõi ${artistName}`);
      } else {
        toast.success(`Đã theo dõi ${artistName}`);
      }

      return { previousData };
    },
    onError: (err, { artist, isFollowed }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(FOLLOWED_ARTISTS_QUERY_KEY, context.previousData);
      }
      const artistName = artist.artistName || artist.stageName || "nghệ sĩ";
      toast.error(`Không thể ${isFollowed ? "hủy theo dõi" : "theo dõi"} ${artistName}. Vui lòng thử lại!`);
      console.error("Lỗi toggle follow artist:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FOLLOWED_ARTISTS_QUERY_KEY });
    },
  });

  const toggleFollowArtist = useCallback(
    (artist) => {
      if (!artist) return;
      if (!isAuthenticated) {
        showLoginToast("theo dõi nghệ sĩ");
        return;
      }
      const artistId = artist.artistId || artist.id;
      const isFollowed = isFollowing(artistId);
      toggleFollowMutation.mutate({ artist, isFollowed });
    },
    [isAuthenticated, isFollowing, toggleFollowMutation]
  );

  return {
    followedArtists,
    isLoadingFollowed: followedQuery.isLoading,
    isFollowing,
    toggleFollowArtist,
    isToggling: toggleFollowMutation.isPending,
  };
};
