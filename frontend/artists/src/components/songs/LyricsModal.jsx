import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Globe } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";
import { FormField, Textarea } from "#/components/ui/FormField";
import { CoverImage } from "#/components/ui/CoverImage";
import { updateLyricsApi, getSongLyricsApi } from "#/api/catalog";

// ─── VALIDATION ───────────────────────────────────────────────────────────────
const lyricsSchema = z.object({
  content: z
    .string()
    .min(1, "Lời bài hát không được để trống")
    .max(20000, "Lời bài hát tối đa 20.000 ký tự"),
  language: z.string().optional(),
});

const LANGUAGE_OPTIONS = [
  { value: "vi", label: "🇻🇳 Tiếng Việt" },
  { value: "en", label: "🇺🇸 English" },
  { value: "ko", label: "🇰🇷 한국어" },
  { value: "ja", label: "🇯🇵 日本語" },
  { value: "zh", label: "🇨🇳 中文" },
  { value: "other", label: "🌐 Ngôn ngữ khác" },
];

// ─── MAIN MODAL COMPONENT ─────────────────────────────────────────────────────
export const LyricsModal = ({ isOpen, onClose, song }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(lyricsSchema),
    defaultValues: { content: "", language: "vi" },
  });

  const contentValue = watch("content");
  const charCount = contentValue?.length || 0;

  // Tải lời bài hát hiện có (nếu đã có)
  const { data: lyricsRes, isLoading: isLoadingLyrics } = useQuery({
    queryKey: ["songLyrics", song?.id],
    queryFn: () => getSongLyricsApi(song.id),
    enabled: isOpen && !!song?.id,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Đổ dữ liệu lời bài hát vào form khi tải xong
  useEffect(() => {
    if (lyricsRes?.data) {
      setValue("content", lyricsRes.data.content || "");
      setValue("language", lyricsRes.data.language || "vi");
    } else {
      setValue("content", "");
      setValue("language", "vi");
    }
  }, [lyricsRes, setValue]);

  // Reset form khi đóng/mở modal với bài hát khác
  useEffect(() => {
    if (!isOpen) {
      reset({ content: "", language: "vi" });
    }
  }, [isOpen, reset]);

  // Mutation cập nhật lời bài hát
  const mutation = useMutation({
    mutationFn: (data) => updateLyricsApi(song.id, data),
    onSuccess: () => {
      toast.success("Cập nhật lời bài hát thành công!");
      queryClient.invalidateQueries({ queryKey: ["songLyrics", song?.id] });
      onClose();
    },
    onError: (err) => {
      toast.error("Cập nhật thất bại", {
        description: err.response?.data?.message || "Vui lòng thử lại.",
      });
    },
  });

  const onSubmit = (data) => {
    mutation.mutate({ content: data.content, language: data.language });
  };

  if (!song) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cập nhật lời bài hát"
      description={`Nhập lời đầy đủ cho bài "${song.title}". Mỗi dòng tương ứng một câu nhạc.`}
      maxWidth="max-w-2xl"
    >
      {/* Thông tin bài hát */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-5">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
          <CoverImage
            src={song.coverImage}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm truncate">{song.title}</p>
          <p className="text-xs text-neutral-400 truncate mt-0.5">{song.ownerName}</p>
        </div>
        {lyricsRes?.data && (
          <span className="ml-auto flex-shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold">
            Đã có lời
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Ngôn ngữ */}
        <FormField label="Ngôn ngữ lời bài hát">
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((lang) => (
              <label key={lang.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={lang.value}
                  {...register("language")}
                  className="hidden peer"
                />
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none
                  border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white
                  peer-checked:border-[#fa2d48] peer-checked:text-white peer-checked:bg-[#fa2d48]/10">
                  {lang.label}
                </span>
              </label>
            ))}
          </div>
        </FormField>

        {/* Textarea lời bài hát */}
        <FormField
          label="Lời bài hát"
          error={errors.content?.message}
          required
        >
          {isLoadingLyrics ? (
            <div className="h-52 bg-neutral-800/60 rounded-xl animate-pulse" />
          ) : (
            <Textarea
              placeholder={"VD:\n[Verse 1]\nNơi này có anh, có những ngày tháng cũ...\n\n[Chorus]\nEm ơi, hãy quay trở về..."}
              rows={10}
              error={!!errors.content}
              {...register("content")}
            />
          )}
        </FormField>

        {/* Bộ đếm ký tự */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <FileText size={13} />
            <span>Mỗi dòng tương ứng một câu nhạc. Có thể thêm [Verse], [Chorus], [Bridge]...</span>
          </div>
          <span className={`text-xs font-mono tabular-nums ${charCount > 18000 ? "text-amber-400" : "text-neutral-500"}`}>
            {charCount.toLocaleString()} / 20.000
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.05]">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={mutation.isPending}
            disabled={!isDirty && !!lyricsRes?.data}
            className="px-8"
          >
            <Globe size={16} />
            Lưu lời bài hát
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LyricsModal;
