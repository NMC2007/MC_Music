import React from "react";
import { Disc3, Plus, Library } from "lucide-react";
import { Button } from "#/components/ui/Button";

export const AlbumsPage = () => {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Disc3 size={24} className="text-[#fa2d48]" /> Bộ sưu tập Album
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Gom nhóm các bài hát đơn lẻ thành các ấn phẩm Album, EP hoặc Single hoàn chỉnh.
          </p>
        </div>

        <Button variant="primary" size="md">
          <Plus size={16} /> Tạo Album mới
        </Button>
      </div>

      <div className="p-12 rounded-2xl bg-[#181818] text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[#fa2d48]/10 text-[#fa2d48] flex items-center justify-center mb-4">
          <Library size={28} />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">
          Sẵn sàng kết nối Phân hệ Album (Bước 7)
        </h3>
        <p className="text-xs text-neutral-400 max-w-md mb-6 leading-relaxed">
          Bước 7 sẽ triển khai Lưới danh sách Album, Form tạo Album mới và tính năng gán bài hát / sắp xếp thứ tự track.
        </p>
      </div>
    </div>
  );
};

export default AlbumsPage;
