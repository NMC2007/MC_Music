import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Disc3,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";
import { FormField } from "#/components/ui/FormField";
import { Input } from "#/components/ui/Input";
import { updateAlbumApi } from "#/api/catalog";

// ─── VALIDATION SCHEMA ────────────────────────────────────────────────────────
const editAlbumSchema = z.object({
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

export const EditAlbumModal = ({ isOpen, onClose, album, onSuccess }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedType, setSelectedType] = useState("ALBUM");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editAlbumSchema),
  });

  // Đồng bộ dữ liệu album vào form khi mở modal
  useEffect(() => {
    if (album && isOpen) {
      setValue("title", album.title || "");
      const type = album.albumType || "ALBUM";
      setSelectedType(type);
      setValue("albumType", type);
      setValue(
        "releaseDate",
        album.releaseDate ? album.releaseDate.substring(0, 10) : ""
      );
      setValue("description", album.description || "");
      setCoverPreview(album.coverImage || null);
      setCoverFile(null);
    }
  }, [album, isOpen, setValue]);

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file hình ảnh (.jpg, .png, .webp)");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    setCoverFile(null);
    setCoverPreview(null);
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
      if (data.description !== undefined) {
        formData.append("description", data.description.trim());
      }
      if (coverFile) {
        formData.append("coverImage", coverFile);
      }

      await updateAlbumApi(album.id, formData);

      toast.success("Cập nhật Album thành công!", {
        description: `Album "${data.title}" đã chuyển về trạng thái Chờ duyệt (PENDING).`,
      });

      queryClient.invalidateQueries({ queryKey: ["myAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["artistDashboard"] });

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Lỗi khi cập nhật album:", err);
      toast.error("Cập nhật Album thất bại", {
        description: err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    }
  };

  if (!album) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Chỉnh sửa Album"
      description="Cập nhật tiêu đề, ảnh bìa hoặc phân loại ấn phẩm."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
        {/* CẢNH BÁO CHUYỂN VỀ PENDING */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
          <AlertCircle size={17} className="flex-shrink-0 mt-0.5 text-amber-400" />
          <span>
            <strong>Lưu ý:</strong> Khi lưu chỉnh sửa Album, ấn phẩm sẽ tự động chuyển về trạng thái{" "}
            <strong>Chờ duyệt (PENDING)</strong> để Quản trị viên kiểm tra lại trước khi tiếp tục phân phối.
          </span>
        </div>

        {/* 1. TÊN ALBUM */}
        <FormField label="Tên Album / Ấn phẩm" required error={errors.title?.message}>
          <Input
            placeholder="Nhập tên album..."
            {...register("title")}
            error={!!errors.title}
            autoFocus
          />
        </FormField>

        {/* 2. LOẠI ẤN PHẨM */}
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

        {/* 4. ẢNH BÌA ALBUM */}
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
                  <span className="text-neutral-400 text-[10px]">JPG, PNG, WEBP</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-500 group-hover:text-neutral-300 p-4 text-center">
                <Disc3 size={28} className="text-neutral-600" />
                <span className="text-xs font-semibold">Click để chọn ảnh bìa mới</span>
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
              <CheckCircle2 size={13} /> Đã chọn ảnh mới: {coverFile.name}
            </p>
          )}
        </div>

        {/* 5. MÔ TẢ ALBUM */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <FileText size={14} className="text-neutral-400" />
            Mô tả Album
          </label>
          <textarea
            rows={3}
            placeholder="Mô tả thông điệp của album..."
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
            <Pencil size={15} />
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAlbumModal;

