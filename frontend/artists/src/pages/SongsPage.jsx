import React from "react";
import { Music, Plus, UploadCloud } from "lucide-react";
import { Button } from "#/components/ui/Button";

export const SongsPage = () => {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Music size={24} className="text-[#fa2d48]" /> Danh sách Tác phẩm
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Quản lý tất cả các bài hát đã tải lên và theo dõi trạng thái kiểm duyệt Cloudinary.
          </p>
        </div>

        <Button variant="primary" size="md">
          <Plus size={16} /> Tải bài hát mới
        </Button>
      </div>

      {/* Placeholder thông báo sẵn sàng cho Bước 6 */}
      <div className="p-12 rounded-2xl bg-[#181818] text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[#fa2d48]/10 text-[#fa2d48] flex items-center justify-center mb-4">
          <UploadCloud size={28} />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">
          Sẵn sàng kết nối Phân hệ Quản lý Bài hát (Bước 6)
        </h3>
        <p className="text-xs text-neutral-400 max-w-md mb-6 leading-relaxed">
          Bước 6 sẽ triển khai Bảng danh sách bài hát thật (kèm StatusBadge), trình nghe thử MP3 trực tiếp và Modal Upload file nhạc lên Cloudinary.
        </p>
      </div>
    </div>
  );
};

export default SongsPage;
