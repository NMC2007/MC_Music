import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate, useLocation } from "react-router";
import { Music2, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { loginApi } from "../api/auth/auth";
import { useAuthStore } from "../store/useAuthStore";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email không được để trống" })
    .email({ message: "Email không đúng định dạng" }),
  password: z
    .string()
    .min(6, { message: "Mật khẩu phải từ 6 ký tự trở lên" }),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get("redirect") || location.state?.from || "/";

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
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await loginApi({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (response?.data) {
        login(response.data);
        toast.success("Đăng nhập thành công!", {
          description: `Chào mừng ${response.data.fullName || "bạn"} trở lại!`,
        });
        navigate(redirectUrl, { replace: true });
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      const serverMessage =
        err.response?.data?.message ||
        "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.";
      toast.error("Đăng nhập thất bại", {
        description: serverMessage,
      });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#0a0a0a] text-white">
      {/* ── CỘT TRÁI: HERO BRANDING (Khớp 100% hình thiết kế) ── */}
      <div className="hidden md:flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden bg-gradient-to-br from-[#180a0e] via-[#0d0d0e] to-[#0a0a0a] border-r border-neutral-900">
        {/* Ambient Red Glow */}
        <div className="absolute w-[440px] h-[440px] bg-[#fa2d48]/12 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-md text-center">
          {/* Logo & Brand text */}
          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#fa2d48] flex items-center justify-center shadow-[0_0_24px_rgba(250,45,72,0.4)]">
              <Music2 size={26} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">
              MC Music
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white text-center leading-[1.15] mb-5 tracking-tight">
            Triệu bài hát,<br />
            <span className="text-[#fa2d48]">một đích đến.</span>
          </h2>

          {/* Description */}
          <p className="text-spotify-sub text-center text-sm leading-relaxed max-w-sm">
            Đăng nhập để tiếp tục hành trình âm nhạc của bạn. Playlist, nghệ sĩ
            yêu thích và lịch sử nghe nhạc đều đang chờ bạn.
          </p>
        </div>
      </div>

      {/* ── CỘT PHẢI: FORM ĐĂNG NHẬP ── */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 max-w-xl mx-auto w-full relative">
        {/* Link quay về trang chủ */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-spotify-sub hover:text-white text-sm mb-8 transition-colors self-start"
        >
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        {/* Tiêu đề & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">Đăng nhập</h1>
          <p className="text-spotify-sub text-sm">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-white font-bold underline hover:text-[#fa2d48] transition-colors ml-1"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Email
            </label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-3.5 text-neutral-500" />
              <input
                {...register("email")}
                type="email"
                placeholder="name@example.com"
                className={`w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-lg pl-10 pr-4 py-3 text-sm outline-none border ${
                  errors.email ? "border-[#fa2d48]" : "border-transparent"
                } focus:border-neutral-500 transition-all placeholder:text-neutral-500`}
              />
            </div>
            {errors.email && (
              <p className="text-[#fa2d48] text-xs mt-1.5 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Mật khẩu
            </label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3.5 text-neutral-500" />
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-lg pl-10 pr-10 py-3 text-sm outline-none border ${
                  errors.password ? "border-[#fa2d48]" : "border-transparent"
                } focus:border-neutral-500 transition-all placeholder:text-neutral-500`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[#fa2d48] text-xs mt-1.5 font-medium">
                {errors.password.message}
              </p>
            )}

            {/* Quên mật khẩu */}
            <div className="flex justify-end mt-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Tính năng quên mật khẩu đang được phát triển.");
                }}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Quên mật khẩu?
              </a>
            </div>
          </div>

          {/* Nút Đăng nhập */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-3.5 rounded-full bg-[#fa2d48] hover:bg-[#e0223e] text-white font-bold text-base shadow-[0_8px_20px_rgba(250,45,72,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        {/* Divider: hoặc */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-neutral-800 w-full" />
          <span className="bg-[#0a0a0a] px-3 text-xs text-neutral-500 uppercase tracking-wider absolute">
            hoặc
          </span>
        </div>

        {/* Nút Tạo tài khoản mới */}
        <Link
          to="/register"
          className="w-full py-3.5 rounded-full border border-neutral-700 hover:border-white text-white font-semibold text-center text-sm transition-all hover:bg-white/5 block"
        >
          Tạo tài khoản mới
        </Link>
      </div>
    </div>
  );
};
