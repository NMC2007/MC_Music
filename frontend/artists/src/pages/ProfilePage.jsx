import { UserCheck, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "#/store/useAuthStore";
import { CoverImage } from "#/components/ui/CoverImage";
import { Button } from "#/components/ui/Button";

export const ProfilePage = () => {
  const { artist } = useAuthStore();

  const handleOpenOnboarding = () => {
    window.dispatchEvent(new CustomEvent("open-artist-onboarding"));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <UserCheck size={24} className="text-[#fa2d48]" /> Hồ sơ Nghệ sĩ
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Quản lý thông tin định danh, nghệ danh, tiểu sử và hình ảnh đại diện thương hiệu.
        </p>
      </div>

      {/* Preview Thẻ Hồ Sơ */}
      <div className="rounded-2xl overflow-hidden bg-[#181818] shadow-xl">
        {/* Banner Cover */}
        <div className="h-44 sm:h-52 w-full relative bg-neutral-800">
          <CoverImage
            src={artist?.coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
            isAlbum
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Thông tin Avatar & Tên */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-spotify-base shadow-2xl flex-shrink-0 bg-neutral-800">
              <CoverImage
                src={artist?.avatarUrl}
                alt={artist?.stageName}
                className="w-full h-full object-cover"
                isArtist
              />
            </div>
            <div className="mb-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {artist?.stageName || "Nghệ sĩ"}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">{artist?.email}</p>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={handleOpenOnboarding} className="mb-2">
            <ImageIcon size={14} /> Thay đổi ảnh nhanh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
