import React, { useState } from "react";
import { Music, User, Disc3 } from "lucide-react";

export const CoverImage = ({ 
  src, 
  alt, 
  className = "", 
  isArtist = false,
  isAlbum = false,
  fallbackIconSize = 28,
}) => {
  const [hasError, setHasError] = useState(false);

  // Giao diện mặc định (Fallback) khi ảnh lỗi, rỗng hoặc chưa load xong
  const renderFallback = () => (
    <div
      className={`flex items-center justify-center bg-[#242424] text-neutral-500 border border-neutral-800 ${className}`}
      title={alt}
    >
      {isArtist ? (
        <User size={fallbackIconSize} className="opacity-60" />
      ) : isAlbum ? (
        <Disc3 size={fallbackIconSize} className="opacity-60" />
      ) : (
        <Music size={fallbackIconSize} className="opacity-60" />
      )}
    </div>
  );

  if (!src || hasError) {
    return renderFallback();
  }

  return (
    <img
      src={src}
      alt={alt || "Media Cover"}
      className={`object-cover ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

export default CoverImage;
