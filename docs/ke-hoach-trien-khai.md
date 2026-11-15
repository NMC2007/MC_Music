# Kế hoạch triển khai dự án — Nền tảng nghe nhạc (MC Music)

## 1. Phương pháp triển khai (Backend-First Strategy)

Kế hoạch triển khai dự án tuân theo mô hình **Backend-First**, tập trung hoàn thiện toàn bộ hệ thống API (Backend) và kiểm thử đảm bảo hoạt động mượt mà trước khi tiến hành xây dựng giao diện (Frontend). Do thời gian dự án ngắn, việc tập trung dứt điểm Backend sẽ giúp tránh bị phân mảnh nguồn lực.

Cách tiếp cận này đảm bảo:
- Rủi ro thấp nhất: Luôn có một hệ thống API ổn định được tài liệu hóa rõ ràng.
- Kiểm thử liên tục (Test-driven): Postman được áp dụng ngay sau khi mỗi API hoàn thành.
- Kiến trúc bền vững: Cấu trúc Database đã được thiết kế sẵn các cột trạng thái để phục vụ tận các tính năng nâng cao của Admin mà không cần đập đi xây lại.
- Dữ liệu thực tế: Toàn bộ quá trình Upload - Duyệt - Phát nhạc được thử nghiệm trơn tru qua Cloudinary trước khi hiển thị lên UI.

---

## 2. Các giai đoạn triển khai và Trạng thái thực tế

### Giai đoạn 1: Database & Nền tảng Xác thực (Core Auth) — [HOÀN THÀNH 100%]
*Mục tiêu: Hoàn thiện nền móng dữ liệu và bảo mật cho toàn hệ thống.*
- Đã dựng PostgreSQL với 4 schema độc lập: `mc_music_users_schema`, `mc_music_artists_schema`, `mc_music_admin_schema`, `mc_music_catalog_schema`.
- Đã cấu hình API Gateway (Port 8686) định tuyến 4 services và cấu hình CORS chặt chẽ.
- Đã hoàn thành thư viện `shared-auth-lib` ký và kiểm tra JWT.
- Đã triển khai API Đăng ký, Đăng nhập, Refresh Token, Logout đồng loạt ở cả 3 service.

### Giai đoạn 2: Catalog Core & Dữ liệu thật (Cloudinary) — [HOÀN THÀNH 100%]
*Mục tiêu: Xây dựng Catalog Service hoàn chỉnh, cung cấp công cụ tải nhạc và kiểm duyệt.*
- Đã cấu hình Multi-Issuer JWT tại Catalog Service để phân quyền theo 3 loại token (User, Artist, Admin).
- Đã kết nối Cloudinary API để upload file ảnh và file audio (mp3/wav).
- Đã phát triển API cho Artist: Tải lên bài hát, tạo album, thêm lyrics, mời nghệ sĩ feat (Trạng thái mặc định `PENDING`).
- Đã phát triển API cho Admin: Xem danh sách nhạc/album chờ duyệt và chuyển trạng thái sang `APPROVED`, `REJECTED`, `TAKEDOWN`.
- Đã phát triển API Public/User: Khám phá trending songs, latest albums, tìm kiếm toàn năng, audio streaming.

### Giai đoạn 3: Hoàn thiện User MVP Backend — [HOÀN THÀNH 100%]
*Mục tiêu: Xây dựng toàn bộ API nghiệp vụ phục vụ cho người dùng cuối.*
- Đã phát triển API User Service: Playlists, Favorites (Song & Album), Follows (Artist), Lịch sử nghe nhạc.
- Đã triển khai giao tiếp nội bộ (Internal API) từ User Service sang Catalog Service để tăng bộ đếm (`like_count`, `play_count`).

### Giai đoạn 4: Hoàn thiện Artist & Admin MVP Backend — [HOÀN THÀNH 100%]
*Mục tiêu: Dứt điểm toàn bộ API quản lý tài khoản và thống kê trước khi sang Frontend.*
- Đã phát triển API Artist Service: Quản lý hồ sơ, lấy thống kê từ Catalog Service.
- Đã phát triển API Admin Service: Lấy danh sách User/Artist, thực hiện khóa/mở tài khoản (`is_active = false/true`).
- Đã tích hợp Apache Kafka (`artist-events-topic`) để đồng bộ dữ liệu phi chuẩn hóa.

### Giai đoạn 5: Triển khai Frontend & Nâng cấp Hệ thống Kiểm duyệt — [ĐANG TIẾN HÀNH]
*Mục tiêu: Hệ thống frontend end-to-end hoàn chỉnh và chuẩn hóa quy trình kiểm duyệt.*
1. **User Web (Port 5173)**: Đã hoàn thiện ~95% (Nghe nhạc, Playlist, Thả tim, Tìm kiếm, Lời bài hát Karaoke).
2. **Artist Web (Port 5172)**: Đã hoàn thiện ~95% (Dashboard thống kê, tải nhạc, tạo album, thêm lyrics/feat).
3. **Nâng cấp Kiểm duyệt theo Bộ Quy Tắc (Đang triển khai)**:
   - Bổ sung `rejection_reason` vào bảng `songs` và `albums` trong database.
   - Nâng cấp API Catalog Service tiếp nhận và lưu trữ lý do từ chối từ Admin.
   - Hiển thị chi tiết lý do từ chối trên Studio của Nghệ sĩ để nghệ sĩ nắm được vi phạm và chỉnh sửa.
4. **Admin Web (Port 5171) (Đang triển khai)**:
   - Xây dựng trọn vẹn từ đầu ứng dụng quản trị: Đăng nhập Admin, Dashboard tổng quan.
   - Màn hình Kiểm duyệt Bài hát tích hợp Audio Preview Player & Modal Bộ quy tắc vi phạm.
   - Màn hình Kiểm duyệt Album.
   - Màn hình Quản lý Người dùng & Nghệ sĩ (Khóa / Mở khóa tài khoản).

---

## 3. Bảng tổng hợp công việc

| Giai đoạn | Trọng tâm Backend & Database | Trọng tâm Frontend | Trạng thái |
|:---:|---|---|:---:|
| **1** | Database (4 schemas), Auth (3 Services), Gateway | (Chưa tiến hành) | **Xong 100%** |
| **2** | Catalog Core, Cloudinary, API Upload & Duyệt nhạc | (Chưa tiến hành) | **Xong 100%** |
| **3** | User Service, Giao tiếp nội bộ (Internal API) | (Chưa tiến hành) | **Xong 100%** |
| **4** | Artist Service, Admin Service, Kafka sync | (Chưa tiến hành) | **Xong 100%** |
| **5** | Thêm `rejection_reason` & nâng cấp API kiểm duyệt | **Triển khai đồng loạt User (Xong), Artist (Xong), Admin Web (Đang làm)** | **Đang làm** |
