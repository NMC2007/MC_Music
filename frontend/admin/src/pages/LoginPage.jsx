import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useLocation } from "react-router";
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Music,
  Users,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { loginApi } from "../api/auth";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../components/ui/Button";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email quản trị không được để trống" })
    .email({ message: "Định dạng email không hợp lệ" }),
  password: z
    .string()
    .min(1, { message: "Mật khẩu không được để trống" })
    .min(6, { message: "Mật khẩu quản trị phải từ 6 ký tự trở lên" }),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get("redirect") || location.state?.from?.pathname || "/";

  // Nếu Admin đã đăng nhập trước đó, tự động chuyển về trang quản trị
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
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
          description: `Chào mừng ${response.data.fullName || "Quản trị viên"} trở lại hệ thống!`,
        });
        navigate(redirectUrl, { replace: true });
      }
    } catch (err) {
      console.error("Lỗi đăng nhập Admin:", err);
      const serverMessage =
        err.response?.data?.message ||
        "Email hoặc mật khẩu quản trị không chính xác. Vui lòng kiểm tra lại.";
      toast.error("Đăng nhập thất bại", {
        description: serverMessage,
      });
    }
  };

  const handleFillDemoAdmin = () => {
    setValue("email", "admin1@gmail.com", { shouldValidate: true });
    setValue("password", "Passwor@123", { shouldValidate: true });
    toast.info("Đã điền tài khoản test: admin1@gmail.com");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0d0d0d] text-white">
      {/* ── CỘT TRÁI: HERO BRANDING ADMIN PORTAL ── */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-[#1a080d] via-[#100c0e] to-[#0a0a0a] border-r border-neutral-800/80">
        {/* Glow hiệu ứng đỏ neon */}
        <div className="absolute w-[450px] h-[450px] bg-[#fa2d48]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#fa2d48]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
          {/* Logo Brand */}
          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-13 h-13 rounded-2xl bg-[#fa2d48] flex items-center justify-center shadow-[0_0_30px_rgba(250,45,72,0.45)]">
              <ShieldAlert size={30} className="text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black text-white tracking-wider block">
                MC MUSIC
              </span>
              <span className="text-xs uppercase tracking-[0.25em] text-[#fa2d48] font-bold">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-3xl lg:text-4xl font-black text-white text-center leading-[1.2] mb-5 tracking-tight">
            Cổng Quản Trị & Kiểm Duyệt <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa2d48] to-[#ff6b81]">
              Nội Dung Tập Trung
            </span>
          </h2>

          {/* Description */}
          <p className="text-neutral-400 text-center text-sm leading-relaxed max-w-md mb-8">
            Hệ thống thẩm định chất lượng bài hát, album theo bộ quy chuẩn phát hành; kiểm soát tài khoản người dùng và bảo vệ an toàn cho nền tảng âm nhạc trực tuyến MC Music.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-3 w-full pt-6 border-t border-neutral-800/80">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col items-center gap-2">
              <Music size={20} className="text-[#fa2d48]" />
              <span className="text-xs font-semibold text-neutral-300">Duyệt bài hát & Album</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col items-center gap-2">
              <Users size={20} className="text-[#fa2d48]" />
              <span className="text-xs font-semibold text-neutral-300">Quản lý User & Artist</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col items-center gap-2">
              <ShieldCheck size={20} className="text-[#fa2d48]" />
              <span className="text-xs font-semibold text-neutral-300">7 Bộ quy tắc vi phạm</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CỘT PHẢI: FORM ĐĂNG NHẬP ── */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 max-w-lg mx-auto w-full relative">
        {/* Mobile Brand Header */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#fa2d48] flex items-center justify-center shadow-lg">
            <ShieldAlert size={22} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-wide block">
              MC Music
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#fa2d48] font-bold">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Tiêu đề & Subtitle */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fa2d48]/10 border border-[#fa2d48]/20 text-[#fa2d48] text-xs font-bold mb-3">
            <KeyRound size={13} />
            <span>Khu vực bảo mật nội bộ</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Đăng nhập Quản trị
          </h1>
          <p className="text-neutral-400 text-sm">
            Vui lòng nhập thông tin xác thực để truy cập bảng điều khiển quản trị viên.
          </p>
        </div>

        {/* Form Đăng nhập */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Ô nhập Email */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Email Quản trị viên <span className="text-[#fa2d48]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Mail size={16} />
              </div>
              <input
                type="email"
                placeholder="admin1@gmail.com"
                {...register("email")}
                className={`w-full bg-[#1c1c1c] hover:bg-[#222222] focus:bg-[#222222] text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none border transition-all duration-200 ${
                  errors.email
                    ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-neutral-800 focus:border-white/80 focus:ring-1 focus:ring-white/40"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400 font-medium mt-1.5 animate-in fade-in duration-150">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Ô nhập Mật khẩu */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Mật khẩu <span className="text-[#fa2d48]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu quản trị..."
                {...register("password")}
                className={`w-full bg-[#1c1c1c] hover:bg-[#222222] focus:bg-[#222222] text-white text-sm rounded-xl pl-10 pr-11 py-3 outline-none border transition-all duration-200 ${
                  errors.password
                    ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-neutral-800 focus:border-white/80 focus:ring-1 focus:ring-white/40"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 font-medium mt-1.5 animate-in fade-in duration-150">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Quick Demo Fill Helper */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="text-xs text-neutral-400 hover:text-[#fa2d48] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles size={13} className="text-[#fa2d48]" />
              <span>Tài khoản test</span>
            </button>
            <span className="text-[11px] text-neutral-500">Cổng: Port 5171</span>
          </div>

          {/* Nút Submit */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="w-full mt-2"
          >
            {isSubmitting ? "Đang xác thực quyền Admin..." : "Đăng Nhập Quản Trị"}
          </Button>
        </form>

        {/* Footer bảo mật */}
        <div className="mt-10 pt-6 border-t border-neutral-800/80 text-center">
          <p className="text-xs text-neutral-500">
            Hệ thống giám sát bảo mật phân quyền đa cấp RBAC.
            <br />
            Mọi thao tác kiểm duyệt âm nhạc đều được ghi log truy vết.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

