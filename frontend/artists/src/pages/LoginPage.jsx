import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate, useLocation } from "react-router";
import { Music2, Mail, Lock, Eye, EyeOff, Radio, Disc3, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { loginApi } from "#/api/auth";
import { useAuthStore } from "#/store/useAuthStore";
import { Button } from "#/components/ui/Button";

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

  // Nếu đã đăng nhập, tự động chuyển về trang quản trị
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
          description: `Chào mừng ${response.data.stageName || "Nghệ sĩ"} đến với Artist Studio!`,
        });
        navigate(redirectUrl, { replace: true });
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      const serverMessage =
        err.response?.data?.message ||
        "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
      toast.error("Đăng nhập thất bại", {
        description: serverMessage,
      });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0a0a0a] text-white">
      {/* ── CỘT TRÁI: HERO BRANDING ARTIST STUDIO ── */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-[#1a080d] via-[#100d0e] to-[#0a0a0a] border-r border-neutral-900">
        {/* Glow hiệu ứng đỏ neon */}
        <div className="absolute w-[480px] h-[480px] bg-[#fa2d48]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#fa2d48]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
          {/* Logo Brand */}
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

          {/* Headline */}
          <h2 className="text-4xl lg:text-5xl font-black text-white text-center leading-[1.15] mb-6 tracking-tight">
            Nơi tôn vinh tác phẩm <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa2d48] to-[#ff6b81]">
              của riêng bạn.
            </span>
          </h2>

          {/* Description */}
          <p className="text-spotify-sub text-center text-sm sm:text-base leading-relaxed max-w-md mb-8">
            Cổng thông tin chuyên biệt dành cho Nghệ sĩ: phát hành bài hát, tạo album, theo dõi thống kê lượt nghe và kết nối trực tiếp với hàng triệu thính giả.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-4 w-full pt-6 border-t border-neutral-800/80">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
              <Disc3 size={20} className="text-[#fa2d48]" />
              <span className="text-xs font-semibold text-neutral-300">Phát hành Album</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
              <Radio size={20} className="text-[#fa2d48]" />
              <span className="text-xs font-semibold text-neutral-300">Nghe thử MP3</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
              <Sparkles size={20} className="text-[#fa2d48]" />
              <span className="text-xs font-semibold text-neutral-300">Thống kê Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CỘT PHẢI: FORM ĐĂNG NHẬP ── */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 max-w-lg mx-auto w-full relative">
        {/* Mobile Brand Header */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
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

        {/* Tiêu đề & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">Đăng nhập Studio</h1>
          <p className="text-spotify-sub text-sm">
            Chưa có tài khoản nghệ danh?{" "}
            <Link
              to="/register"
              className="text-[#fa2d48] font-bold hover:underline transition-colors ml-1"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Email đăng nhập <span className="text-[#fa2d48]">*</span>
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
              <p className="text-rose-400 text-xs mt-1.5 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Mật khẩu <span className="text-[#fa2d48]">*</span>
            </label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3.5 text-neutral-500" />
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#252525] text-white rounded-xl pl-10 pr-11 py-3 text-sm outline-none border transition-all ${
                  errors.password
                    ? "border-rose-500 focus:border-rose-500"
                    : "border-neutral-800 focus:border-white/80"
                } placeholder:text-neutral-500`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-rose-400 text-xs mt-1.5 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Nút Đăng nhập */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-4"
          >
            Đăng nhập Studio
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-7">
          <div className="border-t border-neutral-850 w-full" />
          <span className="bg-[#0a0a0a] px-3 text-xs text-neutral-500 uppercase tracking-wider absolute">
            hoặc
          </span>
        </div>

        {/* Nút Đăng ký tài khoản */}
        <Link to="/register">
          <Button variant="secondary" size="md" className="w-full">
            Đăng ký tài khoản Nghệ sĩ mới
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
