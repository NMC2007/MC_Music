import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";
import { useAuthStore } from "#/store/useAuthStore";
import { updateArtistProfileApi } from "#/api/artist";

export const OnboardingProfileModal = ({ isOpen, onClose }) => {
  const { artist, setArtist, setOnboardingDismissed } = useAuthStore();

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file định dạng hình ảnh (.jpg, .png, .webp)");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file định dạng hình ảnh (.jpg, .png, .webp)");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSkip = () => {
    setOnboardingDismissed();
    onClose?.();
    toast.info("Bạn có thể cập nhật ảnh hồ sơ bất cứ lúc nào trong trang Hồ sơ cá nhân.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!avatarFile && !coverFile) {
      handleSkip();
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("stageName", artist?.stageName || "Nghệ sĩ");
      if (artist?.biography) {
        formData.append("biography", artist.biography);
      }
      if (avatarFile) {
        formData.append("avatarFile", avatarFile);
      }
      if (coverFile) {
        formData.append("coverFile", coverFile);
      }

      const res = await updateArtistProfileApi(formData);
      if (res?.data) {
        setArtist(res.data);
      }

      setOnboardingDismissed();
      toast.success("Cập nhật ảnh hồ sơ nghệ sĩ thành công!");
      onClose?.();
    } catch (err) {
      console.error("Lỗi khi cập nhật ảnh hồ sơ:", err);
      toast.error("Không thể cập nhật ảnh hồ sơ", {
        description: err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      title="Chào mừng đến với Studio!"
      description="Bạn có muốn cập nhật ảnh đại diện và ảnh bìa ngay bây giờ để hoàn thiện hồ sơ nghệ sĩ không?"
      maxWidth="max-w-xl"
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {/* Khung Ảnh Bìa (Cover Banner) */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2">
            Ảnh bìa nghệ sĩ (Banner)
          </label>
          <div
            onClick={() => coverInputRef.current?.click()}
            className="group relative w-full h-36 rounded-xl overflow-hidden border border-dashed border-neutral-700 hover:border-neutral-500 bg-[#1e1e1e] cursor-pointer flex flex-col items-center justify-center transition-all"
          >
            {coverPreview ? (
              <>
                <img
                  src={coverPreview}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-semibold transition-opacity">
                  <ImageIcon size={16} /> Thay đổi ảnh bìa
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center p-4 text-neutral-400 group-hover:text-white transition-colors">
                <ImageIcon size={26} className="mb-1 text-neutral-500 group-hover:text-white" />
                <span className="text-xs font-semibold">Tải lên ảnh bìa (Khuyến nghị tỉ lệ 16:9)</span>
                <span className="text-[11px] text-neutral-500 mt-0.5">JPG, PNG hoặc WebP</span>
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
        </div>

        {/* Khung Ảnh Đại Diện (Avatar) */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2">
            Ảnh đại diện (Avatar)
          </label>
          <div className="flex items-center gap-5">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="group relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-neutral-700 hover:border-[#fa2d48] bg-[#1e1e1e] cursor-pointer flex items-center justify-center flex-shrink-0 transition-all shadow-md"
            >
              {avatarPreview ? (
                <>
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Camera size={18} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-neutral-400 group-hover:text-[#fa2d48] transition-colors">
                  <Camera size={22} />
                </div>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="text-xs text-neutral-400 space-y-1">
              <p className="font-semibold text-white">Ảnh chân dung hoặc logo nghệ danh</p>
              <p className="text-[11px] text-neutral-500">
                Hiển thị trên trang cá nhân nghệ sĩ, cạnh tên bài hát và danh sách tìm kiếm.
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Thiết lập sau
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="px-6"
          >
            <Sparkles size={16} /> Lưu và Bắt đầu
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OnboardingProfileModal;
