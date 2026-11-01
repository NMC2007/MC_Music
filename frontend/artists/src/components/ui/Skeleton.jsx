import React from "react";

/**
 * Component Skeleton cơ sở: hiển thị khối xám nhấp nháy
 */
export const Skeleton = ({ className = "" }) => {
  return (
    <div className={`bg-neutral-800/70 animate-pulse rounded-md ${className}`} />
  );
};

/**
 * SkeletonCard: Khung chờ tải cho Thẻ Bài hát / Album
 */
export const SkeletonCard = ({ isArtist = false }) => {
  return (
    <div className="bg-[#181818] p-4 rounded-xl">
      <div className="relative mb-3.5 w-full aspect-square">
        <div
          className={`w-full h-full bg-neutral-800/80 animate-pulse ${
            isArtist ? "rounded-full" : "rounded-lg"
          }`}
        />
      </div>
      <div className="h-4 bg-neutral-800 animate-pulse rounded-full w-3/4 mb-2" />
      <div className="h-3 bg-neutral-800/70 animate-pulse rounded-full w-1/2" />
    </div>
  );
};

/**
 * SkeletonRow: Khung chờ tải cho 1 hàng trong bảng bài hát
 */
export const SkeletonRow = () => {
  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-white/[0.01] rounded-lg">
      <div className="w-10 h-10 bg-neutral-800 animate-pulse rounded-lg flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-neutral-800 animate-pulse rounded-full w-2/5" />
        <div className="h-3 bg-neutral-800/60 animate-pulse rounded-full w-1/4" />
      </div>
      <div className="w-20 h-6 bg-neutral-800/80 animate-pulse rounded-full hidden sm:block" />
      <div className="w-16 h-4 bg-neutral-800 animate-pulse rounded-full" />
    </div>
  );
};

/**
 * SkeletonStat: Khung chờ tải cho 4 thẻ thống kê trên Dashboard
 */
export const SkeletonStat = () => {
  return (
    <div className="p-5 rounded-2xl bg-[#181818] space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-neutral-800 animate-pulse rounded-full w-1/3" />
        <div className="w-9 h-9 bg-neutral-800 animate-pulse rounded-xl" />
      </div>
      <div className="h-8 bg-neutral-800 animate-pulse rounded-lg w-1/2" />
      <div className="h-3 bg-neutral-800/60 animate-pulse rounded-full w-2/3" />
    </div>
  );
};

export default Skeleton;
