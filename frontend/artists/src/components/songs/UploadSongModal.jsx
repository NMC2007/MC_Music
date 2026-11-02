import React, { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  Plus,
  Minus,
  FileAudio,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";
import { FormField } from "#/components/ui/FormField";
import { Input } from "#/components/ui/Input";
import { SimpleAudioPlayer } from "#/components/ui/SimpleAudioPlayer";
import { getPublicGenresApi, getMyAlbumsApi, uploadSongApi } from "#/api/catalog";

// ─── VALIDATION SCHEMA ────────────────────────────────────────────────────────
const uploadSchema = z.object({
  title: z
    .string()
    .min(1, "Tên bài hát không được để trống")
    .max(200, "Tên bài hát tối đa 200 ký tự"),
  albumId: z.string().optional(),
  explicit: z.boolean().default(false),
});

// ─── COMPONENT: DROPZONE FILE ────────────────────────────────────────────────
const FileDropzone = ({ label, accept, onFileSelect, file, preview, isAudio, error, hint }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) onFileSelect(dropped);
    },
    [onFileSelect]
  );

  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-neutral-300">
        {label}
        {isAudio && <span className="text-[#fa2d48] ml-1">*</span>}
      </label>

      {/* Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`group relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragging ? "border-[#fa2d48] bg-[#fa2d48]/5 scale-[1.01]" : error ? "border-rose-500/60" : "border-neutral-700 hover:border-neutral-500"}
          ${isAudio ? "h-24" : "h-36"}`}
      >
        {/* Image preview */}
        {!isAudio && preview ? (
          <>
            <img src={preview} alt="cover" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-xl flex flex-col items-center justify-center gap-1 transition-opacity">
              <ImageIcon size={18} className="text-white" />
              <span className="text-white text-xs font-semibold">Thay đổi ảnh</span>
            </div>
          </>
        ) : null}

        {/* Audio selected */}
        {isAudio && file ? (
          <div className="absolute inset-0 flex items-center gap-3 px-4 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-[#fa2d48]/15 text-[#fa2d48] flex items-center justify-center flex-shrink-0">
              <FileAudio size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{file.name}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="text-emerald-400 flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>
        ) : null}

        {/* Empty state */}
        {!file && !preview ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-neutral-500 group-hover:text-neutral-300 transition-colors p-4">
            {isAudio ? (
              <Music size={22} />
            ) : (
              <ImageIcon size={22} />
            )}
            <p className="text-xs font-semibold text-center">
              {isAudio ? "Kéo thả hoặc click chọn file âm thanh" : "Kéo thả hoặc click chọn ảnh bìa"}
            </p>
            {hint && <p className="text-[11px] text-neutral-600 text-center">{hint}</p>}
          </div>
        ) : null}

        {/* Empty image placeholder text */}
        {!isAudio && !preview && !file ? null : null}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
};

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

// ─── COMPONENT: UPLOAD PROGRESS BAR ──────────────────────────────────────────
const UploadProgressBar = ({ progress }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-400 flex items-center gap-1.5">
        <Loader2 size={13} className="animate-spin text-[#fa2d48]" />
        Đang tải lên Cloudinary...
      </span>
      <span className="font-bold text-white">{progress}%</span>
    </div>
    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#fa2d48] to-[#ff6b81] rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

// ─── MAIN MODAL COMPONENT ─────────────────────────────────────────────────────
export const UploadSongModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();

  // Form state
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(uploadSchema) });

  // File state
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [audioError, setAudioError] = useState("");
  const [genreError, setGenreError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Lấy albums của nghệ sĩ để chọn album khi upload
  const { data: albumsRes } = useQuery({
    queryKey: ["myAlbumsForUpload"],
    queryFn: () => getMyAlbumsApi({ page: 0, size: 50 }),
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });
  const albums = albumsRes?.data?.content || [];

  const handleAudioSelect = (file) => {
    const validTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/mp4", "audio/x-m4a", "audio/ogg"];
    if (!validTypes.some((_t) => file.type.startsWith("audio/")) && !file.name.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) {
      toast.error("Định dạng không hỗ trợ", { description: "Vui lòng chọn file MP3, WAV, FLAC hoặc M4A." });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File quá lớn", { description: "Kích thước tệp âm thanh tối đa là 100MB." });
      return;
    }
    setAudioFile(file);
    setAudioError("");
  };

  const handleCoverSelect = (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh (.jpg, .png, .webp)");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleClose = () => {
    if (isUploading) return;
    reset();
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setSelectedGenreIds([]);
    setAudioError("");
    setGenreError("");
    setUploadProgress(0);
    onClose();
  };

  const onSubmit = async (data) => {
    // Validate audio và genre bắt buộc
    let hasError = false;
    if (!audioFile) {
      setAudioError("Bạn chưa chọn file âm thanh");
      hasError = true;
    }
    if (selectedGenreIds.length === 0) {
      setGenreError("Vui lòng chọn ít nhất một thể loại âm nhạc");
      hasError = true;
    }
    if (hasError) return;

    const formData = new FormData();
    formData.append("title", data.title.trim());
    formData.append("audioFile", audioFile);
    if (coverFile) formData.append("coverImage", coverFile);
    if (data.albumId) formData.append("albumId", data.albumId);
    if (data.explicit) formData.append("explicit", "true");
    // genreIds phải được gửi dạng nhiều value cùng key
    selectedGenreIds.forEach((id) => formData.append("genreIds", id));

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadSongApi(formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(pct);
      });

      toast.success("Tải lên thành công!", {
        description: "Bài hát đang chờ Admin kiểm duyệt trước khi công khai.",
      });

      // Làm mới cache danh sách bài hát và dashboard
      queryClient.invalidateQueries({ queryKey: ["mySongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentSongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistDashboard"] });

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Lỗi upload:", err);
      toast.error("Tải lên thất bại", {
        description: err.response?.data?.message || "Vui lòng kiểm tra lại file và thử lại.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tải bài hát mới lên Studio"
      description="Bài hát sẽ ở trạng thái PENDING và chờ Admin kiểm duyệt trước khi phát hành công khai."
      maxWidth="max-w-2xl"
      closeOnOverlayClick={!isUploading}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
        {/* ── PHẦN 1: FILE ÂM THANH & ẢNH BÌA ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* File âm thanh */}
          <div className="space-y-3">
            <FileDropzone
              label="File âm thanh"
              accept="audio/*"
              onFileSelect={handleAudioSelect}
              file={audioFile}
              isAudio
              error={audioError}
              hint="MP3, WAV, FLAC, M4A · Tối đa 100MB"
            />
            {/* Preview nghe thử âm thanh đã chọn */}
            {audioFile && !isUploading && (
              <SimpleAudioPlayer
                src={URL.createObjectURL(audioFile)}
                title={audioFile.name}
              />
            )}
          </div>

          {/* Ảnh bìa */}
          <FileDropzone
            label="Ảnh bìa (tùy chọn)"
            accept="image/*"
            onFileSelect={handleCoverSelect}
            file={coverFile}
            preview={coverPreview}
            isAudio={false}
            hint="JPG, PNG, WebP · Tỉ lệ vuông 1:1"
          />
        </div>

        <div className="border-t border-white/[0.05] pt-5 space-y-4">
          {/* ── PHẦN 2: THÔNG TIN BÀI HÁT ── */}
          <FormField
            label="Tên bài hát"
            error={errors.title?.message}
            required
          >
            <Input
              placeholder="VD: Nơi này có anh, Ơi cô gái..."
              error={!!errors.title}
              {...register("title")}
            />
          </FormField>

          {/* Album & Explicit cùng hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Gán vào Album (tùy chọn)">
              <select
                {...register("albumId")}
                className="w-full bg-[#242424] hover:bg-[#282828] text-white text-sm rounded-xl px-4 py-3 outline-none border border-neutral-700/60 focus:border-white/80 transition-all duration-200 cursor-pointer"
              >
                <option value="">— Đĩa đơn (Single) —</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Nội dung nhạy cảm">
              <label className="flex items-center gap-3 h-[46px] px-4 py-3 bg-[#242424] hover:bg-[#282828] rounded-xl border border-neutral-700/60 cursor-pointer transition-all group">
                <input
                  type="checkbox"
                  {...register("explicit")}
                  className="w-4 h-4 accent-[#fa2d48] rounded cursor-pointer"
                />
                <div>
                  <span className="text-sm text-white font-medium">Gắn nhãn 18+</span>
                  <p className="text-[11px] text-neutral-500">Nội dung cho người lớn</p>
                </div>
              </label>
            </FormField>
          </div>
        </div>

        {/* ── PHẦN 3: THỂ LOẠI ── */}
        <div className="border-t border-white/[0.05] pt-5">
          <GenrePicker
            selectedIds={selectedGenreIds}
            onChange={(ids) => { setSelectedGenreIds(ids); setGenreError(""); }}
            error={genreError}
          />
        </div>

        {/* ── PHẦN 4: PROGRESS BAR (khi đang upload) ── */}
        {isUploading && (
          <div className="border-t border-white/[0.05] pt-4">
            <UploadProgressBar progress={uploadProgress} />
          </div>
        )}

        {/* ── FOOTER: NÚT HÀNH ĐỘNG ── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.05]">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={isUploading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isUploading || isSubmitting}
            className="px-8"
          >
            <UploadCloud size={16} />
            {isUploading ? `Đang tải... ${uploadProgress}%` : "Phát hành bài hát"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadSongModal;
