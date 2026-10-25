import React, { useState, useEffect, useRef } from "react";
import { X, Globe, Lock, Loader2, Music2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { usePlaylists } from "../../hooks/usePlaylists";

/**
 * Component Modal dùng chung cho cả Tạo Playlist và Sửa thông tin chi tiết Playlist
 * - Giao diện 2 cột chuẩn phong cách Spotify:
 *   + Cột trái: Ảnh bìa vuông 180x180, hỗ trợ xem trước và upload ảnh lên Cloudinary
 *   + Cột phải: Ô nhập tên playlist & ô nhập mô tả
 *   + Chân trang: Nút toggle chế độ Riêng tư / Công khai, điều khoản bản quyền và nút hành động Primary (#fa2d48)
 * - Tối ưu hóa UI/UX:
 *   + Ở chế độ Create: Nếu người dùng không nhập gì mà bấm Tạo, mặc định đặt tên là "Playlist # số thứ tự"
 *   + Ở chế độ Edit: Nếu người dùng không thay đổi bất kỳ thông tin nào mà bấm Lưu, đóng modal ngay mà không gửi API request
 */
export const PlaylistFormModal = ({
  isOpen,
  onClose,
  mode = "create", // "create" | "edit"
  playlist = null,
  onSuccess,
}) => {
  const {
    playlists,
    createPlaylist,
    updatePlaylist,
    isCreating,
    isUpdating,
  } = usePlaylists();

  const isEditMode = mode === "edit";
  const isSubmitting = isEditMode ? isUpdating : isCreating;

  // Tính số thứ tự cho tên playlist mặc định khi tạo mới
  const nextIndex = (playlists?.length || 0) + 1;
  const defaultPlaylistName = `Playlist #${nextIndex}`;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Khởi tạo state khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && playlist) {
        setName(playlist.name || "");
        setDescription(playlist.description || "");
        setIsPublic(Boolean(playlist.isPublic));
        setCoverFile(null);
        setCoverPreview(playlist.coverImage || null);
      } else {
        // Chế độ Create
        setName("");
        setDescription("");
        setIsPublic(false);
        setCoverFile(null);
        setCoverPreview(null);
      }

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isEditMode, playlist]);

  // Giải phóng URL blob khi đổi ảnh hoặc unmount
  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  // Hỗ trợ phím Escape để đóng nhanh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type.toLowerCase())) {
        toast.error("Chỉ chấp nhận file ảnh JPG, JPEG hoặc PNG");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Dung lượng ảnh không được vượt quá 5MB");
        return;
      }
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isEditMode) {
      // ── LOGIC CHỈNH SỬA PLAYLIST ──────────────────────────────────────
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error("Tên danh sách phát không được để trống");
        return;
      }

      const initialName = (playlist?.name || "").trim();
      const initialDesc = (playlist?.description || "").trim();
      const initialIsPublic = Boolean(playlist?.isPublic);

      const isNameChanged = trimmedName !== initialName;
      const isDescChanged = description.trim() !== initialDesc;
      const isPublicChanged = isPublic !== initialIsPublic;
      const isCoverChanged = Boolean(coverFile);

      // Nếu không thay đổi gì mà bấm Lưu thì đóng modal ngay mà không gửi request
      const hasAnyChange = isNameChanged || isDescChanged || isPublicChanged || isCoverChanged;
      if (!hasAnyChange) {
        onClose();
        return;
      }

      try {
        const formData = new FormData();
        if (isNameChanged) {
          formData.append("name", trimmedName);
        }
        if (isDescChanged) {
          formData.append("description", description.trim());
        }
        if (isPublicChanged) {
          formData.append("isPublic", isPublic);
        }
        if (isCoverChanged) {
          formData.append("coverFile", coverFile);
        }

        const res = await updatePlaylist({
          playlistId: playlist.id,
          data: formData,
        });

        if (res?.data) {
          onClose();
          if (onSuccess) {
            onSuccess(res.data);
          }
        }
      } catch (err) {
        console.error("Lỗi khi cập nhật playlist:", err);
      }
    } else {
      // ── LOGIC TẠO PLAYLIST MỚI ───────────────────────────────────────
      // Nếu người dùng không nhập gì thì mặc định đặt tên là "Playlist # số thứ tự"
      const finalName = name.trim() || defaultPlaylistName;

      try {
        const formData = new FormData();
        formData.append("name", finalName);
        if (description.trim()) {
          formData.append("description", description.trim());
        }
        formData.append("isPublic", isPublic);
        if (coverFile) {
          formData.append("coverFile", coverFile);
        }

        const res = await createPlaylist(formData);

        if (res?.data) {
          onClose();
          if (onSuccess) {
            onSuccess(res.data);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tạo playlist:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-[560px] bg-[#282828] text-white rounded-xl shadow-2xl border border-neutral-700/60 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isEditMode ? "Sửa thông tin chi tiết" : "Tạo Playlist"}
          </h2>
          <button
            type="button"
            onClick={() => !isSubmitting && onClose()}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-5">
          {/* 2 Cột: Bên trái là Ảnh bìa, bên phải là Tên + Mô tả */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Cột trái: Ảnh bìa vuông */}
            <div className="flex flex-col items-center sm:items-start w-full sm:w-[180px] flex-shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="hidden"
              />

              <div
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className="relative w-40 h-40 sm:w-[180px] sm:h-[180px] bg-[#1f1f1f] rounded-lg overflow-hidden group cursor-pointer border border-neutral-700 shadow-md flex items-center justify-center"
                title="Chọn ảnh"
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Playlist Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-neutral-500">
                    <Music2 size={64} strokeWidth={1.5} />
                  </div>
                )}

                {/* Hover overlay với nút chọn ảnh */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-2 text-center">
                  <Pencil size={24} className="text-white drop-shadow" />
                  <span className="text-xs font-semibold text-white drop-shadow">
                    Chọn ảnh
                  </span>
                </div>
              </div>
            </div>

            {/* Cột phải: Tên playlist & Mô tả */}
            <div className="flex flex-col gap-3 w-full flex-1">
              {/* Tên Playlist */}
              <div className="flex flex-col gap-1">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isEditMode ? "Thêm tên" : defaultPlaylistName}
                  disabled={isSubmitting}
                  className="w-full bg-[#3e3e3e]/70 hover:bg-[#3e3e3e] focus:bg-[#333333] text-white placeholder-neutral-400 text-sm font-semibold rounded-md px-3.5 py-3 outline-none border border-neutral-600 focus:border-white transition-all shadow-inner"
                />
              </div>

              {/* Mô tả */}
              <div className="flex flex-col gap-1 flex-1">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Thêm phần mô tả không bắt buộc"
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full h-28 sm:h-[114px] resize-none bg-[#3e3e3e]/70 hover:bg-[#3e3e3e] focus:bg-[#333333] text-white placeholder-neutral-400 text-sm rounded-md px-3.5 py-2.5 outline-none border border-neutral-600 focus:border-white transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Dòng điều khoản Spotify */}
          <p className="text-[11px] text-neutral-400 leading-relaxed select-none">
            Bằng cách tiếp tục, bạn đồng ý cho phép MC Music truy cập vào hình ảnh bạn đã chọn để tải lên. Vui lòng đảm bảo bạn có quyền tải lên hình ảnh.
          </p>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-between pt-1">
            {/* Nút Toggle trạng thái riêng tư / công khai */}
            <button
              type="button"
              onClick={() => setIsPublic((prev) => !prev)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-neutral-600 hover:border-white text-xs font-semibold text-white hover:bg-neutral-800 transition-all cursor-pointer"
            >
              {isPublic ? (
                <>
                  <Globe size={14} className="text-emerald-400" />
                  <span>Đặt thành công khai</span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-neutral-300" />
                  <span>Đặt thành riêng tư</span>
                </>
              )}
            </button>

            {/* Nút Submit (Lưu / Tạo) với variant="primary" (Màu đỏ neon #fa2d48) */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || (isEditMode && !name.trim())}
              className="px-8 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isEditMode ? "Đang lưu..." : "Đang tạo..."}</span>
                </>
              ) : (
                <span>{isEditMode ? "Lưu" : "Tạo"}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
