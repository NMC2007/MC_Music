import React from "react";
import { SectionCarousel } from "./SectionCarousel";

/**
 * Component SkeletonCard dùng để hiển thị khung loading cho dạng thẻ bài hát/album/nghệ sĩ.
 * Kích thước và layout được làm chuẩn xác khớp 100% với SongCard.
 */
export const SkeletonCard = ({ isArtist = false }) => {
  return (
    <div className="bg-transparent p-3 rounded-md">
      {/* Khung ảnh */}
      <div className="relative mb-4 w-full aspect-square">
        <div
          className={`w-full h-full bg-spotify-card animate-pulse shadow-lg ${
            isArtist ? "rounded-full" : "rounded-md"
          }`}
        ></div>
      </div>
      {/* Khung Text */}
      <div className="h-4 bg-spotify-card animate-pulse rounded-full w-3/4 mb-2"></div>
      <div className="h-3 bg-spotify-card animate-pulse rounded-full w-1/2 mt-1"></div>
    </div>
  );
};

/**
 * Component SkeletonRow dùng để hiển thị khung loading cho dạng danh sách dọc
 * (Sử dụng trong trang chi tiết Album hoặc trang Nghệ sĩ).
 */
export const SkeletonRow = () => {
  return (
    <div className="flex items-center gap-4 py-2 px-4 rounded-md">
      {/* Cột STT */}
      <div className="w-4 h-4 bg-spotify-card animate-pulse rounded"></div>
      
      {/* Thumbnail */}
      <div className="w-10 h-10 bg-spotify-card animate-pulse rounded-md flex-shrink-0"></div>
      
      {/* Khung thông tin Text */}
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="h-4 bg-spotify-card animate-pulse rounded-full w-1/3"></div>
        <div className="h-3 bg-spotify-card animate-pulse rounded-full w-1/4"></div>
      </div>
      
      {/* Cột Duration bên phải */}
      <div className="w-8 h-4 bg-spotify-card animate-pulse rounded-full"></div>
    </div>
  );
};

/**
 * Hàm tiện ích hiển thị 1 SectionCarousel chứa Skeleton.
 * Dùng trực tiếp trong HomePage để thay thế cho cái Loading text nhấp nháy cũ.
 */
export const SkeletonCarousel = ({ title, count = 5 }) => {
  return (
    <SectionCarousel title={title}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-shrink-0">
          <SkeletonCard />
        </div>
      ))}
    </SectionCarousel>
  );
};
