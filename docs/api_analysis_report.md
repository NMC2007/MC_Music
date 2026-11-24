# Phân tích Yêu cầu và Danh sách API Toàn Hệ thống (MC Music)

Tài liệu này quy chuẩn toàn bộ danh mục API RESTful trong hệ sinh thái MC Music, kết nối giữa 4 Microservices (`users-service`, `artists-service`, `admin-service`, `catalog-service`) thông qua API Gateway (Port 8686).

---

## 1. Phân tích nghiệp vụ theo Nhóm người dùng

1. **Khách vãng lai & Người nghe nhạc (Public / User)**:
   - Khám phá nhạc trang chủ: Thể loại, Top thịnh hành (`trending`), Album mới nhất, Tìm kiếm toàn năng (`search`).
   - Trải nghiệm phát nhạc (Streaming), xem lời bài hát đồng bộ (`lyrics`), lịch sử nghe gần đây (`history`).
   - Thư viện cá nhân: Quản lý playlist (tạo, sửa, xóa, thêm bài hát), thả tim (yêu thích bài hát & album), theo dõi nghệ sĩ.
2. **Nghệ sĩ sáng tạo (Artist)**:
   - Đăng ký/đăng nhập, cập nhật hồ sơ nghệ sĩ (bio, avatar, cover).
   - Tải lên ca khúc mới, tạo album (mặc định trạng thái `PENDING`), gán thể loại, mời nghệ sĩ hợp tác (feat), nhập lời bài hát.
   - Bảng điều khiển Studio (Dashboard) theo dõi lượt nghe và theo dõi.
   - **Xem phản hồi kiểm duyệt:** Nếu bài hát/album bị từ chối duyệt (`REJECTED`) hoặc gỡ bỏ (`TAKEDOWN`), nghệ sĩ nhận được lý do vi phạm (`rejectionReason`) từ Admin để khắc phục.
3. **Quản trị viên hệ thống (Admin)**:
   - Đăng nhập bảo mật tài khoản Admin.
   - **Kiểm duyệt bài hát & album:** Xem danh sách chờ duyệt (`PENDING`), nghe thử thẩm định âm thanh, phê duyệt (`APPROVED`) hoặc từ chối (`REJECTED`) kèm lý do theo Bộ quy tắc kiểm duyệt chuẩn hóa.
   - **Giám sát tài khoản:** Xem danh sách User & Artist, thực hiện khóa hoặc mở khóa tài khoản (`isActive = false/true`).

---

## 2. Bảng Danh sách API Chi tiết

### 2.1. Nhóm HTTP GET (Truy vấn dữ liệu)

| Endpoint | Chức năng (Nghiệp vụ) | Quyền truy cập | Service xử lý | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `/api/catalog/public/genres` | Lấy danh sách thể loại nhạc | Public | `catalog-service` | |
| `/api/catalog/public/songs/trending` | Lấy top bài hát nhiều lượt nghe nhất | Public | `catalog-service` | Lọc `status=APPROVED` |
| `/api/catalog/public/albums/latest` | Lấy danh sách album mới phát hành | Public | `catalog-service` | Lọc `status=APPROVED` |
| `/api/catalog/public/search` | Tìm kiếm tổng hợp (bài hát, album, nghệ sĩ) | Public | `catalog-service` | Hỗ trợ phân trang |
| `/api/catalog/public/songs/{id}` | Lấy chi tiết bài hát & link audio stream | Public | `catalog-service` | Tăng ngầm `play_count` |
| `/api/catalog/public/songs/{id}/lyrics` | Lấy lời bài hát (lời tĩnh & synced LRC) | Public | `catalog-service` | |
| `/api/catalog/public/albums/{id}/songs` | Lấy danh sách bài hát trong album | Public | `catalog-service` | Sắp xếp theo `track_number` |
| `/api/user/me` | Lấy thông tin cá nhân của User hiện tại | User (Bearer) | `users-service` | |
| `/api/user/playlists` | Xem danh sách playlist cá nhân | User (Bearer) | `users-service` | |
| `/api/user/playlists/{id}/songs` | Xem danh sách bài hát trong playlist | User (Bearer) | `users-service` | |
| `/api/user/favorites` | Xem danh sách bài hát đã thả tim | User (Bearer) | `users-service` | |
| `/api/user/favorites/albums` | Xem danh sách album đã yêu thích | User (Bearer) | `users-service` | |
| `/api/user/follows/artists` | Xem danh sách nghệ sĩ đang theo dõi | User (Bearer) | `users-service` | |
| `/api/user/history` | Xem lịch sử nghe nhạc gần đây | User (Bearer) | `users-service` | |
| `/api/artist/me` | Lấy thông tin hồ sơ nghệ sĩ | Artist (Bearer) | `artists-service` | |
| `/api/artist/dashboard` | Xem số liệu thống kê Studio | Artist (Bearer) | `artists-service` | Lấy stats từ Catalog |
| `/api/catalog/artist/songs` | Xem danh sách bài hát do mình tải lên | Artist (Bearer) | `catalog-service` | Hỗ trợ phân trang, lọc `status`, `isDeleted`, tìm kiếm `keyword` |
| `/api/catalog/artist/albums` | Xem danh sách album do mình tạo | Artist (Bearer) | `catalog-service` | Trả về cả `status` & `rejectionReason` |
| `/api/catalog/admin/songs/pending` | Lấy danh sách bài hát chờ duyệt | Admin (Bearer) | `catalog-service` | Lọc `status=PENDING` |
| `/api/catalog/admin/albums/pending` | Lấy danh sách album chờ duyệt | Admin (Bearer) | `catalog-service` | Lọc `status=PENDING` |
| `/api/admin/users` | Lấy danh sách tài khoản người dùng | Admin (Bearer) | `admin-service` | Phân trang, gọi sang User Service |
| `/api/admin/artists` | Lấy danh sách tài khoản nghệ sĩ | Admin (Bearer) | `admin-service` | Phân trang, gọi sang Artist Service |

---

### 2.2. Nhóm HTTP POST (Tạo mới tài nguyên)

| Endpoint | Chức năng (Nghiệp vụ) | Quyền truy cập | Service xử lý | Payload / Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `/api/user/auth/register` | Đăng ký tài khoản User | Public | `users-service` | `{ email, password, fullName }` |
| `/api/user/auth/login` | Đăng nhập tài khoản User | Public | `users-service` | Trả về JWT Access & Refresh Token |
| `/api/artist/auth/register` | Đăng ký tài khoản Nghệ sĩ | Public | `artists-service` | `{ email, password, stageName }` |
| `/api/artist/auth/login` | Đăng nhập tài khoản Nghệ sĩ | Public | `artists-service` | Trả về JWT Access & Refresh Token |
| `/api/admin/auth/login` | Đăng nhập Quản trị viên | Public | `admin-service` | Trả về JWT Access & Refresh Token |
| `/api/catalog/artist/songs` | Tải lên ca khúc mới | Artist (Bearer) | `catalog-service` | Multipart form: audio + cover image + metadata |
| `/api/catalog/public/songs/batch` | Lấy chi tiết nhiều bài hát theo mảng IDs | Public | `catalog-service` | Body: Mảng UUID `["uuid-1", "uuid-2"]` |
| `/api/catalog/artist/albums` | Tạo Album mới | Artist (Bearer) | `catalog-service` | Multipart form: cover image + metadata |
| `/api/catalog/artist/songs/{id}/lyrics` | Thêm / Cập nhật lời bài hát | Artist (Bearer) | `catalog-service` | `{ content, syncedContent, language }` |
| `/api/catalog/artist/songs/{id}/artists` | Mời nghệ sĩ hợp tác (feat/producer) | Artist (Bearer) | `catalog-service` | `{ artistId, artistName, role }` |
| `/api/user/playlists` | Tạo Playlist cá nhân mới | User (Bearer) | `users-service` | `{ name, description, isPublic }` |
| `/api/user/playlists/{id}/songs` | Thêm bài hát vào Playlist | User (Bearer) | `users-service` | `{ songId, songTitle, artistName, coverImage }` |
| `/api/user/favorites/{songId}` | Thả tim (Like) bài hát | User (Bearer) | `users-service` | Tăng ngầm `like_count` ở Catalog |
| `/api/user/favorites/albums/{albumId}` | Thả tim Album | User (Bearer) | `users-service` | Tăng ngầm `like_count` ở Catalog |
| `/api/user/follows/artists/{artistId}` | Theo dõi nghệ sĩ | User (Bearer) | `users-service` | Tăng ngầm `follower_count` ở Artist |
| `/api/user/history` | Ghi nhận 1 lượt nghe bài hát | User (Bearer) | `users-service` | Gọi khi người dùng nghe > 30s |

---

### 2.3. Nhóm HTTP PUT / PATCH (Cập nhật dữ liệu)

| Endpoint | Chức năng (Nghiệp vụ) | Quyền truy cập | Service xử lý | Payload / Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `/api/catalog/admin/songs/{id}/status` | **Duyệt / Từ chối bài hát** | Admin (Bearer) | `catalog-service` | `{ "status": "APPROVED" | "REJECTED" | "TAKEDOWN", "rejectionReason": "..." }` |
| `/api/catalog/admin/albums/{id}/status` | **Duyệt / Từ chối album** | Admin (Bearer) | `catalog-service` | `{ "status": "APPROVED" | "REJECTED" | "TAKEDOWN", "rejectionReason": "..." }` |
| `/api/admin/users/{id}/status` | Khóa / Mở khóa tài khoản User | Admin (Bearer) | `admin-service` | `{ "isActive": boolean }` |
| `/api/admin/artists/{id}/status` | Khóa / Mở khóa tài khoản Artist | Admin (Bearer) | `admin-service` | `{ "isActive": boolean }` |
| `/api/catalog/artist/songs/{id}` | Cập nhật thông tin bài hát | Artist (Bearer) | `catalog-service` | Không thay đổi file audio |
| `/api/catalog/artist/albums/{id}` | Cập nhật thông tin album | Artist (Bearer) | `catalog-service` | |
| `/api/artist/me` | Cập nhật hồ sơ nghệ sĩ | Artist (Bearer) | `artists-service` | Phát Kafka event đồng bộ tên/ảnh |
| `/api/user/me` | Cập nhật thông tin User | User (Bearer) | `users-service` | |
| `/api/user/playlists/{id}` | Cập nhật thông tin playlist | User (Bearer) | `users-service` | |

---

### 2.4. Nhóm HTTP DELETE (Xóa dữ liệu)

| Endpoint | Chức năng (Nghiệp vụ) | Quyền truy cập | Service xử lý | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `/api/catalog/artist/songs/{id}` | Xóa bài hát | Artist (Bearer) | `catalog-service` | Xóa file Cloudinary & Soft-delete DB |
| `/api/catalog/artist/albums/{id}` | Xóa album | Artist (Bearer) | `catalog-service` | Soft-delete DB |
| `/api/user/playlists/{id}` | Xóa playlist cá nhân | User (Bearer) | `users-service` | |
| `/api/user/playlists/{id}/songs/{songId}` | Bỏ bài hát khỏi playlist | User (Bearer) | `users-service` | |
| `/api/user/favorites/{songId}` | Bỏ thích (Unlike) bài hát | User (Bearer) | `users-service` | Giảm ngầm `like_count` ở Catalog |
| `/api/user/favorites/albums/{albumId}` | Bỏ thích Album | User (Bearer) | `users-service` | Giảm ngầm `like_count` ở Catalog |
| `/api/user/follows/artists/{artistId}` | Hủy theo dõi nghệ sĩ | User (Bearer) | `users-service` | Giảm ngầm `follower_count` ở Artist |
