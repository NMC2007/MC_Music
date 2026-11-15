# Báo cáo tổng quan kiến trúc dự án — Nền tảng nghe nhạc (MC Music)

## 1. Mô tả tổng quan dự án

Xây dựng nền tảng nghe nhạc trực tuyến gồm 3 hệ thống độc lập, phục vụ 3 nhóm người dùng khác nhau:

- **Trang chính (User)**: nơi người dùng đăng ký, đăng nhập, nghe nhạc, yêu thích, tạo playlist, follow nghệ sĩ, xem lyrics đồng bộ karaoke. Đây là trang mặc định khi truy cập vào hệ thống (Port 5173).
- **Trang nghệ sĩ (Artist)**: yêu cầu đăng ký tài khoản nghệ sĩ riêng, dùng để tạo hồ sơ, đăng tải bài hát/album, gắn lyrics, mời nghệ sĩ hợp tác (feat), theo dõi lượt nghe và lượt yêu thích của bài hát mình đăng, đọc lý do vi phạm nếu bị từ chối duyệt (Port 5172).
- **Trang quản trị (Admin)**: quản lý toàn bộ User và Artist, kiểm duyệt bài hát/album theo bộ quy tắc chuẩn hóa (chấp thuận, từ chối kèm lý do vi phạm hoặc gỡ bỏ), có quyền tạo thêm tài khoản Admin mới, khóa/mở khóa tài khoản người dùng và nghệ sĩ (Port 5171).

**Công nghệ sử dụng**:
- Backend: Java 17, Spring Boot 4, kiến trúc microservices (4 services chính + 1 API Gateway)
- Database: PostgreSQL 15 (4 schema độc lập: `mc_music_users_schema`, `mc_music_artists_schema`, `mc_music_admin_schema`, `mc_music_catalog_schema`)
- Message Broker: Apache Kafka 3.7.0 (sử dụng topic `artist-events-topic` để đồng bộ dữ liệu phi chuẩn hóa)
- Caching/Storage: Cloudinary (Lưu trữ file nhạc audio & ảnh cover, avatar)
- Frontend: React 19 + TailwindCSS v4 + Zustand + TanStack Query (3 project độc lập trên 3 cổng riêng biệt)
- Giao tiếp nội bộ: REST API (Internal API bảo vệ bằng `X-Internal-Secret`) + Kafka Events

---

## 2. Nguyên tắc thiết kế đã chốt

### 2.1. Ba loại tài khoản độc lập tuyệt đối

- User, Artist, Admin có **bảng dữ liệu tài khoản hoàn toàn tách biệt**.
- Cho phép **trùng email giữa 3 domain** (VD: 1 email vừa đăng ký được User vừa đăng ký được Artist), nhưng **không trùng email trong cùng 1 domain** — mỗi bảng chỉ cần ràng buộc `UNIQUE(email)` thông thường, không cần điều kiện phụ.
- Mỗi domain tự sinh và quản lý JWT của riêng mình (access token + refresh token), dùng **secret key riêng biệt** cho từng domain — không dùng chung 1 secret cho cả 3.
- Để tránh viết lặp code xử lý JWT, dùng 1 **shared library** (`shared-auth-lib` module dùng chung) chứa logic tạo/verify token — secret key thì mỗi service tự cấu hình riêng, không đặt trong thư viện dùng chung.

### 2.2. API Gateway chỉ định tuyến, không xác thực

- Gateway định tuyến request theo path prefix (`/api/user/**`, `/api/artist/**`, `/api/admin/**`, `/api/catalog/**`) tới đúng service.
- Gateway **không đọc/verify JWT** — tránh việc phải nắm giữ secret của nhiều domain. Xác thực JWT là trách nhiệm của từng service nhận request.
- Gateway kiểm soát và thiết lập cấu hình CORS cho 3 ứng dụng frontend (User port 5173, Artist port 5172, Admin port 5171).

### 2.3. Xác thực đa nguồn (multi-issuer) tại Catalog Service

- Catalog Service đóng vai trò là "Source of Truth" cho toàn bộ siêu dữ liệu âm nhạc và tích hợp luôn việc Upload file (thay vì tách riêng Media Service).
- Catalog Service **tự xác thực trực tiếp JWT từ cả 3 domain**:
  - JWT phát hành thêm claim `iss` (issuer: `user-service` / `artist-service` / `admin-service`) và claim `role` (`USER` / `ARTIST` / `ADMIN`).
  - Catalog Service đọc claim `iss` để chọn đúng secret key tương ứng để verify chữ ký.
  - Phân quyền theo `role`:
    - `USER`: Đọc bài hát/album `APPROVED`, stream nhạc.
    - `ARTIST`: Upload nhạc/tạo bài hát mới (`PENDING`), sửa/xóa bài hát của mình, đọc lý do nếu bài hát bị từ chối (`rejection_reason`).
    - `ADMIN`: Duyệt nhạc (`APPROVED`), từ chối nhạc vi phạm kèm lý do theo bộ quy tắc (`REJECTED`), hoặc gỡ nhạc vi phạm (`TAKEDOWN`).

### 2.4. Phi chuẩn hóa dữ liệu (Data Denormalization) & Đồng bộ qua Apache Kafka

- Nhằm tránh tình trạng User Service phải gọi sang Catalog Service liên tục để lấy thông tin bài hát khi tải playlist hoặc lịch sử nghe, User Service sẽ áp dụng kỹ thuật **Phi chuẩn hóa (Denormalization)**.
- User Service sẽ lưu trữ bản sao dữ liệu như `song_title`, `artist_name`, `cover_image` ngay trong database của nó (`playlist_songs`, `favorites`, `play_history`).
- **Đồng bộ hóa sự kiện qua Kafka (Eventual Consistency)**: Khi nghệ sĩ cập nhật tên sân khấu hoặc ảnh đại diện, `artists-service` phát một event lên topic `artist-events-topic`. `catalog-service` và `users-service` lắng nghe và tự động cập nhật lại các trường phi chuẩn hóa.
- Nếu Catalog Service xóa mềm (soft delete) một bài hát, dữ liệu bên User Service vẫn tồn tại, nhưng khi user click vào phát nhạc sẽ nhận thông báo lỗi từ Catalog.

### 2.5. Frontend: 3 project React độc lập, 3 domain/origin riêng biệt

- Xây dựng **3 project React tách biệt hoàn toàn**:
  - User app: `http://localhost:5173`
  - Artist app: `http://localhost:5172`
  - Admin app: `http://localhost:5171`
- Cô lập token bằng Same-Origin Policy (SOP).
- Cấu hình CORS chặt chẽ tại Gateway.

---

## 3. Sơ đồ kiến trúc tổng quan

```text
                    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
                    │ User web      │  │Artist web     │  │Admin web      │
                    │(Port 5173)    │  │(Port 5172)    │  │(Port 5171)    │
                    │Nghe nhạc, yêu │  │Đăng bài, xem  │  │Quản lý &      │
                    │thích, playlist│  │lý do vi phạm  │  │kiểm duyệt nhạc│
                    └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
                            │                  │                  │
                            └──────────────────┼──────────────────┘
                                                ▼
                                    ┌─────────────────────────┐
                                    │   API Gateway (8686)    │
                                    │ Định tuyến theo path    │
                                    │ CORS 3 frontends        │
                                    │ KHÔNG xác thực JWT      │
                                    └────────────┬────────────┘
               ┌───────────────────────────┬──────┴─────────────┬──────────────────────────┐
               ▼                           ▼                    ▼                          ▼
       ┌──────────────┐            ┌──────────────┐  ┌───────────────────────┐   ┌──────────────┐
       │ User Service │            │Artist Service│  │  Catalog Service      │   │Admin Service │
       │ (Port 8082)  │◄──Internal─│ (Port 8083)  │  │  (Port 8081)          │   │ (Port 8084)  │
       │ Tài khoản,   │            │Tài khoản,    │  │  Bài hát, upload,     │   │Tài khoản     │
       │ playlist,    │            │profile       │  │  duyệt/từ chối kèm    │   │quản trị,     │
       │ lịch sử nghe │            │secretArtist  │  │  lý do, bộ đếm        │   │khóa/mở user  │
       │ secretUser   │            │              │  │  Multi-issuer JWT     │   │secretAdmin   │
       └──────┬───────┘            └──────┬───────┘  └─────────┬─────────────┘   └──────┬───────┘
              │                           │                    │                        │
              │                           │ Event Publish      │                        │
              │                           ▼                    │                        │
              │                 ┌────────────────────┐         │                        │
              │◄──Event Consumer┤    Apache Kafka    ├─────────┤ Event Consumer         │
              │                 │ artist-events-topic│         │                        │
              │                 └────────────────────┘         │                        │
              └───────────────────────────┬────────────────────┴────────────────────────┘
                                          ▼
                          ┌───────────────────────────────┐
                          │   PostgreSQL 15 (1 instance)  │
                          │   Schema riêng theo service:  │
                          │   • mc_music_users_schema     │
                          │   • mc_music_artists_schema   │
                          │   • mc_music_admin_schema     │
                          │   • mc_music_catalog_schema   │
                          └───────────────────────────────┘
                          ┌───────────────────────────────┐
                          │      Cloudinary Storage       │
                          │  Lưu trữ file nhạc & ảnh bìa  │
                          │  (Gọi từ Catalog Service)     │
                          └───────────────────────────────┘
```

---

## 4. Danh sách service và chức năng

### 4.1. API Gateway (Port 8686)
- Định tuyến HTTP request tới 4 service theo URL path.
- Xử lý cấu hình CORS cho 3 domain frontend.

### 4.2. User Service (Port 8082)
- Quản lý xác thực User (Login, Register, Refresh Token, Logout).
- Quản lý dữ liệu người dùng: Playlists, Favorites, Follows, Lịch sử nghe nhạc.
- **Sử dụng Internal API:** Khi User bấm like hoặc phát bài hát, service sẽ gửi HTTP request nội bộ sang Catalog Service để tăng bộ đếm (`like_count`, `play_count`).
- **Kafka Listener:** Đồng bộ tên/avatar nghệ sĩ khi nhận `ArtistProfileUpdatedEvent`.

### 4.3. Artist Service (Port 8083)
- Quản lý xác thực Artist.
- Quản lý hồ sơ nghệ sĩ (Bio, Avatar, Cover).
- Lấy dữ liệu thống kê từ Catalog Service để hiển thị Dashboard cho Artist.
- **Kafka Producer:** Phát sự kiện lên `artist-events-topic` khi đổi thông tin hồ sơ.

### 4.4. Admin Service (Port 8084)
- Quản lý xác thực Admin.
- Xem danh sách và thực hiện khóa/mở tài khoản User/Artist qua OpenFeign.

### 4.5. Catalog Service (Port 8081)
- Xử lý upload trực tiếp file nhạc và ảnh bìa lên **Cloudinary**.
- Quản lý metadata bài hát, album, thể loại, ca sĩ hợp tác (feat), lời bài hát đồng bộ.
- Trực tiếp lưu trữ thông số thống kê (`play_count`, `like_count`) trong bảng bài hát.
- **Quy trình kiểm duyệt âm nhạc:** Duyệt bài hát/album sang `APPROVED` hoặc từ chối vi phạm sang `REJECTED`/`TAKEDOWN` kèm lý do vi phạm (`rejection_reason`).
- Xác thực JWT đa nguồn (User/Artist/Admin) để phân quyền.

---

## 5. Bảng dữ liệu theo từng service (Chi tiết)

### 5.1. User Service (`mc_music_users_schema`)
- `users`: `id`, `email`, `password_hash`, `full_name`, `avatar_url`, `is_active` (để Admin khóa), `created_at`
- `refresh_tokens`: `id`, `user_id`, `token`, `expires_at`, `created_at`
- `playlists`: `id`, `user_id`, `name`, `description`, `cover_image`, `is_public`, `created_at`
- `playlist_songs`: `playlist_id`, `song_id`, `song_title` (nhân bản), `artist_name` (nhân bản), `cover_image` (nhân bản), `added_at`
- `favorites`: `user_id`, `song_id`, `song_title` (nhân bản), `artist_name` (nhân bản), `cover_image` (nhân bản), `created_at`
- `favorite_albums`: `user_id`, `album_id`, `album_title` (nhân bản), `artist_name` (nhân bản), `cover_image` (nhân bản), `created_at`
- `follows`: `user_id`, `artist_id`, `artist_name` (nhân bản), `avatar_url` (nhân bản), `created_at`
- `play_history`: `id`, `user_id`, `song_id`, `song_title` (nhân bản), `artist_name` (nhân bản), `cover_image` (nhân bản), `played_at`, `duration_listened`

### 5.2. Artist Service (`mc_music_artists_schema`)
- `artists`: `id`, `email`, `password_hash`, `stage_name`, `biography`, `avatar_url`, `cover_url`, `is_active` (để Admin khóa), `follower_count`, `created_at`
- `refresh_tokens`: `id`, `artist_id`, `token`, `expires_at`, `created_at`

### 5.3. Admin Service (`mc_music_admin_schema`)
- `admins`: `id`, `email`, `password_hash`, `full_name`, `role`, `created_at`
- `refresh_tokens`: `id`, `admin_id`, `token`, `expires_at`, `created_at`

### 5.4. Catalog Service (`mc_music_catalog_schema`)
- `genres`: `id`, `name`, `cover_image`
- `albums`: `id`, `owner_id` (quyền sở hữu), `owner_name` (nhân bản tên nghệ sĩ), `title`, `album_type` (ALBUM, SINGLE, EP), `description`, `total_tracks`, `cover_image`, `release_date`, `status` (PENDING, APPROVED, REJECTED, TAKEDOWN), `rejection_reason` (lý do từ chối/hủy), `like_count`, `is_deleted` (xóa mềm), `created_at`
- `songs`: `id`, `owner_id` (quyền sở hữu), `owner_name` (nhân bản tên nghệ sĩ), `album_id`, `title`, `track_number`, `duration_seconds`, `audio_url`, `audio_public_id`, `cover_image`, `explicit`, `play_count`, `like_count`, `status` (PENDING, APPROVED, REJECTED, TAKEDOWN), `rejection_reason` (lý do từ chối/hủy), `is_deleted` (xóa mềm), `created_at`
- `song_artists` (Nhiều nghệ sĩ/Feat): `song_id`, `artist_id`, `artist_name` (nhân bản), `role` (MAIN, FEATURED, PRODUCER)
- `song_genres` (Đa thể loại): `song_id`, `genre_id`
- `lyrics` (Lời bài hát): `song_id`, `content`, `synced_content`, `language`
- `system_playlists` (Playlist hệ thống): `id`, `name`, `description`, `cover_image`, `created_by_admin_id`, `created_at`
- `system_playlist_songs`: `playlist_id`, `song_id`, `position_order`, `added_at`
