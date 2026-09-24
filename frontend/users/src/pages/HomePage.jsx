import React from "react";
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
} from "../api/catalog/public";
import { getPublicArtists } from "../api/artists/public";

export const HomePage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { setCurrentSong, setIsPlaying } = usePlayerStore();
  const navigate = useNavigate();

  const handlePlayArtistCard = async (artistId) => {
    try {
      const res = await getArtistSongs(artistId, {
        size: 50,
        sort: "likeCount,desc",
      });
      const songs = res.data?.content || [];
      if (songs.length > 0) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        setCurrentSong(songs[randomIndex]);
        setIsPlaying(true);
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
        const randomIndex = Math.floor(Math.random() * songs.length);
        setCurrentSong(songs[randomIndex]);
        setIsPlaying(true);
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

  // Trích xuất dữ liệu từ response (chuẩn hóa API backend trả về format: data.data.content)
  const songs = songsData?.data?.content || [];
  const artists = artistsData?.data?.content || [];
  const albums = albumsData?.data?.content || [];

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
            <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
              <span>Tính năng "Nghe gần đây" đang được phát triển.</span>
            </div>
          </SectionCarousel>
          <SectionCarousel title="Bài hát yêu thích">
            <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
              <span>Tính năng "Bài hát yêu thích" đang được phát triển.</span>
            </div>
          </SectionCarousel>
          <SectionCarousel title="Nghệ sĩ bạn yêu thích">
            <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
              <span>
                Tính năng "Nghệ sĩ bạn yêu thích" đang được phát triển.
              </span>
            </div>
          </SectionCarousel>
        </>
      )}

      {/* 2. KHỐI PUBLIC */}

      {/* Khối Bài Hát */}
      <SectionCarousel title="Những bài hát thịnh hành">
        {isLoadingSongs ? (
          renderSkeletons()
        ) : songs.length > 0 ? (
          songs.map((song) => (
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
                onClick={() => {}}
                onPlayClick={() => {
                  setCurrentSong(song);
                  setIsPlaying(true);
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
