import React from "react";
import { Heart } from "lucide-react";
import { Button } from "./Button";

/**
 * Nút Tim Yêu thích dùng chung với hiệu ứng hover scale và màu đỏ neon #fa2d48.
 */
export const FavoriteButton = React.memo(({
  isLiked = false,
  onToggle,
  size = 18,
  revealOnGroupHover = false,
  tooltipLike = "Thêm vào Bài hát đã thích",
  tooltipUnlike = "Xóa khỏi Bài hát đã thích",
  tooltipPosition = "top",
  className = "",
}) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onToggle?.(e);
  };

  const visibilityClass = isLiked
    ? "!text-[#fa2d48] opacity-100"
    : revealOnGroupHover
      ? "text-neutral-400 md:text-spotify-sub hover:text-white opacity-100 md:opacity-0 md:group-hover:opacity-100"
      : "text-neutral-400 md:text-spotify-sub hover:text-white";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      iconOnly
      aria-label={isLiked ? tooltipUnlike : tooltipLike}
      onClick={handleClick}
      tooltip={isLiked ? tooltipUnlike : tooltipLike}
      tooltipPosition={tooltipPosition}
      className={`!w-8 !h-8 hover:scale-110 active:scale-95 transition-all ${visibilityClass} ${className}`}
    >
      <Heart
        size={size}
        className={isLiked ? "fill-[#fa2d48] text-[#fa2d48]" : ""}
      />
    </Button>
  );
});
