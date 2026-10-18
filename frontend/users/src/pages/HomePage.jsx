import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { SongCard } from "../components/ui/SongCard";
import { SectionCarousel } from "../components/ui/SectionCarousel";
import { SkeletonCard } from "../components/ui/Skeleton";
import { useAuthStore } from "../store/useAuthStore";
import { usePlayerStore } from "../store/usePlayerStore";
import {
  getPublicSongs,
  getPublicAlbums,
  getArtistSongs,
  getAlbumSongs,
  getSongById,
} from "../api/catalog/public";
import { getPublicArtists } from "../api/artists/public";
import { getUserPlayHistoryApi } from "../api/users/history";
import { useFavorites } from "../hooks/useFavorites";
import { useFollowArtists } from "../hooks/useFollowArtists";

export const HomePage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { playSongWithContext } = usePlayerStore();
  const { favoriteSongs, isLoadingSongs: isLoadingFavorites } = useFavorites();
  const { followedArtists, isLoadingFollowed } = useFollowArtists();
  const navigate = useNavigate();

  const handlePlayHistoryCard = async (historyItem) => {
    try {
      const res = await getSongById(historyItem.songId);
      const song = res?.data;
      if (song) {
        playSongWithContext(song, [song]);
      }
    } catch (err) {
      console.error("Lỗi khi phát bài hát từ lịch sử:", err);
    }
  };

  const handlePlayFavoriteCard = async (favItem) => {
    try {
      const res = await getSongById(favItem.songId);
      const song = res?.data;
      if (song) {
        playSongWithContext(song, [song]);
      }
    } catch (err) {
      console.error("Lỗi khi phát bài hát từ danh sách yêu thích:", err);
    }
  };

  const handlePlayArtistCard = async (artistId) => {
    try {
      const res = await getArtistSongs(artistId, {
        size: 50,
        sort: "likeCount,desc",
      });
      const songs = res.data?.content || [];
      if (songs.length > 0) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        playSongWithContext(songs[randomIndex], songs, randomIndex);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayAlbumCard = async (albumId) => {
    try {
      const res = await getAlbumSongs(albumId, {
        size: 50,
        sort: "createdAt,asc",
      });
      const songs = res.data?.content || [];
      if (songs.length > 0) {
        playSongWithContext(songs[0], songs, 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatAlbumType = (type) => {
    if (!type) return "Album";
    if (type.toUpperCase() === "EP") return "EP";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  // Fetch Public Songs
  const { data: songsData, isLoading: isLoadingSongs } = useQuery({
    queryKey: ["publicSongs", "trending"],
    queryFn: () => getPublicSongs({ size: 10, sort: "playCount,desc" }),
  });

  // Fetch Public Artists
  const { data: artistsData, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["publicArtists", "popular"],
    queryFn: () => getPublicArtists({ size: 10, sort: "followerCount,desc" }),
  });

  const { data: albumsData, isLoading: isLoadingAlbums } = useQuery({
    queryKey: ["publicAlbums", "popular"],
    queryFn: () => getPublicAlbums({ size: 10, sort: "likeCount,desc" }),
  });

  // Fetch Lịch sử nghe gần đây (chỉ khi đã đăng nhập, lấy size 30 để sau khi lọc trùng vẫn đủ bài hiển thị)
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["userPlayHistory", "home", 30],
    queryFn: () => getUserPlayHistoryApi({ page: 0, size: 30 }),
    enabled: !!isAuthenticated,
  });

  // Trích xuất dữ liệu từ response (chuẩn hóa API backend trả về format: data.data.content)
  const songs = songsData?.data?.content || [];
  const artists = artistsData?.data?.content || [];
  const albums = albumsData?.data?.content || [];

  // Lọc trùng lặp bài hát theo songId (giữ lại lượt nghe mới nhất của mỗi bài hát)
  const recentSongs = useMemo(() => {
    const rawHistory = historyData?.data?.content || [];
    const seenSongIds = new Set();
    const uniqueList = [];

    for (const item of rawHistory) {
      const songId = item.songId || item.id;
      if (songId && !seenSongIds.has(songId)) {
        seenSongIds.add(songId);
        uniqueList.push(item);
      }
    }

    return uniqueList.slice(0, 10);
  }, [historyData]);

  // Tạo khung Skeleton khi đang tải (sử dụng component chuẩn mới)
  const renderSkeletons = (count = 5, isArtist = false) => {
    return Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
      >
        <SkeletonCard isArtist={isArtist} />
      </div>
    ));
  };

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* 1. KHỐI PRIVATE (Chỉ hiện khi đăng nhập) */}
      {isAuthenticated && (
        <>
          <SectionCarousel title="Nghe gần đây">
            {isLoadingHistory ? (
              renderSkeletons()
            ) : recentSongs.length > 0 ? (
              recentSongs.map((item) => (
                <div
                  key={item.id || item.songId}
                  className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
                >
                  <SongCard
                    type="song"
                    title={item.songTitle}
                    subtitle={item.artistName}
                    artistName={item.artistName}
                    imageUrl={item.coverImage}
                    onClick={() => handlePlayHistoryCard(item)}
                    onPlayClick={() => handlePlayHistoryCard(item)}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
                <span>Bạn chưa có bài hát nào trong lịch sử nghe gần đây.</span>
              </div>
            )}
          </SectionCarousel>
          <SectionCarousel title="Bài hát yêu thích">
            {isLoadingFavorites ? (
              renderSkeletons()
            ) : favoriteSongs.length > 0 ? (
              favoriteSongs.map((item) => (
                <div
                  key={item.songId}
                  className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
                >
                  <SongCard
                    type="song"
                    title={item.songTitle}
                    subtitle={item.artistName}
                    artistName={item.artistName}
                    imageUrl={item.coverImage}
                    onClick={() => handlePlayFavoriteCard(item)}
                    onPlayClick={() => handlePlayFavoriteCard(item)}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
                <span>Bạn chưa có bài hát nào trong danh sách yêu thích.</span>
              </div>
            )}
          </SectionCarousel>
          <SectionCarousel title="Nghệ sĩ bạn theo dõi">
            {isLoadingFollowed ? (
              renderSkeletons(5, true)
            ) : followedArtists.length > 0 ? (
              followedArtists.map((artist) => (
                <div
                  key={artist.artistId || artist.id}
                  className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
                >
                  <SongCard
                    type="artist"
                    title={artist.artistName || artist.stageName}
                    subtitle="Nghệ sĩ"
                    artistName={artist.artistName || artist.stageName}
                    imageUrl={artist.avatar || artist.avatarUrl}
                    onClick={() =>
                      navigate(`/artist/${artist.artistId || artist.id}`)
                    }
                    onPlayClick={() =>
                      handlePlayArtistCard(artist.artistId || artist.id)
                    }
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
                <span>Bạn chưa theo dõi nghệ sĩ nào. Hãy theo dõi các nghệ sĩ để nhận cập nhật mới nhất!</span>
              </div>
            )}
          </SectionCarousel>
        </>
      )}

      {/* 2. KHỐI PUBLIC */}

      {/* Khối Bài Hát */}
      <SectionCarousel title="Những bài hát thịnh hành">
        {isLoadingSongs ? (
          renderSkeletons()
        ) : songs.length > 0 ? (
          songs.map((song, idx) => (
            <div
              key={song.id}
              className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
            >
              <SongCard
                type="song"
                title={song.title}
                subtitle={song.ownerName}
                artistName={song.ownerName}
                imageUrl={song.coverImage}
                onClick={() => playSongWithContext(song, songs, idx)}
                onPlayClick={() => {
                  playSongWithContext(song, songs, idx);
                }}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
            <span>Chưa có bài hát nào thịnh hành.</span>
          </div>
        )}
      </SectionCarousel>

      {/* Khối Nghệ sĩ */}
      <SectionCarousel title="Nghệ sĩ phổ biến">
        {isLoadingArtists ? (
          renderSkeletons(5, true)
        ) : artists.length > 0 ? (
          artists.map((artist) => (
            <div
              key={artist.id}
              className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
            >
              <SongCard
                type="artist"
                title={artist.stageName}
                subtitle="Nghệ sĩ"
                artistName={artist.stageName}
                imageUrl={artist.avatarUrl}
                onClick={() => navigate(`/artist/${artist.id}`)}
                onPlayClick={() => handlePlayArtistCard(artist.id)}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
            <span>Chưa có dữ liệu nghệ sĩ để hiển thị.</span>
          </div>
        )}
      </SectionCarousel>

      {/* Khối Album */}
      <SectionCarousel title="Album và đĩa đơn nổi tiếng">
        {isLoadingAlbums ? (
          renderSkeletons()
        ) : albums.length > 0 ? (
          albums.map((album) => (
            <div
              key={album.id}
              className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
            >
              <SongCard
                type="album"
                title={album.title}
                subtitle={`${formatAlbumType(album.albumType)} • ${album.ownerName}`}
                artistName={album.ownerName}
                imageUrl={album.coverImage}
                onClick={() =>
                  navigate(`/album/${album.id}`, { state: { album } })
                }
                onPlayClick={() => handlePlayAlbumCard(album.id)}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
            <span>Chưa có album nào được phát hành.</span>
          </div>
        )}
      </SectionCarousel>
    </div>
  );
};
