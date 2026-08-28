# Kế hoạch triển khai dự án — Nền tảng nghe nhạc (MC Music)

## 1. Phương pháp triển khai (Vertical Slicing)

Kế hoạch triển khai dự án tuân theo mô hình **Phát triển cắt dọc (Vertical Slicing)**, lấy trải nghiệm của User làm trọng tâm ưu tiên. Tuy nhiên, thay vì sử dụng dữ liệu giả (Mock Data), chúng ta sẽ phát triển ngay các API cốt lõi cho Artist (để tải nhạc) và Admin (để duyệt nhạc) từ sớm. Điều này cho phép nền tảng nghe nhạc của User được vận hành với **dữ liệu thật 100%** ngay từ những bước đầu tiên.

Cách tiếp cận này đảm bảo:
- Rủi ro thấp nhất: Luôn có một ứng dụng nghe nhạc hoàn chỉnh có thể báo cáo/demo.
- Kiểm thử liên tục (Test-driven): Postman được áp dụng ngay sau khi mỗi API hoàn thành.
- Kiến trúc bền vững: Cấu trúc Database đã được thiết kế sẵn các cột trạng thái để phục vụ tận các tính năng nâng cao của Admin mà không cần đập đi xây lại.
- Dữ liệu thực tế: Toàn bộ quá trình Upload - Duyệt - Phát nhạc được thử nghiệm trơn tru qua Cloudinary.

---

## 2. Các giai đoạn triển khai chi tiết

### Giai đoạn 1: Database & Nền tảng Xác thực (Core Auth)
*Mục tiêu: Hoàn thiện nền móng dữ liệu và bảo mật cho toàn hệ thống.*

1. **Khởi tạo Database:** 
   - Dựng PostgreSQL.
   - Viết các script SQL tạo bảng cho 4 schema: `user_db`, `artist_db`, `admin_db`, `catalog_db`.
2. **Khởi tạo hệ thống:** Setup API Gateway định tuyến cơ bản.
3. **Thư viện JWT (`shared-auth-lib`):** Xây dựng module dùng chung chứa logic tạo và giải mã Access Token / Refresh Token.
4. **Triển khai Module Auth:** Hoàn thiện API Đăng ký và Đăng nhập đồng loạt ở cả 3 service (User Service, Artist Service, Admin Service).

### Giai đoạn 2: Catalog Core & Dữ liệu thật (Cloudinary)
*Mục tiêu: Xây dựng Catalog Service hoàn chỉnh, cung cấp công cụ tải nhạc và kiểm duyệt.*

1. **Cấu hình Catalog Auth:** Cấu hình Multi-Issuer JWT tại Catalog Service để phân quyền theo 3 loại token (User, Artist, Admin).
2. **Tích hợp Cloudinary:** Kết nối Cloudinary API để chuẩn bị cho việc upload file ảnh và file audio (mp3/wav).
3. **Phát triển API cho Artist:** Viết API cho phép nghệ sĩ tải lên bài hát và tạo album (Trạng thái mặc định là `PENDING`).
4. **Phát triển API cho Admin:** Viết API cho phép quản trị viên xem danh sách nhạc chờ duyệt và chuyển trạng thái sang `APPROVED`.
5. **Phát triển API cho Public/User:** 
   - Viết API lấy danh sách nhạc, album nổi bật (chỉ lấy nhạc đã `APPROVED`) để chuẩn bị cho Giao diện User.
   - Phát triển API tìm kiếm nhạc/album (sử dụng truy vấn `LIKE` trong CSDL để đảm bảo hệ thống ổn định và ra mắt nhanh chóng ở phiên bản đầu).
6. **Kiểm thử Postman:** Test toàn bộ luồng Upload -> Duyệt -> Nghe nhạc.

### Giai đoạn 3: Hoàn thiện User MVP (Sản phẩm cốt lõi)
*Mục tiêu: Có một trang web nghe nhạc hoàn chỉnh (Spotify Clone) dành cho User.*

1. **Phát triển API User Service:**
   - Dựa vào dữ liệu thật ở Catalog, viết các nghiệp vụ: Lấy nhạc ra trang chủ, Tạo Playlist, Thêm bài hát vào Playlist, Thả tim bài hát, Ghi nhận lịch sử nghe nhạc.
   - Viết logic gọi Internal API từ User Service sang Catalog Service để tăng lượt `play_count` và `like_count`.
2. **Phát triển Frontend (User Web):**
   - Khởi tạo project React + TailwindCSS.
   - Xây dựng giao diện trang chủ, trang đăng nhập.
   - Tích hợp Trình phát nhạc (Audio Player) toàn cục.
   - Tích hợp API.
> **=> MỐC QUAN TRỌNG:** Kết thúc Giai đoạn 3, hệ thống đã là một nền tảng nghe nhạc hoàn chỉnh, sử dụng nhạc thật trên Cloudinary!

### Giai đoạn 4: Triển khai Artist Web & Hoàn thiện Artist Service
*Mục tiêu: Cung cấp giao diện trực quan cho nghệ sĩ quản lý kho nhạc.*

1. **Phát triển API Artist Service:** Các nghiệp vụ quản lý hồ sơ, lấy thống kê từ Catalog Service.
2. **Phát triển Frontend (Artist Web):**
   - Khởi tạo project React riêng.
   - Xây dựng giao diện Dashboard, giao diện kéo thả Upload Nhạc/Album (Gọi API Catalog đã làm ở Giai đoạn 2).

### Giai đoạn 5: Triển khai Admin Web
*Mục tiêu: Hệ thống quản trị end-to-end hoàn chỉnh.*

1. **Phát triển API Admin Service:** Lấy danh sách User/Artist, thực hiện khóa/mở tài khoản (`is_active = false/true`).
2. **Phát triển Frontend (Admin Web):**
   - Khởi tạo project React riêng.
   - Xây dựng bảng điều khiển quản trị viên: Quản lý bài hát chờ duyệt (Gọi API Catalog đã làm ở Giai đoạn 2), Quản lý tài khoản.

---

## 3. Bảng tổng hợp công việc

| Giai đoạn | Trọng tâm Backend | Trọng tâm Frontend |
|---|---|---|
| 1 | Database (4 schemas), Auth (3 Services), Gateway | (Chưa tiến hành) |
| 2 | Catalog Core, Cloudinary, API Upload & Duyệt nhạc | (Chưa tiến hành) |
| 3 | User Service, Giao tiếp nội bộ (Internal API) | **User Web (Sản phẩm cốt lõi)** |
| 4 | Artist Service (Hồ sơ, Dashboard) | **Artist Web** |
| 5 | Admin Service (Khóa tài khoản) | **Admin Web** |
