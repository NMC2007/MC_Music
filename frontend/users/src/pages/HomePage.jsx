import React from "react";
import { useQuery } from "@tanstack/react-query";
import { SongCard } from "../components/ui/SongCard";
import { SectionCarousel } from "../components/ui/SectionCarousel";
import { useAuthStore } from "../store/useAuthStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { getPublicSongs, getPublicAlbums } from "../api/catalog/public";
import { getPublicArtists } from "../api/artists/public";

export const HomePage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);

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

  // Tạo khung Skeleton cơ bản khi đang tải
  const LoadingSkeleton = () => (
    <div className="col-span-full py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2 w-full">
      <span className="animate-pulse">Đang tải dữ liệu...</span>
    </div>
  );

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
              <span>Tính năng "Nghệ sĩ bạn yêu thích" đang được phát triển.</span>
            </div>
          </SectionCarousel>
        </>
      )}

      {/* 2. KHỐI PUBLIC */}
      
      {/* Khối Bài Hát */}
      <SectionCarousel title="Những bài hát thịnh hành">
        {isLoadingSongs ? (
          <LoadingSkeleton />
        ) : songs.length > 0 ? (
          songs.map((song) => (
            <div key={song.id} className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0">
              <SongCard
                type="song"
                title={song.title}
                subtitle={song.ownerName}
                artistName={song.ownerName}
                imageUrl={song.coverImage}
                onPlayClick={() => setCurrentSong(song)}
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
          <LoadingSkeleton />
        ) : artists.length > 0 ? (
          artists.map((artist) => (
            <div key={artist.id} className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0">
              <SongCard
                type="artist"
                title={artist.stageName}
                subtitle="Nghệ sĩ"
                artistName={artist.stageName}
                imageUrl={artist.avatarUrl}
                onPlayClick={() => console.log("Play artist", artist.id)}
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
          <LoadingSkeleton />
        ) : albums.length > 0 ? (
          albums.map((album) => (
            <div key={album.id} className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0">
              <SongCard
                type="album"
                title={album.title}
                subtitle={`${formatAlbumType(album.albumType)} | ${album.ownerName}`}
                artistName={album.ownerName}
                imageUrl={album.coverImage}
                onPlayClick={() => console.log("Play album", album.id)}
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
