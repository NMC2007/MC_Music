import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Disc3,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";
import { FormField } from "#/components/ui/FormField";
import { Input } from "#/components/ui/Input";
import { createAlbumApi } from "#/api/catalog";

// ─── VALIDATION SCHEMA ────────────────────────────────────────────────────────
const createAlbumSchema = z.object({
  title: z
    .string()
    .min(1, "Tên Album không được để trống")
    .max(200, "Tên Album tối đa 200 ký tự"),
  albumType: z.enum(["ALBUM", "EP", "SINGLE"]),
  releaseDate: z.string().optional(),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional(),
});

const ALBUM_TYPES = [
  { value: "ALBUM", label: "Album", desc: "Tuyển tập đầy đủ (thường từ 6 bài trở lên)" },
  { value: "EP", label: "EP (Đĩa mở rộng)", desc: "Ấn phẩm ngắn (từ 3 - 5 bài)" },
  { value: "SINGLE", label: "Single (Đĩa đơn)", desc: "Ấn phẩm tập trung 1 - 2 bài hát" },
];

export const CreateAlbumModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedType, setSelectedType] = useState("ALBUM");

  // Lấy ngày hiện tại định dạng YYYY-MM-DD làm mặc định
  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createAlbumSchema),
    defaultValues: {
      title: "",
      albumType: "ALBUM",
      releaseDate: todayStr,
      description: "",
    },
  });

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file hình ảnh (.jpg, .png, .webp)");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error("Kích thước ảnh tối đa là 15MB");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset({
      title: "",
      albumType: "ALBUM",
      releaseDate: todayStr,
      description: "",
    });
    setCoverFile(null);
    setCoverPreview(null);
    setSelectedType("ALBUM");
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("albumType", selectedType);

      if (data.releaseDate) {
        formData.append("releaseDate", data.releaseDate);
      }
      if (data.description?.trim()) {
        formData.append("description", data.description.trim());
      }
      if (coverFile) {
        formData.append("coverImage", coverFile);
      }

      await createAlbumApi(formData);

      toast.success("Tạo Album mới thành công!", {
        description: `Album "${data.title}" đã được tạo và gửi vào hàng đợi duyệt.`,
      });

      queryClient.invalidateQueries({ queryKey: ["myAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["artistDashboard"] });

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Lỗi khi tạo album:", err);
      toast.error("Tạo Album thất bại", {
        description: err.response?.data?.message || "Vui lòng kiểm tra lại thông tin.",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo Album / Tuyển tập mới"
      description="Thiết lập ấn phẩm âm nhạc mới để gom nhóm các bài hát của bạn."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
        {/* 1. TÊN ALBUM */}
        <FormField label="Tên Album / Ấn phẩm" required error={errors.title?.message}>
          <Input
            placeholder="Ví dụ: Chúng Ta, Sky Tour, Inner Me..."
            {...register("title")}
            error={!!errors.title}
            autoFocus
          />
        </FormField>

        {/* 2. CHỌN LOẠI ALBUM */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Layers size={14} className="text-neutral-400" />
            Loại ấn phẩm <span className="text-[#fa2d48]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ALBUM_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setSelectedType(type.value);
                  setValue("albumType", type.value);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedType === type.value
                    ? "border-[#fa2d48] bg-[#fa2d48]/10 shadow-[0_2px_12px_rgba(250,45,72,0.25)]"
                    : "border-neutral-700/60 hover:border-neutral-500 bg-[#1e1e1e]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${selectedType === type.value ? "text-[#fa2d48]" : "text-white"}`}>
                    {type.label}
                  </span>
                  {selectedType === type.value && (
                    <CheckCircle2 size={14} className="text-[#fa2d48]" />
                  )}
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 3. NGÀY PHÁT HÀNH */}
        <FormField label="Ngày phát hành dự kiến" error={errors.releaseDate?.message}>
          <div className="relative">
            <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              type="date"
              {...register("releaseDate")}
              className="w-full bg-[#1e1e1e] hover:bg-[#242424] focus:bg-[#242424] text-white text-xs rounded-xl pl-10 pr-4 py-3 outline-none border border-neutral-700/60 focus:border-white/80 transition-all cursor-pointer"
            />
          </div>
        </FormField>

        {/* 4. ẢNH BÌA ALBUM (COVER) */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Ảnh bìa Album (Cover Art)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-40 rounded-xl border-2 border-dashed border-neutral-700 hover:border-neutral-500 overflow-hidden cursor-pointer transition-all bg-[#1a1a1a]"
          >
            {coverPreview ? (
              <>
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                  <ImageIcon size={22} className="text-white" />
                  <span className="text-white text-xs font-bold">Thay đổi ảnh bìa</span>
                  <span className="text-neutral-400 text-[10px]">JPG, PNG, WEBP tỷ lệ 1:1</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-500 group-hover:text-neutral-300 p-4 text-center">
                <Disc3 size={28} className="text-neutral-600 group-hover:text-[#fa2d48] transition-colors" />
                <span className="text-xs font-semibold">
                  Kéo thả hoặc click để chọn ảnh bìa Album
                </span>
                <span className="text-[11px] text-neutral-600">
                  Khuyến nghị ảnh vuông kích thước tối thiểu 1000x1000px
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverSelect}
            />
          </div>
          {coverFile && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 size={13} /> Đã chọn ảnh: {coverFile.name} ({(coverFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* 5. MÔ TẢ ALBUM */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <FileText size={14} className="text-neutral-400" />
            Mô tả câu chuyện của Album
          </label>
          <textarea
            rows={3}
            placeholder="Chia sẻ thông điệp nghệ thuật hoặc câu chuyện phía sau ấn phẩm này..."
            {...register("description")}
            className="w-full bg-[#1e1e1e] hover:bg-[#242424] focus:bg-[#242424] text-white placeholder-neutral-500 text-xs rounded-xl p-3.5 outline-none border border-neutral-700/60 focus:border-white/80 transition-all resize-none scrollbar-thin"
          />
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.05]">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="px-8 shadow-[0_4px_16px_rgba(250,45,72,0.35)]"
          >
            <Disc3 size={16} />
            Tạo Album
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAlbumModal;

