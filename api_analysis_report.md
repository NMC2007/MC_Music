# Phân tích Yêu cầu và Danh sách API Nền tảng Nghe nhạc

Để xây dựng một trang nghe nhạc trực tuyến đạt chuẩn (lấy cảm hứng từ Spotify, Zing MP3, Apple Music), chúng ta cần nhìn nhận từ góc độ trải nghiệm người dùng (UX) và sau đó ánh xạ thành các nghiệp vụ Backend.

## 1. Phân tích nghiệp vụ từ góc độ Người dùng (User Perspective)

Một người dùng khi vào trang nghe nhạc sẽ cần các nhóm chức năng cốt lõi sau:

1. **Khám phá (Discovery)**:
   - Ngay khi vào trang chủ, cần thấy các mục như: *Bài hát nổi bật, Album mới phát hành, Playlist hệ thống, Thể loại nhạc (Pop, EDM...)*.
   - Tính năng **Tìm kiếm (Search)** bài hát, nghệ sĩ hoặc album theo từ khóa.
2. **Trải nghiệm nghe nhạc (Streaming & Player)**:
   - Phát nhạc liền mạch (Audio Streaming).
   - Xem lời bài hát (Lyrics) chạy đồng bộ với nhạc.
   - Ghi nhận lượt nghe (Play count) và lưu vào lịch sử nghe nhạc (Recently Played).
3. **Thư viện cá nhân (Personal Library)**:
   - **Yêu thích (Favorites/Liked Songs)**: Thả tim bài hát để nghe lại.
   - **Playlist cá nhân**: Tự tạo playlist, thêm/bớt bài hát vào playlist của mình.
   - **Theo dõi (Follow)**: Nhấn theo dõi các nghệ sĩ yêu thích để cập nhật nhạc mới.

Từ các nhu cầu trên, kết hợp với luồng **Đăng tải của Nghệ sĩ** và **Kiểm duyệt của Admin**, tôi đã tổng hợp toàn bộ các API cần thiết cho hệ thống theo bảng dưới đây.

---

## 2. Bảng Danh sách API Toàn hệ thống (Chia theo HTTP Method)

Dựa vào thiết kế cơ sở dữ liệu và 4 microservices hiện tại (`users-service`, `artists-service`, `admin-service`, `catalog-service`), dưới đây là danh sách các API cần thiết.

### Nhóm HTTP GET (Lấy dữ liệu)

| Endpoint | Chức năng (Nghiệp vụ) | Đối tượng truy cập | Service xử lý | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `/api/catalog/public/genres` | Lấy danh sách thể loại nhạc | Public / User | `catalog-service` | Hiển thị menu/trang chủ |
| `/api/catalog/public/songs/trending` | Lấy top bài hát nhiều lượt nghe nhất | Public / User | `catalog-service` | Hiển thị trang chủ |
| `/api/catalog/public/albums/latest` | Lấy danh sách album mới phát hành | Public / User | `catalog-service` | Lọc theo `status=APPROVED` |
| `/api/catalog/public/search` | Tìm kiếm (Bài hát, Album, Nghệ sĩ) | Public / User | `catalog-service` | Full-text search cơ bản |
| `/api/catalog/public/songs/{id}` | Lấy chi tiết bài hát & link Audio stream | Public / User | `catalog-service` | Tăng `play_count` ngầm khi gọi |
| `/api/catalog/public/songs/{id}/lyrics` | Lấy lời bài hát | Public / User | `catalog-service` | |
| `/api/user/playlists` | Xem danh sách playlist cá nhân | User | `users-service` | Cần Bearer Token (User) |
| `/api/user/playlists/{id}/songs` | Xem các bài hát trong 1 playlist | User | `users-service` | Join bảng `playlist_songs` |
| `/api/user/favorites` | Xem danh sách bài hát đã thả tim | User | `users-service` | Join bảng `favorites` |
| `/api/user/history` | Xem lịch sử nghe nhạc gần đây | User | `users-service` | Join bảng `play_history` |
| `/api/catalog/artist/albums` | Xem danh sách album do mình tạo | Artist | `catalog-service` | Cần Bearer Token (Artist) |
| `/api/catalog/artist/songs` | Xem danh sách bài hát do mình đăng | Artist | `catalog-service` | Bao gồm cả nhạc `PENDING` |
| `/api/catalog/admin/songs/pending` | Xem danh sách nhạc đang chờ duyệt | Admin | `catalog-service` | Lọc `status=PENDING` |

### Nhóm HTTP POST (Tạo mới dữ liệu)

| Endpoint | Chức năng (Nghiệp vụ) | Đối tượng truy cập | Service xử lý | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `/api/user/auth/register` | Đăng ký tài khoản User | Public | `users-service` | |
| `/api/user/auth/login` | Đăng nhập tài khoản User | Public | `users-service` | Trả về JWT Access/Refresh |
| `/api/artist/auth/register` | Đăng ký tài khoản Nghệ sĩ | Public | `artists-service` | |
| `/api/artist/auth/login` | Đăng nhập tài khoản Nghệ sĩ | Public | `artists-service` | Trả về JWT Access/Refresh |
| `/api/admin/auth/login` | Đăng nhập Admin | Public | `admin-service` | Trả về JWT Access/Refresh |
| `/api/catalog/artist/albums` | Tạo Album mới | Artist | `catalog-service` | Gọi Cloudinary upload ảnh bìa |
| `/api/catalog/artist/songs` | Upload bài hát mới (Audio + Cover) | Artist | `catalog-service` | Upload audio lên Cloudinary, lưu DB `PENDING` |
| `/api/user/playlists` | Tạo Playlist cá nhân rỗng | User | `users-service` | |
| `/api/user/playlists/{playlistId}/songs`| Thêm 1 bài hát vào playlist | User | `users-service` | |
| `/api/user/favorites/{songId}` | Thả tim (Like) bài hát | User | `users-service` | Gọi thêm Internal API tăng `like_count` ở Catalog |
| `/api/user/follows/{artistId}` | Theo dõi nghệ sĩ | User | `users-service` | |
| `/api/user/history` | Ghi nhận lịch sử 1 lần nghe nhạc | User | `users-service` | Called by Frontend khi play > 30s |

### Nhóm HTTP PUT / PATCH (Cập nhật dữ liệu)

| Endpoint | Chức năng (Nghiệp vụ) | Đối tượng truy cập | Service xử lý | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `/api/catalog/artist/albums/{id}` | Sửa thông tin Album (Tên, mô tả) | Artist | `catalog-service` | |
| `/api/catalog/artist/songs/{id}` | Sửa thông tin bài hát (Đổi tên, genre) | Artist | `catalog-service` | Không đổi file audio |
| `/api/catalog/admin/songs/{id}/status` | Duyệt nhạc / Từ chối / Gỡ bài hát | Admin | `catalog-service` | Đổi status sang `APPROVED`, `REJECTED`, `TAKEDOWN` |
| `/api/admin/users/{id}/status` | Khóa / Mở khóa tài khoản User | Admin | `admin-service` | Set `is_active = false` |
| `/api/user/profile` | Sửa thông tin cá nhân (Avatar, Tên) | User | `users-service` | |

### Nhóm HTTP DELETE (Xóa dữ liệu)

| Endpoint | Chức năng (Nghiệp vụ) | Đối tượng truy cập | Service xử lý | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `/api/catalog/artist/albums/{id}` | Xóa Album của mình | Artist | `catalog-service` | Cần check điều kiện |
| `/api/catalog/artist/songs/{id}` | Xóa bài hát của mình | Artist | `catalog-service` | Xóa file trên Cloudinary, Soft Delete trên DB |
| `/api/user/playlists/{id}` | Xóa Playlist cá nhân | User | `users-service` | |
| `/api/user/playlists/{playlistId}/songs/{songId}` | Bỏ 1 bài hát khỏi playlist | User | `users-service` | |
| `/api/user/favorites/{songId}` | Bỏ thả tim (Unlike) bài hát | User | `users-service` | Gọi Internal API giảm `like_count` ở Catalog |
| `/api/user/follows/{artistId}` | Bỏ theo dõi nghệ sĩ | User | `users-service` | |

---

## 3. Kết luận và Khuyến nghị cho Phiên làm việc

Dựa vào bảng trên, để người dùng (User) có thể **"khám phá và trải nghiệm nghe nhạc"**, họ cần gọi các API mang prefix `/api/catalog/public/...`. Tuy nhiên, các API public này chỉ trả về nhạc khi bảng `songs` có dữ liệu với trạng thái `status = 'APPROVED'`.

Đó là lý do đề xuất **tập trung triển khai `catalog-service`** của bạn là **bước đi chính xác và chuẩn mực nhất lúc này**. Cụ thể, trong phiên làm việc này, chúng ta sẽ xây dựng các API:

1. **POST `/api/catalog/artist/songs`** (Artist upload nhạc lên Cloudinary, lưu DB `PENDING`).
2. **PATCH `/api/catalog/admin/songs/{id}/status`** (Admin duyệt nhạc sang `APPROVED`).
3. **GET `/api/catalog/public/songs/trending`** và **GET `/api/catalog/public/albums/latest`** (Để hiển thị nhạc đã duyệt ra cho User nghe).

Cách làm này đảm bảo luồng nghiệp vụ chảy xuyên suốt từ người sáng tạo (Artist) -> người kiểm duyệt (Admin) -> người tiêu thụ (User) bằng dữ liệu thật 100%.
