import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Disc3,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";
import { FormField } from "#/components/ui/FormField";
import { Input } from "#/components/ui/Input";
import { getPublicGenresApi, getMyAlbumsApi, updateSongApi } from "#/api/catalog";

// ─── VALIDATION SCHEMA ────────────────────────────────────────────────────────
const editSchema = z.object({
  title: z
    .string()
    .min(1, "Tên bài hát không được để trống")
    .max(200, "Tên bài hát tối đa 200 ký tự"),
  albumId: z.string().optional(),
  explicit: z.boolean().default(false),
});

// ─── COMPONENT: GENRE PICKER ─────────────────────────────────────────────────
const GenrePicker = ({ selectedIds, onChange, error }) => {
  const { data: genresRes, isLoading } = useQuery({
    queryKey: ["publicGenres"],
    queryFn: getPublicGenresApi,
    staleTime: 1000 * 60 * 30,
  });

  const genres = genresRes?.data || [];

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((g) => g !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-16 rounded-full bg-neutral-800/70 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-neutral-300">
        Thể loại âm nhạc <span className="text-[#fa2d48]">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {genres.map((g) => {
          const selected = selectedIds.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(g.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                selected
                  ? "bg-[#fa2d48] text-white shadow-[0_2px_10px_rgba(250,45,72,0.4)]"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {selected ? <Minus size={11} /> : <Plus size={11} />}
              {g.name}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
};

// ─── MAIN MODAL COMPONENT ─────────────────────────────────────────────────────
export const EditSongModal = ({ isOpen, onClose, song, onSuccess }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [genreError, setGenreError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
  });

  // Tải danh sách album của nghệ sĩ để chọn
  const { data: albumsRes } = useQuery({
    queryKey: ["myAlbumsForEdit"],
    queryFn: () => getMyAlbumsApi({ page: 0, size: 50, isDeleted: false }),
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });
  const albums = albumsRes?.data?.content || [];

  // Đồng bộ thông tin bài hát vào form khi mở modal
  useEffect(() => {
    if (song && isOpen) {
      setValue("title", song.title || "");
      setValue("albumId", song.albumId || "");
      setValue("explicit", Boolean(song.explicit));
      setSelectedGenreIds(song.genres?.map((g) => g.id) || []);
      setCoverPreview(song.coverImage || null);
      setCoverFile(null);
      setGenreError("");
    }
  }, [song, isOpen, setValue]);

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
    setSelectedGenreIds([]);
    setGenreError("");
    onClose();
  };

  const onSubmit = async (data) => {
    if (selectedGenreIds.length === 0) {
      setGenreError("Vui lòng chọn ít nhất một thể loại âm nhạc");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", data.title.trim());

      if (coverFile) {
        formData.append("coverImage", coverFile);
      }

      selectedGenreIds.forEach((id) => {
        formData.append("genreIds", id);
      });

      // Xử lý chuyển/gỡ album
      const currentAlbumId = song.albumId || "";
      const newAlbumId = data.albumId || "";

      if (currentAlbumId && !newAlbumId) {
        // Tách bài hát khỏi album thành Single
        formData.append("clearAlbum", "true");
      } else if (newAlbumId && newAlbumId !== currentAlbumId) {
        // Chuyển sang album khác
        formData.append("albumId", newAlbumId);
      }

      formData.append("explicit", data.explicit ? "true" : "false");

      await updateSongApi(song.id, formData);

      toast.success("Cập nhật bài hát thành công!", {
        description: "Bài hát đã chuyển về trạng thái Chờ duyệt (PENDING) để kiểm tra lại.",
      });

      queryClient.invalidateQueries({ queryKey: ["mySongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentSongs"] });
      queryClient.invalidateQueries({ queryKey: ["myAlbums"] });

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Lỗi khi cập nhật bài hát:", err);
      toast.error("Cập nhật thất bại", {
        description: err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    }
  };

  if (!song) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Chỉnh sửa bài hát"
      description="Cập nhật thông tin, thể loại hoặc ảnh bìa cho tác phẩm."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
        {/* CẢNH BÁO: CHUYỂN VỀ PENDING */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
          <AlertCircle size={17} className="flex-shrink-0 mt-0.5 text-amber-400" />
          <span>
            <strong>Lưu ý:</strong> Khi lưu chỉnh sửa, bài hát sẽ tự động chuyển trạng thái về{" "}
            <strong>Chờ duyệt (PENDING)</strong> để Quản trị viên kiểm tra lại trước khi tiếp tục phát hành.
          </span>
        </div>

        {/* 1. TÊN BÀI HÁT */}
        <FormField label="Tên bài hát" required error={errors.title?.message}>
          <Input
            placeholder="Nhập tên bài hát..."
            {...register("title")}
            error={!!errors.title}
            autoFocus
          />
        </FormField>

        {/* 2. ẢNH BÌA BÀI HÁT (COVER) */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Ảnh bìa bài hát
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-36 rounded-xl border-2 border-dashed border-neutral-700 hover:border-neutral-500 overflow-hidden cursor-pointer transition-all bg-[#1a1a1a]"
          >
            {coverPreview ? (
              <>
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                  <ImageIcon size={20} className="text-white" />
                  <span className="text-white text-xs font-bold">Thay đổi ảnh bìa</span>
                  <span className="text-neutral-400 text-[10px]">JPG, PNG, WEBP tối đa 10MB</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1.5 text-neutral-500 group-hover:text-neutral-300">
                <ImageIcon size={22} />
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

        {/* 3. THỂ LOẠI ÂM NHẠC */}
        <GenrePicker
          selectedIds={selectedGenreIds}
          onChange={(ids) => {
            setSelectedGenreIds(ids);
            if (ids.length > 0) setGenreError("");
          }}
          error={genreError}
        />

        {/* 4. CHỌN ALBUM / TÁCH SINGLE */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Disc3 size={14} className="text-neutral-400" />
            Bộ sưu tập / Album
          </label>
          <select
            {...register("albumId")}
            className="w-full bg-[#1e1e1e] hover:bg-[#242424] focus:bg-[#242424] text-white text-sm rounded-xl px-4 py-3 outline-none border border-neutral-700/60 focus:border-white/80 transition-all cursor-pointer"
          >
            <option value="">Không thuộc Album (Đĩa đơn Single độc lập)</option>
            {albums.map((alb) => (
              <option key={alb.id} value={alb.id}>
                {alb.title} ({alb.albumType || "ALBUM"} - {alb.totalTracks || 0} bài)
              </option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-500">
            Chọn album để gộp bài hát này vào, hoặc chọn Single để tách bài ra khỏi album.
          </p>
        </div>

        {/* 5. CỜ NỘI DUNG NHẠY CẢM (EXPLICIT) */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <input
            type="checkbox"
            id="explicit-edit-checkbox"
            {...register("explicit")}
            className="w-4 h-4 rounded accent-[#fa2d48] cursor-pointer"
          />
          <label htmlFor="explicit-edit-checkbox" className="text-xs text-neutral-300 cursor-pointer select-none">
            <span className="font-bold text-white block">Nội dung nhạy cảm (Explicit / 18+)</span>
            Đánh dấu bài hát có chứa ngôn từ hoặc nội dung dành cho người trưởng thành
          </label>
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

export default EditSongModal;

