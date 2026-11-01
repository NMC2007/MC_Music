import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router";
import { Music2, Mail, Lock, Eye, EyeOff, User, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { registerApi } from "#/api/auth";
import { useAuthStore } from "#/store/useAuthStore";
import { Button } from "#/components/ui/Button";

const registerSchema = z
  .object({
    stageName: z
      .string()
      .min(1, { message: "Nghệ danh không được để trống" })
      .max(100, { message: "Nghệ danh tối đa 100 ký tự" }),
    email: z
      .string()
      .min(1, { message: "Email không được để trống" })
      .email({ message: "Email không đúng định dạng" }),
    password: z
      .string()
      .min(6, { message: "Mật khẩu phải từ 6 ký tự trở lên" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Vui lòng xác nhận lại mật khẩu" }),
    biography: z
      .string()
      .max(1000, { message: "Tiểu sử không vượt quá 1000 ký tự" })
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await registerApi({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        stageName: data.stageName.trim(),
        biography: data.biography?.trim() || "",
      });

      if (response?.data) {
        // Backend tự động trả về JWT token ngay khi đăng ký thành công
        login(response.data);
        toast.success("Tạo tài khoản nghệ sĩ thành công!", {
          description: `Chào mừng ${data.stageName} gia nhập MC Music Studio!`,
        });
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      const serverMessage =
        err.response?.data?.message ||
        "Đăng ký thất bại. Email có thể đã được sử dụng ở domain Nghệ sĩ.";
      toast.error("Đăng ký thất bại", {
        description: serverMessage,
      });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0a0a0a] text-white">
      {/* ── CỘT TRÁI: HERO BRANDING ── */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-[#1a080d] via-[#100d0e] to-[#0a0a0a] border-r border-neutral-900">
        <div className="absolute w-[480px] h-[480px] bg-[#fa2d48]/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-13 h-13 rounded-2xl bg-[#fa2d48] flex items-center justify-center shadow-[0_0_30px_rgba(250,45,72,0.45)]">
              <Music2 size={30} className="text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black text-white tracking-wider block">
                MC MUSIC
              </span>
              <span className="text-xs uppercase tracking-[0.25em] text-[#fa2d48] font-bold">
                Artist Studio
              </span>
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-black text-white text-center leading-[1.15] mb-6 tracking-tight">
            Khởi đầu hành trình <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa2d48] to-[#ff6b81]">
              sáng tạo âm nhạc.
            </span>
          </h2>

          <p className="text-spotify-sub text-center text-sm sm:text-base leading-relaxed max-w-md mb-8">
            Đăng ký nghệ danh độc lập để tải lên các ca khúc của bạn, tạo album đầu tay và tiếp cận hàng ngàn người yêu âm nhạc mỗi ngày.
          </p>

          {/* Cam kết / Ưu điểm */}
          <div className="space-y-3.5 text-left w-full max-w-sm pt-4 border-t border-neutral-850">
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <CheckCircle2 size={18} className="text-[#fa2d48] flex-shrink-0" />
              <span>Độc lập tài khoản, dùng chung email được với User</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <CheckCircle2 size={18} className="text-[#fa2d48] flex-shrink-0" />
              <span>Upload audio chất lượng cao lên Cloudinary</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <CheckCircle2 size={18} className="text-[#fa2d48] flex-shrink-0" />
              <span>Theo dõi lượt nghe và yêu thích bài hát</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CỘT PHẢI: FORM ĐĂNG KÝ ── */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10 max-w-lg mx-auto w-full relative">
        {/* Mobile Brand Header */}
        <div className="flex lg:hidden items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#fa2d48] flex items-center justify-center shadow-lg">
            <Music2 size={22} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-wide block">
              MC Music
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#fa2d48] font-bold">
              Artist Studio
            </span>
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white mb-2">Đăng ký Nghệ sĩ</h1>
          <p className="text-spotify-sub text-sm">
            Đã có tài khoản Studio?{" "}
            <Link
              to="/login"
              className="text-[#fa2d48] font-bold hover:underline transition-colors ml-1"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Form đăng ký */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nghệ danh */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Nghệ danh (Stage Name) <span className="text-[#fa2d48]">*</span>
            </label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-3.5 text-neutral-500" />
              <input
                {...register("stageName")}
                type="text"
                placeholder="VD: Vũ., Sơn Tùng M-TP, Đen..."
                className={`w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none border transition-all ${
                  errors.stageName
                    ? "border-rose-500 focus:border-rose-500"
                    : "border-neutral-800 focus:border-white/80"
                } placeholder:text-neutral-500`}
              />
            </div>
            {errors.stageName && (
              <p className="text-rose-400 text-xs mt-1 font-medium">
                {errors.stageName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Email đăng ký <span className="text-[#fa2d48]">*</span>
            </label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-3.5 text-neutral-500" />
              <input
                {...register("email")}
                type="email"
                placeholder="artist@example.com"
                className={`w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none border transition-all ${
                  errors.email
                    ? "border-rose-500 focus:border-rose-500"
                    : "border-neutral-800 focus:border-white/80"
                } placeholder:text-neutral-500`}
              />
            </div>
            {errors.email && (
              <p className="text-rose-400 text-xs mt-1 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Mật khẩu & Xác nhận mật khẩu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Mật khẩu <span className="text-[#fa2d48]">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-neutral-500" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none border transition-all ${
                    errors.password
                      ? "border-rose-500 focus:border-rose-500"
                      : "border-neutral-800 focus:border-white/80"
                  } placeholder:text-neutral-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Xác nhận lại <span className="text-[#fa2d48]">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-neutral-500" />
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none border transition-all ${
                    errors.confirmPassword
                      ? "border-rose-500 focus:border-rose-500"
                      : "border-neutral-800 focus:border-white/80"
                  } placeholder:text-neutral-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-neutral-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Tiểu sử ngắn (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Tiểu sử ngắn / Giới thiệu phong cách âm nhạc (Tùy chọn)
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-3.5 top-3 text-neutral-500" />
              <textarea
                {...register("biography")}
                rows={2}
                placeholder="Chia sẻ đôi dòng về định hướng hoặc cá tính âm nhạc của bạn..."
                className="w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border border-neutral-800 focus:border-white/80 transition-all placeholder:text-neutral-500 resize-none"
              />
            </div>
          </div>

          {/* Nút Tạo tài khoản */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-3"
          >
            Tạo tài khoản Nghệ sĩ
          </Button>
        </form>

        <p className="text-center text-xs text-neutral-500 mt-6">
          Bằng việc đăng ký, bạn đồng ý với Điều khoản Sử dụng và Chính sách Bản quyền Tác giả của MC Music.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
