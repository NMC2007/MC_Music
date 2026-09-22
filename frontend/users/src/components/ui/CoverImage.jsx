import React, { useState } from "react";
import { Music, User } from "lucide-react";

export const CoverImage = ({ src, alt, className, isArtist = false }) => {
  const [hasError, setHasError] = useState(false);

  // Giao diện mặc định (Fallback) khi ảnh lỗi hoặc null
  const renderFallback = () => (
    <div
      className={`flex items-center justify-center bg-[#282828] text-spotify-sub ${className}`}
      title={alt}
    >
      {isArtist ? (
        <User size={40} className="opacity-50" />
      ) : (
        <Music size={40} className="opacity-50" />
      )}
    </div>
  );

  // Nếu không có src hoặc src bị lỗi thì hiển thị fallback
  if (!src || hasError) {
    return renderFallback();
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
