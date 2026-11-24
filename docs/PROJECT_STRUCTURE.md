# Tổng Quan Kiến Trúc Thư Mục Dự Án (MC Music Platform)

Tài liệu thể hiện chi tiết cây thư mục dự án và vai trò của từng thư mục, module, dịch vụ trong hệ thống theo phong cách trực quan hóa.

---

## 1. Sơ Đồ Tổng Quan Cấp Dự Án

```text
software-engineering-Music_website/
├── README.md                          # Tài liệu tổng quan dự án & hướng dẫn chạy Docker/Dev
├── docker-compose.yml                 # Điều phối 10 container trên mạng mc_music_network
├── .env.example                       # Mẫu biến môi trường gốc cho Docker Compose
├── database/
│   ├── init-docker.sql                # Script khởi tạo 4 schemas, 20 bảng & seed 12 thể loại
│   └── insert_mock_catalog_data.sql   # Tập dữ liệu bài hát/album mẫu phục vụ kiểm thử
├── docs/                              # Báo cáo phân tích API, kiến trúc và thiết kế CSDL Catalog
├── backend/
│   ├── quy-chuan-api.md               # Quy chuẩn RESTful API & chuẩn JSON ApiResponse
│   ├── shared-auth-lib/               # Module dùng chung JwtTokenProvider + JwtTokenProviderTest
│   ├── api-gateway/                   # Cổng định tuyến (Port 8686) + CorsConfigTest
│   ├── catalog-service/               # Quản lý nhạc/album/tìm kiếm/Cloudinary + 3 lớp test
│   ├── users-service/                 # Auth User, Playlist, Favorites, History + 3 lớp test
│   ├── artists-service/               # Auth Artist, Profile, Dashboard, Kafka + 2 lớp test
│   └── admin-service/                 # Auth Admin, Quản trị User/Artist + 2 lớp test
└── frontend/
    ├── ui_ux_guidelines.md            # Hệ thống thiết kế Dark Mode Spotify Red (#fa2d48)
    ├── users/                         # Ứng dụng User Web App (React 19, Vite, Tailwind 4)
    ├── artists/                       # Ứng dụng Artist Studio (React 19, Vite, Tailwind 4)
    └── admin/                         # Ứng dụng Admin Portal (React 19, Vite, Tailwind 4)
```

---

## 2. Chi Tiết Vai Trò Từng Thư Mục

### 2.1. Thư mục Cơ sở dữ liệu (`database/`)

Quản lý toàn bộ cấu trúc bảng, lược đồ schema và bộ dữ liệu seed/mock data cho PostgreSQL 15:

```text
database/
├── init-docker.sql                    # Script khởi tạo 4 schemas, 20 bảng & seed 12 thể loại
├── insert_mock_catalog_data.sql       # Tập dữ liệu bài hát/album mẫu phục vụ kiểm thử
├── console.sql                        # Script truy vấn, bảo trì và thao tác CSDL trực tiếp
└── db/                                # Workspace cấu hình kết nối DataGrip / IntelliJ Database
```

* **Vai trò**:
  - `mc_music_users_schema`: Quản lý 8 bảng người dùng, playlist, bài hát yêu thích, album yêu thích, theo dõi nghệ sĩ và lịch sử nghe nhạc.
  - `mc_music_artists_schema`: Quản lý 2 bảng nghệ sĩ và token xác thực của nghệ sĩ.
  - `mc_music_admin_schema`: Quản lý 2 bảng quản trị viên và token xác thực quản trị.
  - `mc_music_catalog_schema`: Quản lý 8 bảng kho nhạc: bài hát, album, nghệ sĩ hợp tác (feat), thể loại, lời bài hát karaoke (LRC), system playlists.

---

### 2.2. Thư mục Tài liệu (`docs/`)

Chứa toàn bộ tài liệu đặc tả nghiệp vụ, phân tích kỹ thuật và lộ trình thực thi:

```text
docs/
├── bao-cao-kien-truc-du-an_2.md       # Báo cáo phân tích kiến trúc microservices, Multi-Issuer & Kafka
├── api_analysis_report.md             # Danh sách và phân tích toàn bộ RESTful API của hệ thống
├── catalog_db_analysis.md             # Phân tích thiết kế chi tiết CSDL Catalog & quy tắc kiểm duyệt
└── ke-hoach-trien-khai.md             # Kế hoạch triển khai theo phương pháp Backend-First
```

---

### 2.3. Thư mục Backend (`backend/`)

Toàn bộ dịch vụ backend được xây dựng bằng **Java 17 & Spring Boot 4.1.1**, quản lý dependency qua Gradle:

```text
backend/
├── quy-chuan-api.md                   # Quy chuẩn RESTful API & chuẩn JSON ApiResponse
├── shared-auth-lib/                   # Module dùng chung JwtTokenProvider + JwtTokenProviderTest
├── api-gateway/                       # Cổng định tuyến (Port 8686) + CorsConfigTest
├── catalog-service/                   # Quản lý nhạc/album/tìm kiếm/Cloudinary + 3 lớp test
├── users-service/                     # Auth User, Playlist, Favorites, History + 3 lớp test
├── artists-service/                   # Auth Artist, Profile, Dashboard, Kafka + 2 lớp test
└── admin-service/                     # Auth Admin, Quản trị User/Artist + 2 lớp test
```

* **Vai trò & Công nghệ**:
  - `shared-auth-lib`: Thư viện tiện ích chung sinh và thẩm định JWT Token cho cả 3 domain mà không giữ cứng secret key.
  - `api-gateway` (Port 8686): Định tuyến request theo path prefix và quản lý chính sách CORS cho 3 ứng dụng frontend. Không giải mã JWT để giữ tính stateless.
  - `catalog-service` (Port 8081): Source of Truth của toàn bộ bài hát, album, thể loại, lời bài hát karaoke. Tích hợp Cloudinary SDK upload media. Hỗ trợ xác thực đa nguồn (Multi-Issuer JWT) từ 3 domain. Lắng nghe Kafka để cập nhật thông tin nghệ sĩ.
  - `users-service` (Port 8082): Xác thực User, quản lý Playlists, Favorites, Follows, Lịch sử nghe nhạc. Áp dụng kỹ thuật Denormalization lưu bản sao bài hát để tăng tốc truy vấn. Lắng nghe Kafka đồng bộ profile nghệ sĩ.
  - `artists-service` (Port 8083): Xác thực Artist, quản lý hồ sơ sân khấu (Bio, Avatar, Cover). Phát sự kiện Kafka lên `artist-events-topic` khi nghệ sĩ đổi thông tin.
  - `admin-service` (Port 8084): Xác thực Admin, quản lý danh sách tài khoản, khóa và mở khóa tài khoản User/Artist thông qua OpenFeign Client với header `X-Internal-Secret`.

---

### 2.4. Thư mục Frontend (`frontend/`)

Gồm 3 ứng dụng web độc lập xây dựng bằng **React 19, Vite, Tailwind CSS v4, Zustand, TanStack Query**:

```text
frontend/
├── ui_ux_guidelines.md            # Hệ thống thiết kế Dark Mode Spotify Red (#fa2d48)
├── users/                         # Ứng dụng User Web App (React 19, Vite, Tailwind 4)
├── artists/                       # Ứng dụng Artist Studio (React 19, Vite, Tailwind 4)
└── admin/                         # Ứng dụng Admin Portal (React 19, Vite, Tailwind 4)
```

* **Vai trò & Cổng truy cập**:
  - `ui_ux_guidelines.md`: Quy chuẩn thiết kế Spotify Red Dark Theme (`#fa2d48`), bố cục 3 vùng độc lập, hiệu ứng kính mờ (Glassmorphism), quy chuẩn typography và components.
  - `users/` (Port 5173): Ứng dụng cho người nghe nhạc: Nghe nhạc, tìm kiếm đa năng, thả tim, tạo playlist, đồng bộ phát nhạc với trình phát Bottom Player và lời bài hát Karaoke (LRC).
  - `artists/` (Port 5172): Ứng dụng cho nghệ sĩ: Dashboard thống kê lượt nghe, tải bài hát/album lên Cloudinary (chống timeout với AbortController), gán thể loại/feat/lời bài hát, theo dõi trạng thái duyệt và đọc lý do vi phạm.
  - `admin/` (Port 5171): Ứng dụng cho quản trị viên: Dashboard tổng quan, kiểm duyệt bài hát với Audio Preview Player tích hợp & Modal Bộ quy tắc vi phạm chuẩn hóa, kiểm duyệt album, khóa/mở khóa tài khoản User và Artist theo thời gian thực.

