import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate, useLocation } from "react-router";
import {
  Music2,
  Check,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { registerApi } from "../api/auth/auth";
import { useAuthStore } from "../store/useAuthStore";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: "Họ và tên phải từ 2 ký tự trở lên" })
      .max(50, { message: "Họ và tên không quá 50 ký tự" }),
    email: z
      .string()
      .min(1, { message: "Email không được để trống" })
      .email({ message: "Email không đúng định dạng" }),
    password: z
      .string()
      .min(6, { message: "Mật khẩu phải từ 6 ký tự trở lên" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Vui lòng nhập lại mật khẩu" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await registerApi({
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (response?.data) {
        // Tự động đăng nhập người dùng ngay sau khi đăng ký
        login(response.data);
        toast.success("Đăng ký tài khoản thành công!", {
          description: `Chào mừng ${response.data.fullName || "bạn"} gia nhập MC Music!`,
        });
        navigate(redirectUrl, { replace: true });
      } else {
        toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      }
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      const serverMessage =
        err.response?.data?.message ||
        "Đăng ký thất bại. Email có thể đã được sử dụng hoặc dữ liệu không hợp lệ.";
      toast.error("Không thể đăng ký", {
        description: serverMessage,
      });
    }
  };

  const benefits = [
    "Nghe nhạc không giới hạn",
    "Tạo playlist cá nhân",
    "Theo dõi nghệ sĩ yêu thích",
    "Lưu bài hát yêu thích",
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#0a0a0a] text-white">
      {/* ── CỘT TRÁI: BRANDING & LỢI ÍCH ── */}
      <div className="hidden md:flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden bg-gradient-to-br from-[#180a0e] via-[#0d0d0e] to-[#0a0a0a] border-r border-neutral-900">
        {/* Ambient Red Glow */}
        <div className="absolute w-[420px] h-[420px] bg-[#fa2d48]/12 rounded-full blur-[110px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-md text-center">
          {/* Logo icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#2a1217] border border-[#fa2d48]/30 flex items-center justify-center shadow-[0_0_35px_rgba(250,45,72,0.3)] mb-8">
            <Music2 size={32} className="text-[#fa2d48]" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Âm nhạc không giới hạn
          </h2>

          {/* Description */}
          <p className="text-spotify-sub text-sm leading-relaxed mb-10 max-w-sm">
            Tham gia MC Music để khám phá hàng triệu bài hát, tạo playlist cá
            nhân và theo dõi nghệ sĩ yêu thích của bạn.
          </p>

          {/* Benefit list */}
          <div className="flex flex-col gap-4.5 w-full max-w-xs text-left">
            {benefits.map((item, index) => (
              <div key={index} className="flex items-center gap-3.5">
                <div className="w-5 h-5 rounded-full border border-[#fa2d48] flex items-center justify-center text-[#fa2d48] flex-shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-white/90 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CỘT PHẢI: FORM ĐĂNG KÝ ── */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 max-w-xl mx-auto w-full relative">
        {/* Link quay về trang chủ */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-spotify-sub hover:text-white text-sm mb-8 transition-colors self-start"
        >
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        {/* Tiêu đề & Subtitle */}
        <div className="mb-7">
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Tạo tài khoản
          </h1>
          <p className="text-spotify-sub text-sm">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-white font-bold underline hover:text-[#fa2d48] transition-colors ml-1"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Form đăng ký */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Họ và tên
            </label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-3.5 text-neutral-500" />
              <input
                {...register("fullName")}
                type="text"
                placeholder="Nguyễn Văn A"
                className={`w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-lg pl-10 pr-4 py-3 text-sm outline-none border ${
                  errors.fullName ? "border-[#fa2d48]" : "border-transparent"
                } focus:border-neutral-500 transition-all placeholder:text-neutral-500`}
              />
            </div>
            {errors.fullName && (
              <p className="text-[#fa2d48] text-xs mt-1.5 font-medium">
                {errors.fullName.message}
              </p>
            )}
          </div>

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
                placeholder="Tối thiểu 6 ký tự"
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
          </div>

          {/* Nhập lại mật khẩu */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Nhập lại mật khẩu
            </label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3.5 text-neutral-500" />
              <input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                className={`w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-lg pl-10 pr-10 py-3 text-sm outline-none border ${
                  errors.confirmPassword
                    ? "border-[#fa2d48]"
                    : "border-transparent"
                } focus:border-neutral-500 transition-all placeholder:text-neutral-500`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[#fa2d48] text-xs mt-1.5 font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Nút Đăng ký miễn phí */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-7 py-3.5 rounded-full bg-[#fa2d48] hover:bg-[#e0223e] text-white font-bold text-base shadow-[0_8px_20px_rgba(250,45,72,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Đang xử lý..." : "Đăng ký miễn phí"}
          </button>
        </form>

        {/* Điều khoản sử dụng */}
        <p className="text-center text-xs text-neutral-500 mt-6 leading-relaxed">
          Khi đăng ký, bạn đồng ý với{" "}
          <a href="#" className="underline text-neutral-400 hover:text-white">
            Điều khoản sử dụng
          </a>{" "}
          và{" "}
          <a href="#" className="underline text-neutral-400 hover:text-white">
            Chính sách bảo mật
          </a>{" "}
          của MC Music.
        </p>
      </div>
    </div>
  );
};
