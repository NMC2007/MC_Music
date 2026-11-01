import React, { forwardRef } from "react";

/**
 * Input: Ô nhập văn bản chuẩn phong cách Spotify Dark
 */
export const Input = forwardRef(({ error, className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full bg-[#242424] hover:bg-[#282828] focus:bg-[#282828] text-white placeholder-neutral-500 text-sm rounded-xl px-4 py-3 outline-none border transition-all duration-200 ${
        error
          ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          : "border-neutral-700/60 focus:border-white/80 focus:ring-1 focus:ring-white/40"
      } ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;
