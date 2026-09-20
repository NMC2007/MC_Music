import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

// Bộ schema xác thực bằng Zod
const loginSchema = z.object({
  email: z.string().min(1, { message: "Email không được để trống" }).email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải từ 6 ký tự" }),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  
  // Khởi tạo hook form với bộ xác thực zod
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    // Giả lập độ trễ gọi API
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Login Data:", data);
    
    // Hiển thị toast thông báo
    toast.success("Đăng nhập thành công (Mock)!");
    
    // Chuyển hướng về trang chủ
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-spotify-black flex items-center justify-center p-4">
      {/* Nút Back về trang chủ */}
      <Link to="/" className="absolute top-8 left-8 text-spotify-sub hover:text-white transition">
        &larr; Về trang chủ
      </Link>

      <div className="w-full max-w-md bg-spotify-base p-10 rounded-xl shadow-2xl border border-spotify-hover">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Đăng nhập</h1>
          <p className="text-spotify-sub">Chào mừng bạn trở lại với MC Music</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Email</label>
            <input 
              {...register("email")}
              type="email" 
              className={`w-full bg-spotify-card text-white border ${errors.email ? 'border-spotify-primary' : 'border-transparent'} rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-spotify-primary/50 hover:bg-spotify-hover transition-all`}
              placeholder="name@example.com"
            />
            {errors.email && <p className="text-spotify-primary text-xs mt-2">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">Mật khẩu</label>
            <input 
              {...register("password")}
              type="password" 
              className={`w-full bg-spotify-card text-white border ${errors.password ? 'border-spotify-primary' : 'border-transparent'} rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-spotify-primary/50 hover:bg-spotify-hover transition-all`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-spotify-primary text-xs mt-2">{errors.password.message}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-8" disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-spotify-hover">
          <p className="text-center text-sm text-spotify-sub">
            Chưa có tài khoản? <Link to="/register" className="text-white hover:text-spotify-primary transition font-bold underline ml-1">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
