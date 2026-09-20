import React from "react";
import { SongCard } from "../components/ui/SongCard";
import { SectionCarousel } from "../components/ui/SectionCarousel";

// Dữ liệu giả (Mock Data) để dựng khung UI trước khi nối API
const MOCK_ARTISTS = [
  {
    id: 1,
    type: "artist",
    title: "Táo",
    cover: "https://i.pravatar.cc/150?u=tao",
  },
  {
    id: 2,
    type: "artist",
    title: "Hà Anh Tuấn",
    cover: "https://i.pravatar.cc/150?u=hat",
  },
  {
    id: 3,
    type: "artist",
    title: "Phan Mạnh Quỳnh",
    cover: "https://i.pravatar.cc/150?u=pmq",
  },
  {
    id: 4,
    type: "artist",
    title: "Thắng",
    cover: "https://i.pravatar.cc/150?u=thang",
  },
  {
    id: 5,
    type: "artist",
    title: "Obito",
    cover: "https://i.pravatar.cc/150?u=obito",
  },
  {
    id: 6,
    type: "artist",
    title: "Đen",
    cover: "https://i.pravatar.cc/150?u=den",
  },
  {
    id: 7,
    type: "artist",
    title: "Sơn Tùng M-TP",
    cover: "https://i.pravatar.cc/150?u=mtp",
  },
];

const MOCK_RECENT = [
  {
    id: 1,
    type: "playlist",
    title: "Sơn Tùng M-TP Radio",
    subtitle: "Danh sách phát • Spotify",
    cover: "https://picsum.photos/seed/mtpradio/150/150",
  },
  {
    id: 2,
    type: "artist",
    title: "RPT MCK",
    cover: "https://i.pravatar.cc/150?u=mck",
  },
  {
    id: 3,
    type: "album",
    title: "Ác Mộng Đẹp - Chapter 1",
    artistName: "Đạt G",
    cover: "https://picsum.photos/seed/datg/150/150",
  },
  {
    id: 4,
    type: "playlist",
    title: "Ep1: hoài nhớ",
    subtitle: "Danh sách phát • Nguyen Dinh Tuan",
    cover: "https://picsum.photos/seed/ep1/150/150",
  },
  {
    id: 5,
    type: "playlist",
    title: "Bài hát đã thích",
    subtitle: "Danh sách phát • Nguyn Manh Cuon",
    cover: "https://picsum.photos/seed/liked/150/150",
  },
  {
    id: 6,
    type: "artist",
    title: "DJ Kim Chol",
    cover: "https://i.pravatar.cc/150?u=djkimchol",
  },
];

const MOCK_ALBUMS = [
  {
    id: 1,
    type: "album",
    title: "Gieo",
    artistName: "Ngọt",
    cover: "https://picsum.photos/seed/gieo/150/150",
  },
  {
    id: 2,
    type: "album",
    title: "LOYA",
    artistName: "WEAN",
    cover: "https://picsum.photos/seed/loya/150/150",
  },
  {
    id: 3,
    type: "album",
    title: "Ái",
    artistName: "tlinh",
    cover: "https://picsum.photos/seed/ai/150/150",
  },
  {
    id: 4,
    type: "album",
    title: "Cong",
    artistName: "Tóc Tiên",
    cover: "https://picsum.photos/seed/cong/150/150",
  },
  {
    id: 5,
    type: "album",
    title: "KOSMIK",
    artistName: "SpaceSpeakers",
    cover: "https://picsum.photos/seed/kosmik/150/150",
  },
  {
    id: 6,
    type: "album",
    title: "Đánh Đổi",
    artistName: "Obito",
    cover: "https://picsum.photos/seed/danhdoi/150/150",
  },
];

export const HomePage = () => {
  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Khối Nghệ sĩ */}
      <SectionCarousel title="Nghệ sĩ yêu thích của bạn">
        {MOCK_ARTISTS.map((item) => (
          <div
            key={item.id}
            className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
          >
            <SongCard
              type={item.type}
              title={item.title}
              subtitle={item.subtitle}
              artistName={item.artistName}
              imageUrl={item.cover}
              onPlayClick={() => console.log("Play", item.title)}
            />
          </div>
        ))}
      </SectionCarousel>

      {/* Khối Gần đây (Mix) */}
      <SectionCarousel title="Gần đây">
        {MOCK_RECENT.map((item) => (
          <div
            key={item.id}
            className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
          >
            <SongCard
              type={item.type}
              title={item.title}
              subtitle={item.subtitle}
              artistName={item.artistName}
              imageUrl={item.cover}
              onPlayClick={() => console.log("Play", item.title)}
            />
          </div>
        ))}
      </SectionCarousel>

      {/* Khối Album */}
      <SectionCarousel title="Album nổi bật">
        {MOCK_ALBUMS.map((item) => (
          <div
            key={item.id}
            className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0"
          >
            <SongCard
              type={item.type}
              title={item.title}
              subtitle={item.subtitle}
              artistName={item.artistName}
              imageUrl={item.cover}
              onPlayClick={() => console.log("Play", item.title)}
            />
          </div>
        ))}
      </SectionCarousel>
    </div>
  );
};
