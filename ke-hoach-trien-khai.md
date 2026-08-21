# Kế hoạch triển khai dự án — Nền tảng nghe nhạc (MC Music)

## 1. Phương pháp triển khai (Vertical Slicing)

Kế hoạch triển khai dự án tuân theo mô hình **Phát triển cắt dọc (Vertical Slicing)**, lấy trải nghiệm của User làm trọng tâm ưu tiên. Thay vì phát triển đồng loạt toàn bộ Backend rồi mới đến Frontend, chúng ta sẽ ưu tiên hoàn thiện **Sản phẩm cốt lõi (Trang User Web)** với dữ liệu giả lập (Mock Data) trước, sau đó mới thay thế dần bằng dữ liệu thật từ Artist Web và Admin Web.

Cách tiếp cận này đảm bảo:
- Rủi ro thấp nhất: Luôn có một ứng dụng nghe nhạc hoàn chỉnh có thể báo cáo/demo ngay cả khi dự án chậm tiến độ.
- Kiểm thử liên tục (Test-driven): Postman được áp dụng ngay sau khi mỗi API hoàn thành.
- Kiến trúc bền vững: Cấu trúc Database đã được thiết kế sẵn các cột trạng thái để phục vụ tận các tính năng nâng cao của Admin mà không cần đập đi xây lại.

---

## 2. Các giai đoạn triển khai chi tiết

### Giai đoạn 1: Database & Nền tảng Xác thực (Core Auth)
*Mục tiêu: Hoàn thiện nền móng dữ liệu và bảo mật cho toàn hệ thống.*

1. **Khởi tạo Database:** 
   - Dựng PostgreSQL.
   - Viết các script SQL tạo bảng cho 4 schema: `user_db`, `artist_db`, `admin_db`, `catalog_db`. 
   - Đảm bảo các bảng có chứa các cột `is_active` (để khóa tài khoản), `status` (để duyệt/gỡ nhạc), `is_deleted` (để xóa mềm).
2. **Khởi tạo hệ thống:** Setup API Gateway định tuyến cơ bản.
3. **Thư viện JWT (`shared-auth-lib`):** Xây dựng module dùng chung chứa logic tạo và giải mã Access Token / Refresh Token.
4. **Triển khai Module Auth:** Hoàn thiện API Đăng ký và Đăng nhập đồng loạt ở cả 3 service (User Service, Artist Service, Admin Service).

### Giai đoạn 2: Catalog Core & Mock Data
*Mục tiêu: Đưa dữ liệu mẫu vào hệ thống để phục vụ việc phát triển API nhanh chóng.*

1. **Cấu hình Catalog Auth:** Cấu hình middleware tại Catalog Service để đọc và phân quyền theo 3 loại token (nhận diện Issuer: User, Artist, Admin).
2. **Seed Mock Data:** Viết script SQL fix cứng dữ liệu trực tiếp vào database của Catalog gồm vài Nghệ sĩ (giả), Thể loại, Bài hát, Album (kèm theo link audio url mp3 công khai).
3. **Phát triển API Catalog:** Viết các API Tìm kiếm, Lấy danh sách bài hát nổi bật, Lấy danh sách nhạc theo Album.
4. **Kiểm thử Postman:** Test toàn bộ các API lấy nhạc của Catalog.

### Giai đoạn 3: Hoàn thiện User MVP (Sản phẩm cốt lõi)
*Mục tiêu: Có một trang web nghe nhạc hoàn chỉnh (Spotify Clone) dành cho User.*

1. **Phát triển API User Service:**
   - Dựa vào Mock Data bên Catalog, viết các nghiệp vụ: Lấy nhạc ra trang chủ, Tạo Playlist, Thêm bài hát vào Playlist, Thả tim bài hát, Ghi nhận lịch sử nghe nhạc.
   - Viết logic gọi Internal API từ User Service sang Catalog Service để tăng lượt `play_count` và `like_count`.
2. **Kiểm thử Postman:** Test toàn bộ API của User Service.
3. **Phát triển Frontend (User Web):**
   - Khởi tạo project React + TailwindCSS.
   - Xây dựng giao diện trang chủ, trang đăng nhập.
   - Tích hợp Trình phát nhạc (Audio Player) toàn cục.
   - Tích hợp các API gọi nhạc Mock và API của User.
> **=> MỐC QUAN TRỌNG:** Kết thúc Giai đoạn 3, hệ thống đã là một nền tảng nghe nhạc hoàn chỉnh với các chức năng cơ bản, sẵn sàng demo!

### Giai đoạn 4: Triển khai Artist Web (Đưa dữ liệu thật vào hệ thống)
*Mục tiêu: Cung cấp công cụ cho nghệ sĩ thật đăng nhạc, thay thế hoàn toàn Mock Data.*

1. **Phát triển API Artist Service:** Các nghiệp vụ quản lý hồ sơ, lấy thống kê.
2. **Tích hợp Cloudinary:** Cập nhật Catalog Service để nhận file nhạc, ảnh bìa từ Artist và upload lên Cloudinary.
3. **Clear Mock Data:** Xóa các dữ liệu giả lập đã tạo ở Giai đoạn 2.
4. **Phát triển Frontend (Artist Web):**
   - Khởi tạo project React riêng.
   - Xây dựng giao diện Dashboard, giao diện kéo thả Upload Nhạc/Album.
   - Bài hát tải lên lúc này sẽ có `status=PENDING`.

### Giai đoạn 5: Triển khai Admin Web (Quản trị toàn diện)
*Mục tiêu: Hệ thống quản trị end-to-end hoàn chỉnh.*

1. **Phát triển API Admin Service:** Lấy danh sách User/Artist, thực hiện khóa/mở tài khoản (`is_active = false/true`).
2. **Hoàn thiện Catalog API (Admin Role):** Cập nhật API để Admin duyệt nhạc (`PENDING` -> `APPROVED`) hoặc gỡ nhạc (`TAKEDOWN`).
3. **Phát triển Frontend (Admin Web):**
   - Khởi tạo project React riêng.
   - Xây dựng bảng điều khiển quản trị viên: Danh sách bài hát chờ duyệt, Quản lý tài khoản.

---

## 3. Bảng tổng hợp công việc

| Giai đoạn | Trọng tâm Backend | Trọng tâm Frontend |
|---|---|---|
| 1 | Database (4 schemas), Auth (3 Services), Gateway | (Chưa tiến hành) |
| 2 | Catalog Core, Mock Data (SQL) | (Chưa tiến hành) |
| 3 | User Service, Giao tiếp nội bộ (Internal API) | **User Web (Sản phẩm cốt lõi)** |
| 4 | Tích hợp Cloudinary (Catalog), Artist Service | **Artist Web** |
| 5 | Admin Service, Kiểm duyệt (Catalog) | **Admin Web** |
