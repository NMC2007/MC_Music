import React, { useState, useEffect, useRef } from "react";
import { X, ListMusic, Globe, Lock, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { usePlaylists } from "../../hooks/usePlaylists";

/**
 * Modal tạo danh sách phát (Playlist) mới
 * - Tự động focus vào ô Tên playlist khi mở.
 * - Hỗ trợ phím Escape để đóng nhanh.
 * - Kiểm soát trạng thái tạo và loading mượt mà.
 */
export const CreatePlaylistModal = ({ isOpen, onClose, onSuccess }) => {
  const { createPlaylist, isCreating } = usePlaylists();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setIsPublic(true);
      // Auto focus sau khi render
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isCreating) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCreating, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isCreating) return;

    try {
      const res = await createPlaylist({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });

      if (res?.data) {
        onClose();
        if (onSuccess) {
          onSuccess(res.data);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tạo playlist:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop overlay click để đóng */}
      <div
        className="absolute inset-0"
        onClick={() => !isCreating && onClose()}
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-[#242424] border border-neutral-700/70 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#1f1f1f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fa2d48]/15 text-[#fa2d48] flex items-center justify-center">
              <ListMusic size={18} />
            </div>
            <h3 className="text-base font-bold text-white">Tạo danh sách phát</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="p-1 rounded-full text-spotify-sub hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Tên Playlist */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="playlist-name"
              className="text-xs font-semibold text-neutral-300 uppercase tracking-wider"
            >
              Tên danh sách phát <span className="text-[#fa2d48]">*</span>
            </label>
            <input
              id="playlist-name"
              ref={inputRef}
              type="text"
              required
              disabled={isCreating}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nhạc chill đêm muộn, My Favorites..."
              className="w-full px-4 py-2.5 rounded-lg bg-[#181818] border border-neutral-700/80 text-white placeholder-neutral-500 text-sm outline-none focus:border-[#fa2d48] focus:ring-1 focus:ring-[#fa2d48] transition-all"
            />
          </div>

          {/* Mô tả Playlist */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="playlist-desc"
              className="text-xs font-semibold text-neutral-300 uppercase tracking-wider"
            >
              Mô tả
            </label>
            <textarea
              id="playlist-desc"
              rows={3}
              disabled={isCreating}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thêm mô tả cho danh sách phát của bạn (không bắt buộc)..."
              className="w-full px-4 py-2.5 rounded-lg bg-[#181818] border border-neutral-700/80 text-white placeholder-neutral-500 text-sm outline-none focus:border-[#fa2d48] focus:ring-1 focus:ring-[#fa2d48] transition-all resize-none"
            />
          </div>

          {/* Quyền riêng tư (isPublic) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1c1c1c] border border-neutral-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isPublic ? "bg-emerald-500/15 text-emerald-400" : "bg-neutral-700/40 text-neutral-400"
                }`}
              >
                {isPublic ? <Globe size={16} /> : <Lock size={16} />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  {isPublic ? "Công khai" : "Riêng tư"}
                </span>
                <span className="text-xs text-spotify-sub">
                  {isPublic
                    ? "Mọi người đều có thể nghe danh sách này"
                    : "Chỉ mình bạn có thể truy cập danh sách này"}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isCreating}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fa2d48]" />
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isCreating}
              onClick={onClose}
              className="text-neutral-300 hover:text-white"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!name.trim() || isCreating}
              className="min-w-[100px]"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1" />
                  Đang tạo...
                </>
              ) : (
                "Tạo mới"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
