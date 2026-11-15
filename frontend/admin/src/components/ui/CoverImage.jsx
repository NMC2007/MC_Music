import React, { useState } from "react";
import { Music, User, Disc3 } from "lucide-react";

/**
 * CoverImage: Hiển thị ảnh bìa bài hát / album / nghệ sĩ an toàn
 * Tự động chuyển sang fallback SVG tinh tế khi ảnh rỗng, lỗi 404 hoặc mạng chập chờn.
 * Tuyệt đối tránh vòng lặp onError gây nhấp nháy giao diện.
 */
export const CoverImage = ({
  src,
  alt,
  className = "",
  isArtist = false,
  isAlbum = false,
  fallbackIconSize = 20,
}) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const hasError = !src || failedSrc === src;

  // Khung Fallback chuẩn phong cách Spotify Dark
  const renderFallback = () => (
    <div
      className={`flex items-center justify-center bg-[#242424] text-neutral-500 border border-white/[0.04] flex-shrink-0 select-none ${className}`}
      title={alt}
    >
      {isArtist ? (
        <User size={fallbackIconSize} className="opacity-60 text-neutral-400" />
      ) : isAlbum ? (
        <Disc3 size={fallbackIconSize} className="opacity-60 text-neutral-400" />
      ) : (
        <Music size={fallbackIconSize} className="opacity-60 text-neutral-400" />
      )}
    </div>
  );

  if (hasError) {
    return renderFallback();
  }

  return (
    <img
      src={src}
      alt={alt || "Media Cover"}
      className={`object-cover flex-shrink-0 ${className}`}
      onError={() => setFailedSrc(src)}
      loading="lazy"
    />
  );
};

export default CoverImage;
