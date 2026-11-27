import { useState, useMemo, useCallback } from "react";
import { useFavorites } from "./useFavorites";
import { useFollowArtists } from "./useFollowArtists";
import { usePlaylists } from "./usePlaylists";
import { usePlaybackActions } from "./usePlaybackActions";

/**
 * Custom hook tổng hợp dữ liệu, bộ lọc và logic phát nhạc cho Thư viện (dùng chung cho Sidebar & LibraryPage).
 */
export const useLibrary = () => {
  const { favoriteSongs, favoriteAlbums } = useFavorites();
  const { followedArtists } = useFollowArtists();
  const { playlists } = usePlaylists();
  const { playArtist, playAlbum, playLikedSongs, playPlaylist } = usePlaybackActions();

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Phát bài hát yêu thích ---
  const handlePlayLikedSongs = useCallback(
    (e) => {
      e?.stopPropagation?.();
      playLikedSongs(favoriteSongs);
    },
    [favoriteSongs, playLikedSongs]
  );

  // --- Phát nhạc nghệ sĩ ---
  const handlePlayArtist = useCallback(
    (e, artistId) => {
      e?.stopPropagation?.();
      playArtist(artistId);
    },
    [playArtist]
  );

  // --- Phát album ---
  const handlePlayAlbum = useCallback(
    (e, albumId) => {
      e?.stopPropagation?.();
      playAlbum(albumId);
    },
    [playAlbum]
  );

  // --- Phát danh sách phát (Playlist) ---
  const handlePlayPlaylist = useCallback(
    (e, playlistId) => {
      e?.stopPropagation?.();
      playPlaylist(playlistId);
    },
    [playPlaylist]
  );

  // --- Tổng hợp và lọc danh sách Nghệ sĩ, Album & Playlist ---
  const libraryItems = useMemo(() => {
    let items = [];

    // 1. Thêm danh sách Nghệ sĩ đã theo dõi
    followedArtists.forEach((artist) => {
      items.push({
        id: artist.artistId || artist.id,
        title: artist.artistName || artist.stageName,
        subtitle: "Nghệ sĩ",
        image: artist.avatar || artist.avatarUrl,
        type: "artist",
        raw: artist,
      });
    });

    // 2. Thêm danh sách Album yêu thích
    favoriteAlbums.forEach((album) => {
      const albumTitle = album.albumTitle || album.title || "Album";
      const isEp =
        album.albumType?.toUpperCase() === "EP" ||
        albumTitle.toLowerCase().includes("ep");
      const displayType = isEp ? "EP" : "Album";

      items.push({
        id: album.albumId || album.id,
        title: albumTitle,
        subtitle: `${displayType} • ${album.artistName || album.ownerName || "Nghệ sĩ"}`,
        image: album.coverImage || album.coverUrl,
        type: "album",
        albumType: displayType,
        raw: {
          ...album,
          id: album.albumId || album.id,
          title: albumTitle,
          albumType: displayType,
        },
      });
    });

    // 3. Thêm danh sách Playlist của người dùng
    playlists.forEach((playlist) => {
      items.push({
        id: playlist.id,
        title: playlist.name,
        subtitle: `Danh sách phát • ${playlist.isPublic ? "Công khai" : "Riêng tư"}`,
        image: playlist.coverImage || null,
        type: "playlist",
        raw: playlist,
      });
    });

    // 4. Áp dụng bộ lọc danh mục
    if (selectedFilter) {
      if (selectedFilter === "Album") {
        items = items.filter((item) => item.type === "album" && item.albumType !== "EP");
      } else if (selectedFilter === "EP") {
        items = items.filter((item) => item.type === "album" && item.albumType === "EP");
      } else if (selectedFilter === "Nghệ sĩ") {
        items = items.filter((item) => item.type === "artist");
      } else if (selectedFilter === "Playlist") {
        items = items.filter((item) => item.type === "playlist");
      }
    }

    // 5. Áp dụng tìm kiếm theo từ khóa
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [followedArtists, favoriteAlbums, playlists, selectedFilter, searchQuery]);

  // Kiểm tra hiển thị mục "Bài hát đã thích" được ghim trên đầu
  const shouldShowLikedSongs =
    (!selectedFilter || selectedFilter === "Playlist") &&
    (!searchQuery.trim() ||
      "bài hát đã thích".includes(searchQuery.toLowerCase().trim()));

  return {
    selectedFilter,
    setSelectedFilter,
    searchQuery,
    setSearchQuery,
    libraryItems,
    shouldShowLikedSongs,
    favoriteSongsCount: favoriteSongs.length,
    handlePlayLikedSongs,
    handlePlayArtist,
    handlePlayAlbum,
    handlePlayPlaylist,
  };
};
