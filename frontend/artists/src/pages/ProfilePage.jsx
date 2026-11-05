import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  Camera,
  Mail,
  Save,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  FileText,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "#/store/useAuthStore";
import { getArtistProfileApi, updateArtistProfileApi } from "#/api/artist";
import { Button } from "#/components/ui/Button";
import { formatNumber } from "#/utils/formatters";

// ─── VALIDATION SCHEMA ────────────────────────────────────────────────────────
const profileSchema = z.object({
  stageName: z
    .string()
    .min(1, "Nghệ danh không được để trống")
    .max(100, "Nghệ danh tối đa 100 ký tự"),
  biography: z
    .string()
    .max(1000, "Tiểu sử tối đa 1000 ký tự")
    .optional(),
});

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { artist, setArtist } = useAuthStore();

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // File state & preview
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // ── FETCH THÔNG TIN PROFILE MỚI NHẤT TỪ BACKEND ──
  const { data: profileRes } = useQuery({
    queryKey: ["artistProfile"],
    queryFn: getArtistProfileApi,
    staleTime: 1000 * 60 * 5,
  });

  const currentArtist = profileRes?.data || artist;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      stageName: "",
      biography: "",
    },
  });

  const bioValue = watch("biography") || "";

  // Đồng bộ thông tin vào form khi tải xong
  useEffect(() => {
    if (currentArtist) {
      setValue("stageName", currentArtist.stageName || "");
      setValue("biography", currentArtist.biography || "");
      setAvatarPreview(currentArtist.avatarUrl || null);
      setCoverPreview(currentArtist.coverUrl || null);
      setAvatarFile(null);
      setCoverFile(null);
    }
  }, [currentArtist, setValue]);

  // ── XỬ LÝ CHỌN FILE AVATAR ──
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file định dạng hình ảnh (.jpg, .png, .webp)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Kích thước ảnh đại diện tối đa là 10MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      toast.info("Đã chọn ảnh đại diện mới. Bấm 'Lưu thay đổi' để áp dụng.");
    }
  };

  // ── XỬ LÝ CHỌN FILE COVER ──
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file định dạng hình ảnh (.jpg, .png, .webp)");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error("Kích thước ảnh bìa tối đa là 15MB");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      toast.info("Đã chọn ảnh bìa mới. Bấm 'Lưu thay đổi' để áp dụng.");
    }
  };

  // ── RESET FORM VỀ DỮ LIỆU BAN ĐẦU ──
  const handleReset = () => {
    if (currentArtist) {
      setValue("stageName", currentArtist.stageName || "");
      setValue("biography", currentArtist.biography || "");
      setAvatarPreview(currentArtist.avatarUrl || null);
      setCoverPreview(currentArtist.coverUrl || null);
      setAvatarFile(null);
      setCoverFile(null);
    }
  };

  // ── COPY ARTIST ID ──
  const handleCopyId = () => {
    const id = currentArtist?.id || currentArtist?.artistId;
    if (id) {
      navigator.clipboard.writeText(id);
      setHasCopiedId(true);
      toast.success("Đã sao chép mã định danh nghệ sĩ!");
      setTimeout(() => setHasCopiedId(false), 2000);
    }
  };

  // ── SUBMIT UPDATE PROFILE ──
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("stageName", data.stageName.trim());
      formData.append("biography", data.biography?.trim() || "");

      if (avatarFile) {
        formData.append("avatarFile", avatarFile);
      }
      if (coverFile) {
        formData.append("coverFile", coverFile);
      }

      const res = await updateArtistProfileApi(formData);

      if (res?.data) {
        // Cập nhật Zustand Store để Topbar & Sidebar đổi ngay lập tức
        setArtist(res.data);
      }

      toast.success("Cập nhật hồ sơ nghệ sĩ thành công!", {
        description: "Thông tin định danh và hình ảnh nhận diện đã được lưu.",
      });

      // Làm mới cache queries
      queryClient.invalidateQueries({ queryKey: ["artistProfile"] });
      queryClient.invalidateQueries({ queryKey: ["artistDashboard"] });

      setAvatarFile(null);
      setCoverFile(null);
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      toast.error("Cập nhật thất bại", {
        description:
          err.response?.data?.message || "Vui lòng kiểm tra lại thông tin.",
      });
    }
  };

  const hasChanges = isDirty || avatarFile !== null || coverFile !== null;

  return (
    <div className="space-y-8 w-full pb-16">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <UserCheck size={24} className="text-[#fa2d48]" /> Hồ sơ Nghệ sĩ
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Quản lý thông tin định danh, nghệ danh, tiểu sử và hình ảnh đại diện thương hiệu của bạn trên MC Music.
        </p>
      </div>

      {/* ── HERO BANNER & AVATAR TƯƠNG TÁC TRỰC TIẾP ── */}
      <div className="rounded-3xl overflow-hidden bg-[#181818] shadow-2xl border border-white/[0.04]">
        {/* Banner Cover */}
        <div className="h-48 sm:h-64 w-full relative group bg-neutral-900 overflow-hidden">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover Art"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#200d14] via-[#160a0f] to-[#121212]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Nút đổi ảnh bìa đè lên Banner */}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 px-3.5 py-2 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 border border-white/10 transition-all cursor-pointer shadow-lg hover:scale-105"
          >
            <Camera size={14} className="text-[#fa2d48]" />
            <span>Thay đổi ảnh bìa</span>
          </button>

          {coverFile && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 shadow-md">
              <CheckCircle2 size={13} />
              <span>Đã chọn ảnh bìa mới ({coverFile.name})</span>
            </div>
          )}

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>

        {/* Thông tin Avatar & Tên Nghệ sĩ */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar tròn lớn */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-spotify-base shadow-2xl flex-shrink-0 bg-neutral-800 relative group cursor-pointer"
              title="Click để thay đổi ảnh đại diện"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={currentArtist?.stageName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                  <User size={48} />
                </div>
              )}

              {/* Hover overlay đổi Avatar */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity">
                <Camera size={20} className="text-[#fa2d48]" />
                <span className="text-[10px] font-bold">Đổi Avatar</span>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Thông tin Nghệ danh & Pill trạng thái */}
            <div className="space-y-1.5 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fa2d48]/15 text-[#fa2d48] text-[11px] font-bold">
                  <ShieldCheck size={12} /> Nghệ sĩ đã xác minh
                </span>
                <span className="text-xs text-neutral-400">
                  {formatNumber(currentArtist?.followerCount || 0)} người theo dõi
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentArtist?.stageName || "Nghệ sĩ"}
              </h2>

              <p className="text-xs text-neutral-400 flex items-center gap-2">
                <Mail size={13} className="text-neutral-500" />
                <span>{currentArtist?.email}</span>
              </p>
            </div>
          </div>

          {/* Nút kích hoạt đổi ảnh trực tiếp */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="dark"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
              className="bg-white/10 hover:bg-white/20 text-xs"
            >
              <Camera size={14} /> Thay ảnh Avatar
            </Button>
          </div>
        </div>
      </div>

      {/* ── FORM CHỈNH SỬA THÔNG TIN CHI TIẾT ── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-6 sm:p-8 rounded-3xl bg-[#181818] border border-white/[0.04] shadow-xl space-y-6"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={17} className="text-[#fa2d48]" /> Thông tin định danh thương hiệu
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Cập nhật nghệ danh chính thức và lời tự bạch gửi tới người hâm mộ
            </p>
          </div>

          {hasChanges && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-bold animate-pulse">
              Có thay đổi chưa lưu
            </span>
          )}
        </div>

        {/* 1. NGHỆ DANH */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300">
            Nghệ danh chính thức <span className="text-[#fa2d48]">*</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Sơn Tùng M-TP, Đen Vâu, Vũ..."
            {...register("stageName")}
            className="w-full bg-[#202020] hover:bg-[#252525] focus:bg-[#252525] text-white text-sm rounded-xl px-4 py-3 outline-none border border-neutral-700/60 focus:border-white/80 transition-all font-medium"
          />
          {errors.stageName && (
            <p className="text-xs text-rose-400 font-medium">
              {errors.stageName.message}
            </p>
          )}
          <p className="text-[11px] text-neutral-500">
            Tên này sẽ xuất hiện trên tất cả các tác phẩm, bài hát, album và thanh tìm kiếm của người nghe nhạc.
          </p>
        </div>

        {/* 2. TIỂU SỬ NGHỆ SĨ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <FileText size={14} className="text-neutral-400" />
              Tiểu sử nghệ sĩ (Biography)
            </label>
            <span
              className={`text-[11px] font-mono ${
                bioValue.length > 900 ? "text-amber-400" : "text-neutral-500"
              }`}
            >
              {bioValue.length} / 1000 ký tự
            </span>
          </div>
          <textarea
            rows={5}
            placeholder="Chia sẻ về phong cách âm nhạc, hành trình sáng tác, các giải thưởng hoặc thông điệp nghệ thuật gửi đến khán giả..."
            {...register("biography")}
            className="w-full bg-[#202020] hover:bg-[#252525] focus:bg-[#252525] text-white placeholder-neutral-500 text-xs rounded-xl p-4 outline-none border border-neutral-700/60 focus:border-white/80 transition-all resize-none scrollbar-thin leading-relaxed"
          />
          {errors.biography && (
            <p className="text-xs text-rose-400 font-medium">
              {errors.biography.message}
            </p>
          )}
        </div>

        {/* 3. THÔNG TIN HỆ THỐNG (CHỈ ĐỌC) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.05]">
          {/* Email tài khoản */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-white/[0.03] space-y-1">
            <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider block">
              Email đăng nhập (Cố định)
            </span>
            <p className="text-sm font-mono text-neutral-300 truncate">
              {currentArtist?.email}
            </p>
            <p className="text-[10px] text-neutral-600">
              Email định danh cho tài khoản Nghệ sĩ tại MC Music
            </p>
          </div>

          {/* Mã định danh Artist UUID */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-white/[0.03] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider block">
                Mã định danh Nghệ sĩ (UUID)
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Sao chép ID"
              >
                {hasCopiedId ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            <p className="text-xs font-mono text-neutral-400 truncate">
              {currentArtist?.id || currentArtist?.artistId || "Đang tải..."}
            </p>
            <p className="text-[10px] text-neutral-600">
              Dùng khi liên kết hợp tác hoặc kiểm tra kỹ thuật
            </p>
          </div>
        </div>

        {/* 4. FOOTER FORM ACTIONS */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={!hasChanges || isSubmitting}
            onClick={handleReset}
            className="text-neutral-400 hover:text-white"
          >
            <RotateCcw size={15} />
            Hủy thay đổi
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!hasChanges}
            isLoading={isSubmitting}
            className="px-8 shadow-[0_4px_20px_rgba(250,45,72,0.4)]"
          >
            <Save size={16} />
            Lưu thay đổi hồ sơ
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
