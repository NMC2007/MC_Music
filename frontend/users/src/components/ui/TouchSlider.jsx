import React from "react";

/**
 * Component thanh trượt cảm ứng dùng chung (Touch-friendly Range Slider)
 * - Tái sử dụng cho Seekbar Desktop, Volume Desktop và Seekbar cỡ lớn trên MobileFullPlayer.
 * - Mở rộng vùng chạm vô hình (py-2) giúp ngón tay dễ kéo trên di động mà vẫn giữ đường ray mảnh đẹp.
 */
export const TouchSlider = ({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  trackHeight = "h-1",
  trackBg = "bg-spotify-hover",
  activeColor = "bg-white group-hover:bg-[#fa2d48]",
  thumbSize = "h-3 w-3",
  alwaysShowThumb = false,
  hitAreaClass = "py-2",
  ariaLabel = "Thanh trượt điều chỉnh",
  className = "",
}) => {
  const safeMax = max > min ? max : min + 1;
  const clampedValue = Math.min(Math.max(Number(value) || 0, min), safeMax);
  const percent = ((clampedValue - min) / (safeMax - min)) * 100;

  return (
    <div
      className={`flex-1 flex items-center group relative select-none ${hitAreaClass} ${className}`}
    >
      <input
        type="range"
        aria-label={ariaLabel}
        min={min}
        max={safeMax}
        step={step}
        value={clampedValue}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 touch-none"
      />
      {/* Đường ray nền */}
      <div className={`w-full ${trackHeight} ${trackBg} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${activeColor} rounded-full transition-colors`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {/* Nút kéo (Thumb) */}
      <div
        className={`absolute ${thumbSize} bg-white rounded-full shadow-md transform -translate-x-1/2 pointer-events-none transition-opacity ${
          alwaysShowThumb ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ left: `${percent}%` }}
      />
    </div>
  );
};
