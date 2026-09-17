import React from "react";
import { SongCard } from "../components/ui/SongCard";

// Dữ liệu giả (Mock Data) để dựng khung UI trước khi nối API
const MOCK_SONGS = [
  {
    id: 1,
    title: "Đừng Làm Trái Tim Anh Đau",
    artist: "Sơn Tùng M-TP",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
  {
    id: 2,
    title: "Chìm Sâu",
    artist: "RPT MCK",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
  {
    id: 3,
    title: "Nơi Này Có Anh",
    artist: "Sơn Tùng M-TP",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
  {
    id: 4,
    title: "Waiting For You",
    artist: "MONO",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
  {
    id: 5,
    title: "Tháng Tư Là Lời Nói Dối Của Em",
    artist: "Hà Anh Tuấn",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
  {
    id: 6,
    title: "Ánh Nắng Của Anh",
    artist: "Đức Phúc",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
  {
    id: 7,
    title: "Ánh Nắng Của Anh",
    artist: "Đức Phúc",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
  {
    id: 8,
    title: "Đao của anh vừa",
    artist: "RPT MCK",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
  {
    id: 9,
    title: "hello",
    artist: "Đức Phúc",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
  {
    id: 10,
    title: "hello2",
    artist: "Đức Phúc",
    cover:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/hinh_nen_am_nhac_cover_735bc482b1.png",
  },
];

export const HomePage = () => {
  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Khối Trending */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
            Thịnh hành hiện nay
          </h2>
          <span className="text-sm font-bold text-spotify-sub hover:text-white cursor-pointer">
            Hiện tất cả
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {MOCK_SONGS.map((song) => (
            <SongCard
              key={song.id}
              title={song.title}
              subtitle={song.artist}
              imageUrl={song.cover}
              onPlayClick={() => console.log("Play", song.title)}
            />
          ))}
        </div>
      </section>

      {/* Khối Mới Phát Hành */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
            Mới phát hành
          </h2>
          <span className="text-sm font-bold text-spotify-sub hover:text-white cursor-pointer">
            Hiện tất cả
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {MOCK_SONGS.slice()
            .reverse()
            .map((song) => (
              <SongCard
                key={`new-${song.id}`}
                title={song.title}
                subtitle={song.artist}
                imageUrl={song.cover}
                onPlayClick={() => console.log("Play", song.title)}
              />
            ))}
        </div>
      </section>
    </div>
  );
};
