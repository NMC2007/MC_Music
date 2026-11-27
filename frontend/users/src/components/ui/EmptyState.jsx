import React from "react";
import { Button } from "./Button";

/**
 * Hiển thị trạng thái danh sách rỗng chuẩn Spotify Dark Theme.
 */
export const EmptyState = React.memo(({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "glass",
  className = "py-16 sm:py-20",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center gap-3 px-4 ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-neutral-800/80 flex items-center justify-center text-spotify-sub mb-1">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg sm:text-xl font-bold text-white">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-spotify-sub max-w-md">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          size="md"
          onClick={onAction}
          className="mt-2 font-bold px-6"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
});
