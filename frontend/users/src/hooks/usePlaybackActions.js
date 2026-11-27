import { useCallback } from "react";
import { useNavigate } from "react-router";
import { usePlayerStore } from "../store/usePlayerStore";
import { getArtistSongs, getAlbumSongs, getSongById } from "../api/catalog/public";
import { getPlaylistSongsApi } from "../api/users/playlists";

const getRandomIndex = (len) => Math.floor(Math.random() * len);

/**
 * Custom hook hợp nhất logic fetch và phát nhạc từ Catalog (Song, Artist, Album, Playlist, Liked).
 */
export const usePlaybackActions = () => {
  const navigate = useNavigate();
  const playSongWithContext = usePlayerStore((state) => state.playSongWithContext);
  const playWithAutoQueue = usePlayerStore((state) => state.playWithAutoQueue);

  const playSongById = useCallback(
    async (songId) => {
      if (!songId) return;
      try {
        const res = await getSongById(songId);
        const song = res?.data;
        if (song) {
          playWithAutoQueue(song);
        }
      } catch (err) {
        console.error("Lỗi khi phát bài hát:", err);
      }
    },
    [playWithAutoQueue]
  );

  const playArtist = useCallback(
    async (artistId) => {
      if (!artistId) return;
      try {
        const res = await getArtistSongs(artistId, {
          size: 50,
          sort: "likeCount,desc",
        });
        const songs = res?.data?.content || [];
        if (songs.length > 0) {
          const randomIndex = getRandomIndex(songs.length);
          playSongWithContext(songs[randomIndex], songs, randomIndex);
        }
      } catch (err) {
        console.error("Lỗi khi phát nhạc nghệ sĩ:", err);
      }
    },
    [playSongWithContext]
  );

  const playAlbum = useCallback(
    async (albumId) => {
      if (!albumId) return;
      try {
        const res = await getAlbumSongs(albumId, {
          size: 50,
          sort: "createdAt,asc",
        });
        const songs = res?.data?.content || [];
        if (songs.length > 0) {
          playSongWithContext(songs[0], songs, 0);
        }
      } catch (err) {
        console.error("Lỗi khi phát album:", err);
      }
    },
    [playSongWithContext]
  );

  const playLikedSongs = useCallback(
    async (favoriteSongs = []) => {
      if (favoriteSongs.length === 0) {
        navigate("/collection/tracks");
        return;
      }
      try {
        const firstSongId = favoriteSongs[0].songId;
        const res = await getSongById(firstSongId);
        const fullSong = res?.data;
        if (fullSong) {
          const pool = favoriteSongs.map((f) =>
            f.songId === fullSong.id
              ? fullSong
              : {
                  id: f.songId,
                  title: f.songTitle,
                  artist: f.artistName,
                  coverImage: f.coverImage,
                }
          );
          playSongWithContext(fullSong, pool, 0);
        }
      } catch (err) {
        console.error("Lỗi khi phát bài hát yêu thích:", err);
      }
    },
    [navigate, playSongWithContext]
  );

  const playPlaylist = useCallback(
    async (playlistId) => {
      if (!playlistId) return;
      try {
        const res = await getPlaylistSongsApi(playlistId, { size: 50 });
        const songs = res?.data?.content || [];
        if (songs.length > 0) {
          const pool = songs.map((s) => ({
            id: s.songId,
            title: s.songTitle,
            artist: s.artistName,
            artistName: s.artistName,
            coverImage: s.coverImage,
          }));
          const firstSongRes = await getSongById(songs[0].songId);
          if (firstSongRes?.data) {
            playSongWithContext(firstSongRes.data, pool, 0);
            return;
          }
        }
        navigate(`/playlist/${playlistId}`);
      } catch (err) {
        console.error("Lỗi khi phát playlist:", err);
        navigate(`/playlist/${playlistId}`);
      }
    },
    [navigate, playSongWithContext]
  );

  return {
    playSongById,
    playArtist,
    playAlbum,
    playLikedSongs,
    playPlaylist,
  };
};
