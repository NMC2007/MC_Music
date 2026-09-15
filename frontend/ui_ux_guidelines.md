# Hệ thống Thiết kế & Hướng dẫn UI/UX Frontend (MC Music)

Tài liệu này đóng vai trò là "Kim chỉ nam" cho toàn bộ quá trình phát triển Frontend của dự án MC Music (User Web, Artist Web, Admin Web). Bất kỳ trang nào hoặc component nào được tạo ra đều **BẮT BUỘC** tuân thủ các quy tắc trong tài liệu này để đảm bảo giao diện đẹp, hiện đại, và trải nghiệm người dùng (UX) đồng nhất.

---

## 1. Nguyên tắc cốt lõi (Core Principles)

1. **Mobile-First & Fully Responsive**: Giao diện phải thân thiện và hiển thị hoàn hảo trên mọi thiết bị (Điện thoại, Tablet, Desktop). Sử dụng các breakpoint mặc định của Tailwind (`sm`, `md`, `lg`, `xl`, `2xl`).
2. **Modern Dark Theme**: Sử dụng thiết kế nền tối (Dark Mode) xuyên suốt giống Spotify, giúp làm nổi bật màu sắc nghệ thuật của các album/bài hát và bảo vệ mắt người dùng khi nghe nhạc ban đêm.
3. **Glassmorphism & Độ sâu (Depth)**: Áp dụng hiệu ứng kính mờ (backdrop-blur) ở thanh Topbar và Bottom Player. Sử dụng đổ bóng (shadow) và các lớp nền có độ sáng khác nhau để phân cấp UI.
4. **Vi mô tương tác (Micro-interactions)**: Mọi thao tác (hover, click, focus) đều phải có hiệu ứng transition mượt mà (VD: đổi màu nhẹ, scale nút bấm).

---

## 2. Công nghệ (Tech Stack)
- **Framework**: ReactJS (Phiên bản 19+)
- **Styling**: Tailwind CSS (Sử dụng utility-first classes, hạn chế tối đa việc viết CSS thuần hoặc inline-style).
- **Icons**: Lucide React (Đồng nhất nét vẽ, độ dày icon).

---

## 3. Hệ thống Màu sắc (Color Palette)

Màu sắc chủ đạo đã được chốt là **#fa2d48 (Đỏ Neon)**. Nó đại diện cho sự năng động và nhiệt huyết.

### 3.1. Màu nền (Backgrounds - Dark Mode)
Để tạo chiều sâu, chúng ta không dùng một màu đen duy nhất mà dùng hệ thống màu xám đậm:
- **Base Background (`bg-neutral-950`)**: Nền chính của toàn bộ ứng dụng (`#0a0a0a`).
- **Surface/Sidebar (`bg-neutral-900`)**: Nền của thanh Sidebar, Bottom Player, hoặc các Card (`#171717`).
- **Elevated/Hover (`bg-neutral-800`)**: Nền khi hover vào một dòng bài hát hoặc component nổi (`#262626`).

### 3.2. Màu thương hiệu (Brand Colors)
- **Primary (`text-primary`, `bg-primary`)**: `#fa2d48` (Dùng cho Nút Play, Nút bấm chính, text đang active, hover links).
- **Primary Hover**: `#e0223e` (Dùng khi hover vào nút có màu nền Primary).
- **Primary Glow**: Sử dụng bóng đổ màu đỏ (drop-shadow hoặc box-shadow) với độ mờ (opacity) khoảng 20-30% cho các thành phần nhấn mạnh.

### 3.3. Màu chữ (Typography Colors)
- **Primary Text (`text-white` / `text-neutral-50`)**: Dùng cho tiêu đề, tên bài hát, chữ nhấn mạnh.
- **Secondary Text (`text-neutral-400`)**: Dùng cho tên nghệ sĩ, thời lượng, mô tả phụ (`#a3a3a3`).
- **Disabled Text (`text-neutral-600`)**: Dùng cho icon hoặc text bị vô hiệu hóa.

---

## 4. Kiểu chữ (Typography)

**Font Family**: Tròn, không chân, hiện đại (Sử dụng Inter, Roboto, hoặc Circular Std nếu có).

**Cấp độ Text**:
- **Heading 1**: 24px - 32px (`text-2xl` đến `text-4xl`), Font-weight: 700 (Bold) - Dùng cho lời chào, tên Playlist lớn.
- **Heading 2**: 18px - 22px (`text-lg` đến `text-xl`), Font-weight: 700 (Bold) - Dùng cho tiêu đề các section (VD: "Đài phát đề xuất").
- **Body 1 (Primary)**: 14px - 16px (`text-sm` đến `text-base`), Font-weight: 500 (Medium) - Tên bài hát, tên nghệ sĩ trên thẻ.
- **Body 2 (Secondary)**: 12px - 14px (`text-xs` đến `text-sm`), Font-weight: 400 (Regular) - Subtitle, thông tin phụ.

---

## 5. Bố cục (Layout) & Spacing

### 5.1. Cấu trúc trang Web Nghe nhạc (SPA)
Layout bắt buộc chia làm 3 vùng độc lập, không làm trang web cuộn toàn bộ:
1. **Sidebar (Trái)**: Cố định (Fixed/Sticky). Chứa logo, menu điều hướng, danh sách playlist. Ẩn trên Mobile (thay bằng Bottom Navigation hoặc Hamburger menu).
2. **Main Content (Phải, Ở giữa)**: Có thanh cuộn độc lập (`overflow-y-auto`). Background có hiệu ứng gradient mờ ở phía trên cùng để hoà quyện với cover của Playlist/Album.
3. **Bottom Player (Dưới cùng)**: Cố định tuyệt đối ở dưới (`fixed bottom-0 w-full`), đè lên các nội dung khác (`z-50`).

### 5.2. Khoảng cách (Spacing & Rounded)
- Sử dụng chuẩn spacing của Tailwind (`p-4`, `p-6`, `gap-4`).
- **Border Radius**: 
  - Nút bấm (Buttons): Bầu bĩnh `rounded-full`.
  - Hình ảnh Album/Card: `rounded-md` hoặc `rounded-lg`.
  - Ảnh đại diện nghệ sĩ: `rounded-full` (Hình tròn).

---

## 6. Hướng dẫn UI Component

### 6.1. Nút bấm (Buttons)
- **Primary Button**: Nền đỏ, chữ trắng. 
  - Class: `bg-[#fa2d48] hover:bg-[#e0223e] text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105`
- **Secondary Button**: Outline hoặc trong suốt.
  - Class: `bg-transparent border border-neutral-500 text-white hover:border-white font-bold py-2 px-6 rounded-full transition-all`
- **Play Button (Tròn)**:
  - Class: `w-12 h-12 bg-[#fa2d48] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-[0_8px_16px_rgba(250,45,72,0.3)]`

### 6.2. Card (Bài hát / Album)
- Card phải có hiệu ứng hover mượt mà: khi hover, nền sáng lên một chút và nút Play (bị ẩn mặc định) sẽ xuất hiện đè lên ảnh cover.
- Class nền Card: `p-4 bg-neutral-900/40 hover:bg-neutral-800 transition-colors rounded-lg group cursor-pointer`

### 6.3. Inputs & Forms
- Ô tìm kiếm / Nhập liệu: Nền xám đậm, không viền, đổi màu viền sang đỏ khi Focus.
- Class: `bg-neutral-800 text-white placeholder-neutral-500 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-[#fa2d48]/50 transition-all w-full`

### 6.4. Scrollbar (Thanh cuộn)
- Tuỳ biến thanh cuộn mỏng, màu tối để không phá vỡ UI.
- Class (Tailwind plugins hoặc CSS thuần): `scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-500`

---

## 7. UX & Hiệu ứng (Animations)
- Sử dụng utility `transition-all duration-300 ease-in-out` trên hầu hết các phần tử có tương tác.
- **Glassmorphism**: Áp dụng cho Topbar khi cuộn trang.
  - Class: `bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40`
- **Skeleton Loading**: Khi đang gọi API, tuyệt đối không để trống màn hình. Trình bày các cục xám nhấp nháy (`animate-pulse bg-neutral-800`) giữ nguyên form layout.

---

*Lưu ý: Bất kỳ lập trình viên nào khi tham gia phát triển Frontend cho dự án này đều phải đọc kỹ và tuân thủ các quy định tại file này nhằm đảm bảo MC Music luôn là một nền tảng âm nhạc có tính thẩm mỹ và trải nghiệm cao cấp nhất.*
