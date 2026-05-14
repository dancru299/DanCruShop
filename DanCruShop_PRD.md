# PRD — DanCruShop

**Product Name:** DanCruShop  
**Version:** v0.1 — MVP Planning  
**Owner:** DanCru  
**Role perspective:** Product Manager + Tech Lead  
**Document type:** Product Requirements Document  
**Status:** Draft  
**Last updated:** 2026-05-13  

---

## 1. Tổng quan sản phẩm

DanCruShop là một website dạng **digital product shop / creator storefront** cho phép chủ sở hữu đăng bán và phân phối các sản phẩm số như:

- Source code
- Template
- Mini tool
- Tài liệu học tập
- Video khóa học
- Khóa học online
- Tài nguyên phục vụ lập trình, AI, backend, infrastructure, data, productivity

Mục tiêu ban đầu không phải xây dựng một nền tảng học trực tuyến phức tạp như Udemy, mà là một **cửa hàng cá nhân có thể mở rộng dần**.

---

## 2. Assumptions

Vì một số thông tin chưa được chốt, tài liệu này sử dụng các giả định sau:

1. **Assumption 1:** DanCruShop ban đầu phục vụ một creator cá nhân, chưa phải marketplace nhiều người bán.
2. **Assumption 2:** MVP ưu tiên bán digital products trước, khóa học/video là phase mở rộng.
3. **Assumption 3:** Người dùng có thể mua sản phẩm mà không cần hệ thống học tập quá phức tạp.
4. **Assumption 4:** Chủ website muốn dùng stack hiện đại, dễ deploy, dễ mở rộng.
5. **Assumption 5:** Thanh toán quốc tế ưu tiên Lemon Squeezy; thanh toán Việt Nam như MoMo/VNPay để phase sau.
6. **Assumption 6:** Video không lưu trực tiếp trên Supabase Storage mà dùng Bunny.net hoặc Cloudflare Stream.
7. **Assumption 7:** MVP chỉ có một admin chính là DanCru.
8. **Assumption 8:** File source code/tài liệu có thể lưu trên Supabase Storage hoặc private download link.
9. **Assumption 9:** Website cần SEO tốt để sau này kéo traffic từ Google, blog, YouTube, LinkedIn.
10. **Assumption 10:** Người mua cần dashboard để xem lại các sản phẩm đã mua.

---

## 3. Mục tiêu sản phẩm

### 3.1 Mục tiêu chính

Xây dựng một website cá nhân dạng cửa hàng số, nơi DanCru có thể:

- Trưng bày sản phẩm
- Bán source code, tool, template, tài liệu
- Phân phối file sau thanh toán
- Đăng video hoặc khóa học sau này
- Viết blog để tăng SEO
- Xây dựng thương hiệu cá nhân
- Biến các dự án cá nhân thành sản phẩm có thể bán

### 3.2 Mục tiêu kinh doanh

- Tạo kênh doanh thu từ sản phẩm số.
- Biến portfolio thành tài sản bán được.
- Hỗ trợ bán sản phẩm quốc tế.
- Tạo nền tảng để sau này bán khóa học, membership hoặc bundle.
- Xây dựng uy tín cá nhân trong lĩnh vực lập trình, AI, backend, infrastructure.

### 3.3 Mục tiêu kỹ thuật

- Dễ deploy.
- Dễ maintain.
- Tách rõ frontend, database, auth, payment, storage.
- Có khả năng mở rộng từ shop nhỏ thành learning/product platform.
- Bảo vệ file trả phí khỏi truy cập trái phép.
- Tích hợp webhook thanh toán ổn định.
- Hỗ trợ SEO tốt.

---

## 4. Non-goals trong MVP

MVP không tập trung vào:

- Marketplace nhiều seller.
- Affiliate system.
- Community/forum.
- Subscription/membership.
- App mobile.
- Livestream course.
- DRM video nâng cao.
- Hệ thống coupon phức tạp.
- Tự xử lý payment gateway.
- Hệ thống LMS đầy đủ như quiz, certificate, progress tracking chi tiết.

---

## 5. User Persona

### 5.1 Persona 1 — Người học lập trình / AI beginner

**Tên giả định:** Minh  
**Độ tuổi:** 18–25  
**Mục tiêu:**

- Muốn học qua project thực tế.
- Muốn mua source code mẫu để tham khảo.
- Muốn có tài liệu hướng dẫn rõ ràng.
- Muốn tiết kiệm thời gian tự setup.

**Pain points:**

- Khó tìm project mẫu chất lượng.
- Tutorial rời rạc.
- Không biết setup môi trường.
- Không biết cách tổ chức code chuẩn.

**Nhu cầu trên DanCruShop:**

- Xem demo sản phẩm.
- Đọc mô tả rõ ràng.
- Mua source code.
- Tải file sau thanh toán.
- Xem hướng dẫn setup.

---

### 5.2 Persona 2 — Developer muốn mua tool/template

**Tên giả định:** Long  
**Độ tuổi:** 22–30  
**Mục tiêu:**

- Muốn mua template để tiết kiệm thời gian.
- Muốn có code base sạch để customize.
- Muốn dùng tool nhỏ để giải quyết vấn đề cụ thể.

**Pain points:**

- Template miễn phí thường kém chất lượng.
- Dự án mẫu thiếu docs.
- Không rõ license sử dụng.

**Nhu cầu trên DanCruShop:**

- Xem tech stack.
- Xem screenshot/demo.
- Biết rõ quyền sử dụng.
- Tải file nhanh.
- Nhận update nếu sản phẩm được nâng cấp.

---

### 5.3 Persona 3 — Người theo dõi DanCru từ YouTube/LinkedIn

**Tên giả định:** Huy  
**Độ tuổi:** 18–28  
**Mục tiêu:**

- Theo dõi nội dung của DanCru.
- Muốn mua tài liệu/course liên quan video.
- Muốn xem các dự án DanCru đã làm.

**Pain points:**

- Nội dung nằm rải rác nhiều nơi.
- Khó tìm link source code/tài liệu liên quan video.
- Không có nơi tổng hợp sản phẩm.

**Nhu cầu trên DanCruShop:**

- Tìm sản phẩm theo video/chủ đề.
- Đọc blog/tutorial.
- Mua khóa học hoặc tài liệu.
- Theo dõi sản phẩm mới.

---

### 5.4 Persona 4 — Admin / Creator

**Tên:** DanCru  
**Mục tiêu:**

- Đăng sản phẩm nhanh.
- Quản lý đơn hàng.
- Quản lý file/video.
- Kiểm tra người dùng đã mua gì.
- Cập nhật sản phẩm.
- Viết blog/landing page.
- Tối ưu SEO.

**Pain points:**

- Không muốn quản lý thủ công qua Google Drive.
- Không muốn gửi file thủ công sau khi khách thanh toán.
- Cần hệ thống đủ đơn giản để tự maintain.
- Cần mở rộng được sang khóa học sau này.

---

## 6. User Flow

### 6.1 Flow khách truy cập xem sản phẩm

```text
User vào homepage
→ Xem danh sách sản phẩm nổi bật
→ Click vào product card
→ Vào product detail page
→ Xem mô tả, ảnh, demo, nội dung nhận được
→ Bấm Buy Now
→ Chuyển sang checkout
```

---

### 6.2 Flow mua sản phẩm

```text
User bấm Buy Now
→ Hệ thống tạo checkout session
→ Redirect sang Lemon Squeezy checkout
→ User thanh toán
→ Lemon Squeezy gửi webhook payment_success
→ Backend xác thực webhook
→ Tạo order + purchase trong Supabase
→ User được redirect về success page
→ User đăng nhập hoặc tạo tài khoản
→ Vào Dashboard
→ Xem sản phẩm đã mua
→ Tải file / xem video
```

---

### 6.3 Flow đăng nhập

```text
User bấm Login
→ Chọn email/password hoặc Google OAuth
→ Supabase Auth xác thực
→ Redirect về Dashboard
→ Load danh sách purchases
```

---

### 6.4 Flow xem sản phẩm đã mua

```text
User vào Dashboard
→ Hệ thống kiểm tra auth session
→ Query bảng purchases
→ Hiển thị danh sách sản phẩm đã mua
→ User click sản phẩm
→ Nếu là file: tạo signed download URL
→ Nếu là video: hiển thị video embed/player
→ Nếu là course: hiển thị lesson list
```

---

### 6.5 Flow admin tạo sản phẩm

```text
Admin login
→ Vào Admin Dashboard
→ Bấm Create Product
→ Nhập title, slug, description, price, category
→ Upload thumbnail
→ Gắn file/video/course content
→ Set trạng thái draft/published
→ Save
→ Product xuất hiện ngoài shop nếu published
```

---

### 6.6 Flow admin cập nhật sản phẩm

```text
Admin vào Product Management
→ Chọn sản phẩm
→ Sửa nội dung, giá, file, thumbnail
→ Save changes
→ Nếu có update file mới, version được ghi nhận
→ Người mua cũ có thể truy cập bản mới nếu policy cho phép
```

---

### 6.7 Flow blog/SEO

```text
Admin tạo bài viết
→ Viết nội dung dạng Markdown/MDX
→ Gắn product liên quan nếu có
→ Publish
→ Bài viết xuất hiện ở /blog
→ Google index bài viết
→ Người đọc chuyển đổi sang product page
```

---

## 7. Core Features

## 7.1 Public Website

### 7.1.1 Homepage

**Mục tiêu:** Giới thiệu thương hiệu, sản phẩm nổi bật, nội dung mới.

**Thành phần:**

- Hero section
- CTA chính: Browse Products
- CTA phụ: Read Blog / View Projects
- Featured products
- Latest blog posts
- Creator intro
- Testimonials hoặc social proof nếu có
- Newsletter signup sau MVP

---

### 7.1.2 Product Listing Page

**Route:** `/products`

**Chức năng:**

- Hiển thị danh sách sản phẩm.
- Filter theo category.
- Search cơ bản.
- Sort theo newest, price, popularity.
- Badge: Free, Paid, Course, Source Code, Template, Tool.

**Product card gồm:**

- Thumbnail
- Title
- Short description
- Price
- Category
- Tech stack tags
- CTA: View Detail

---

### 7.1.3 Product Detail Page

**Route:** `/products/[slug]`

**Thông tin hiển thị:**

- Tên sản phẩm
- Mô tả ngắn
- Mô tả chi tiết
- Giá
- Thumbnail/gallery
- Demo link nếu có
- GitHub preview nếu public
- Nội dung nhận được
- Tech stack
- Yêu cầu cài đặt
- License
- FAQ
- Changelog
- CTA Buy Now

**Trạng thái CTA:**

```text
Nếu chưa mua → Buy Now
Nếu đã mua → Go to Dashboard / Download
Nếu free → Get Free
Nếu sold out/unpublished → Not Available
```

---

### 7.1.4 Blog

**Route:** `/blog`

**Chức năng:**

- Hiển thị bài viết.
- Hỗ trợ SEO.
- Dùng để kéo traffic từ Google.
- Có thể gắn CTA đến sản phẩm.

**Blog post nên có:**

- Title
- Slug
- Excerpt
- Content MDX
- Cover image
- Tags
- Related products
- Published date
- SEO metadata

---

## 7.2 Authentication

### 7.2.1 Auth methods

MVP nên hỗ trợ:

- Email/password
- Google OAuth

### 7.2.2 User roles

```text
guest
customer
admin
```

### 7.2.3 Auth rules

- Guest được xem public pages.
- Customer được xem dashboard của mình.
- Admin được vào admin dashboard.
- Chỉ user đã mua mới tải được paid product.

---

## 7.3 Payment

### 7.3.1 Payment provider MVP

Ưu tiên MVP:

```text
Lemon Squeezy
```

### 7.3.2 Payment flow

```text
Product page
→ Create checkout
→ Lemon Squeezy checkout
→ Webhook payment_success
→ Create order
→ Create purchase
→ Unlock product
```

### 7.3.3 Webhook events cần xử lý

MVP:

- `order_created`
- `order_refunded`
- `subscription_created` — để dành phase sau
- `subscription_cancelled` — để dành phase sau

### 7.3.4 Payment status

```text
pending
paid
failed
refunded
cancelled
```

---

## 7.4 Dashboard cho người mua

**Route:** `/dashboard`

### Chức năng:

- Xem sản phẩm đã mua.
- Tải file.
- Xem video/course.
- Xem license key nếu có sau này.
- Xem lịch sử đơn hàng.
- Cập nhật profile.

### Dashboard sections:

```text
/dashboard
/dashboard/products
/dashboard/orders
/dashboard/settings
```

---

## 7.5 File Download

### Yêu cầu:

- File paid không được public.
- Download link nên là signed URL có thời hạn.
- User phải có purchase hợp lệ mới tải được.
- Có thể giới hạn số lần tải trong phase sau.

### File types:

- `.zip`
- `.pdf`
- `.md`
- `.txt`
- `.json`
- `.docx`
- `.xlsx`
- `.pptx`

---

## 7.6 Video / Course

### MVP

Trong MVP, chỉ cần hỗ trợ dạng đơn giản:

```text
Product type = course
Course có nhiều lessons
Lesson có video_url hoặc embed_url
Chưa cần progress tracking phức tạp
```

### Phase sau

- Lesson progress
- Mark as completed
- Quiz
- Certificate
- Drip content
- Comment/Q&A

---

## 7.7 Admin Dashboard

**Route:** `/admin`

### Chức năng MVP:

- Quản lý products.
- Tạo/sửa/xóa mềm sản phẩm.
- Upload thumbnail.
- Gắn file/video.
- Quản lý orders.
- Xem purchases.
- Quản lý blog posts.
- Publish/unpublish content.

### Admin pages:

```text
/admin
/admin/products
/admin/products/new
/admin/products/[id]/edit
/admin/orders
/admin/customers
/admin/blog
/admin/blog/new
/admin/settings
```

---

## 7.8 SEO

### Yêu cầu:

- Product page có metadata riêng.
- Blog post có metadata riêng.
- Open Graph image.
- Sitemap.
- Robots.txt.
- Clean URL.
- Schema markup cho product sau MVP.

### URL pattern:

```text
/
 /products
 /products/nextjs-saas-starter
 /blog
 /blog/how-to-build-ai-agent
 /dashboard
 /admin
```

---

## 8. Database Schema

Database dùng Supabase PostgreSQL.

---

## 8.1 `profiles`

Lưu thông tin user mở rộng từ Supabase Auth.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Role values

```text
customer
admin
```

---

## 8.2 `products`

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  description text,
  product_type text not null default 'digital_download',
  status text not null default 'draft',
  price_cents integer not null default 0,
  currency text not null default 'USD',
  thumbnail_url text,
  demo_url text,
  preview_url text,
  lemon_squeezy_product_id text,
  lemon_squeezy_variant_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### product_type values

```text
digital_download
course
tool
template
bundle
free_resource
```

### status values

```text
draft
published
archived
```

---

## 8.3 `product_categories`

```sql
create table product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);
```

---

## 8.4 `product_category_map`

```sql
create table product_category_map (
  product_id uuid references products(id) on delete cascade,
  category_id uuid references product_categories(id) on delete cascade,
  primary key (product_id, category_id)
);
```

---

## 8.5 `product_files`

```sql
create table product_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size_bytes bigint,
  file_type text,
  version text default '1.0.0',
  is_primary boolean default false,
  created_at timestamptz not null default now()
);
```

---

## 8.6 `orders`

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  provider text not null default 'lemon_squeezy',
  provider_order_id text unique,
  status text not null default 'pending',
  total_cents integer not null,
  currency text not null default 'USD',
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 8.7 `order_items`

```sql
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  price_cents integer not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);
```

---

## 8.8 `purchases`

```sql
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  access_status text not null default 'active',
  purchased_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(user_id, product_id)
);
```

### access_status values

```text
active
revoked
refunded
expired
```

---

## 8.9 `courses`

```sql
create table courses (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 8.10 `course_modules`

```sql
create table course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
```

---

## 8.11 `lessons`

```sql
create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references course_modules(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  video_url text,
  content text,
  position integer not null default 0,
  is_preview boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 8.12 `blog_posts`

```sql
create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  status text not null default 'draft',
  author_id uuid references auth.users(id) on delete set null,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 8.13 `webhook_events`

```sql
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  provider_event_id text unique,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
```

---

## 9. Row Level Security

### 9.1 Nguyên tắc

- Public chỉ đọc được product đã published.
- User chỉ đọc được purchase của chính mình.
- Admin có toàn quyền quản lý.
- File paid chỉ được cấp signed URL sau khi kiểm tra purchase.
- Không expose service role key ở client.

### 9.2 Policy gợi ý

```sql
-- Products public read
create policy "Public can view published products"
on products for select
using (status = 'published');

-- Users can view own purchases
create policy "Users can view own purchases"
on purchases for select
using (auth.uid() = user_id);
```

Admin policies nên dùng helper function như `is_admin()`.

---

## 10. API Design

Dùng Next.js App Router route handlers.

---

## 10.1 Public APIs

### `GET /api/products`

Lấy danh sách sản phẩm published.

**Query params:**

```text
category
search
sort
page
limit
```

**Response:**

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Next.js SaaS Starter",
      "slug": "nextjs-saas-starter",
      "price_cents": 1900,
      "currency": "USD",
      "thumbnail_url": "...",
      "product_type": "template"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 30
  }
}
```

---

### `GET /api/products/:slug`

Lấy chi tiết sản phẩm.

```json
{
  "id": "uuid",
  "title": "Product title",
  "slug": "product-slug",
  "description": "...",
  "price_cents": 1900,
  "currency": "USD",
  "product_type": "digital_download",
  "thumbnail_url": "...",
  "demo_url": "...",
  "metadata": {}
}
```

---

## 10.2 Authenticated APIs

### `GET /api/me/purchases`

Lấy sản phẩm user đã mua.

```json
{
  "items": [
    {
      "product_id": "uuid",
      "title": "Product title",
      "slug": "product-slug",
      "access_status": "active",
      "purchased_at": "2026-05-13T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/products/:id/download`

Tạo signed download URL nếu user có quyền.

**Request:**

```json
{
  "file_id": "uuid"
}
```

**Response:**

```json
{
  "download_url": "https://...",
  "expires_in": 300
}
```

**Logic:**

```text
Check auth
→ Check purchase active
→ Check file belongs to product
→ Generate signed URL
→ Return URL
```

---

## 10.3 Payment APIs

### `POST /api/checkout`

Tạo checkout session.

**Request:**

```json
{
  "product_id": "uuid"
}
```

**Response:**

```json
{
  "checkout_url": "https://..."
}
```

---

### `POST /api/webhooks/lemon-squeezy`

Nhận webhook từ Lemon Squeezy.

**Logic:**

```text
Verify signature
→ Store webhook event
→ Check idempotency
→ If order_created:
    - Create or update order
    - Match product by variant_id
    - Find or create user by email if needed
    - Create purchase
→ If order_refunded:
    - Update order status
    - Revoke purchase
```

---

## 10.4 Admin APIs

### `POST /api/admin/products`

Tạo sản phẩm.

### `PATCH /api/admin/products/:id`

Cập nhật sản phẩm.

### `DELETE /api/admin/products/:id`

Soft delete hoặc archive sản phẩm.

### `POST /api/admin/products/:id/files`

Upload/gắn file cho sản phẩm.

### `GET /api/admin/orders`

Xem đơn hàng.

### `POST /api/admin/blog`

Tạo blog post.

---

## 11. UI Layout

## 11.1 Global Layout

```text
Header
├── Logo: DanCruShop
├── Nav: Products | Blog | Courses | About
├── Search
├── Login / Dashboard

Main Content

Footer
├── About DanCru
├── Social links
├── Terms
├── Privacy
```

---

## 11.2 Homepage Layout

```text
Hero Section
├── Headline
├── Subheadline
├── CTA: Browse Products
├── CTA: Read Blog

Featured Products
├── Product Card
├── Product Card
├── Product Card

Why DanCruShop?
├── Practical projects
├── Clean source code
├── Real-world learning

Latest Posts

Footer
```

---

## 11.3 Product Listing Layout

```text
Page title: Products

Sidebar / Top filter
├── Category
├── Product type
├── Price: Free/Paid
├── Tech stack

Product Grid
├── Product Card
├── Product Card
├── Product Card
```

---

## 11.4 Product Detail Layout

```text
Left column
├── Product image/gallery
├── Demo preview
├── Tech stack

Right column
├── Title
├── Short description
├── Price
├── Buy button
├── Included files
├── License info

Below
├── Full description
├── Setup guide
├── FAQ
├── Changelog
├── Related products
```

---

## 11.5 Dashboard Layout

```text
Sidebar
├── My Products
├── Orders
├── Settings

Main
├── Purchased products grid
├── Product access card
├── Download / Watch button
```

---

## 11.6 Admin Layout

```text
Sidebar
├── Overview
├── Products
├── Orders
├── Customers
├── Blog
├── Settings

Main
├── Tables
├── Forms
├── Upload controls
├── Publish controls
```

---

## 12. Tech Stack

## 12.1 Frontend

```text
Next.js 16+ App Router
React
TypeScript
Tailwind CSS
shadcn/ui
Lucide Icons
MDX for blog/docs
```

## 12.2 Backend

```text
Next.js Route Handlers
Server Actions where appropriate
Supabase PostgreSQL
Supabase Auth
Supabase Storage
```

## 12.3 Payment

```text
MVP: Lemon Squeezy
Future: Stripe
Future Vietnam: MoMo / VNPay through payment gateway
```

## 12.4 Video

```text
Bunny.net Stream hoặc Cloudflare Stream
Không host video raw trên Supabase Storage
```

## 12.5 Deployment

```text
Vercel for Next.js
Supabase Cloud for database/auth/storage
Cloudflare for DNS/CDN if needed
```

## 12.6 Monitoring

MVP:

```text
Vercel logs
Supabase logs
Basic error boundary
```

Future:

```text
Sentry
PostHog
Analytics
Webhook failure alert
```

---

## 13. MVP Scope

## 13.1 MVP Must-have

### Public

- Homepage
- Product listing
- Product detail
- Blog listing
- Blog detail
- SEO metadata cơ bản

### Auth

- Login/register
- Google OAuth
- User dashboard

### Product

- Admin tạo/sửa product
- Product type: digital download
- Product status: draft/published
- Product thumbnail
- Product file attachment

### Payment

- Lemon Squeezy checkout
- Webhook xử lý đơn thành công
- Tạo purchase sau thanh toán
- Revoke access khi refund

### Download

- User đã mua mới tải được file
- Signed URL có thời hạn

### Admin

- CRUD product
- View orders
- View purchases
- CRUD blog posts

---

## 13.2 MVP Should-have

- Search product cơ bản
- Category filter
- Product tags
- Changelog
- Related products
- Email confirmation cơ bản
- Free product flow

---

## 13.3 MVP Could-have

- Course lesson structure đơn giản
- Video embed cho lesson
- Admin analytics đơn giản
- Coupon code
- Product bundle
- Newsletter signup

---

## 13.4 MVP Won't-have

- Marketplace nhiều seller
- Affiliate
- Subscription
- Certificate
- Full course progress tracking
- Comment system
- Community
- Mobile app
- Complex DRM
- Advanced analytics

---

## 14. Roadmap

## Phase 0 — Planning & Setup

**Mục tiêu:** Chốt kiến trúc và chuẩn bị project.

Tasks:

- Tạo repo GitHub.
- Setup Next.js.
- Setup Tailwind + shadcn/ui.
- Setup Supabase project.
- Thiết kế schema database.
- Setup env variables.
- Setup deployment Vercel.
- Tạo design system cơ bản.

---

## Phase 1 — Public Shop MVP

**Mục tiêu:** Có website xem sản phẩm.

Tasks:

- Build homepage.
- Build product listing.
- Build product detail.
- Build category/tag.
- Build static blog.
- Add SEO metadata.
- Add responsive layout.

Deliverable:

```text
Người dùng có thể vào website, xem sản phẩm, đọc blog.
```

---

## Phase 2 — Auth + Dashboard

**Mục tiêu:** Người dùng có tài khoản và dashboard.

Tasks:

- Supabase Auth.
- Google OAuth.
- User profile.
- Dashboard layout.
- My Products page.
- Orders page placeholder.
- Protected routes.

Deliverable:

```text
Người dùng đăng nhập và xem dashboard cá nhân.
```

---

## Phase 3 — Payment + Purchase Unlock

**Mục tiêu:** Mua sản phẩm và mở quyền truy cập.

Tasks:

- Lemon Squeezy setup.
- Checkout API.
- Webhook endpoint.
- Order table.
- Purchase table.
- Idempotency handling.
- Success/cancel page.
- Access control.

Deliverable:

```text
Người dùng mua sản phẩm và hệ thống tự động mở quyền.
```

---

## Phase 4 — File Delivery

**Mục tiêu:** Giao file an toàn.

Tasks:

- Upload file vào private storage.
- Product file management.
- Signed URL generation.
- Download permission check.
- Download UI.

Deliverable:

```text
Người mua tải được file, người chưa mua không tải được.
```

---

## Phase 5 — Admin CMS

**Mục tiêu:** Admin tự quản lý nội dung.

Tasks:

- Admin dashboard.
- Product CRUD.
- Blog CRUD.
- File upload UI.
- Order viewer.
- Customer viewer.

Deliverable:

```text
DanCru có thể quản trị shop mà không cần sửa database thủ công.
```

---

## Phase 6 — Course/Video Expansion

**Mục tiêu:** Bán khóa học/video.

Tasks:

- Course model.
- Modules.
- Lessons.
- Video provider integration.
- Lesson access control.
- Basic progress tracking.

Deliverable:

```text
Người mua course có thể xem video theo lesson.
```

---

## Phase 7 — Growth Features

**Mục tiêu:** Tăng chuyển đổi và doanh thu.

Tasks:

- Coupon.
- Bundle.
- Newsletter.
- Product recommendations.
- Testimonials.
- Analytics.
- Abandoned checkout email.
- License key nếu bán software/tool.

---

## 15. Rủi ro

## 15.1 Rủi ro kỹ thuật

### Webhook lỗi hoặc bị gọi lặp

**Rủi ro:** Một đơn hàng có thể bị xử lý nhiều lần.

**Giải pháp:**

- Lưu `provider_event_id`.
- Check idempotency.
- Transaction khi tạo order/purchase.

---

### File paid bị lộ link

**Rủi ro:** Người chưa mua truy cập được file.

**Giải pháp:**

- Storage bucket private.
- Signed URL ngắn hạn.
- Check purchase trước khi tạo URL.
- Không expose file path trực tiếp.

---

### Video bị share link

**Rủi ro:** Người mua chia sẻ link video.

**Giải pháp MVP:**

- Dùng provider có signed playback hoặc domain restriction nếu có.
- Không nhúng video public raw link.
- Chấp nhận mức bảo vệ vừa phải ở MVP.

---

### Supabase RLS cấu hình sai

**Rủi ro:** User đọc được dữ liệu của người khác.

**Giải pháp:**

- Bật RLS từ đầu.
- Viết policy tối thiểu.
- Test bằng nhiều tài khoản.
- Không dùng service role ở client.

---

### Payment provider không hỗ trợ tốt thị trường Việt Nam

**Rủi ro:** Khách Việt khó thanh toán.

**Giải pháp:**

- MVP ưu tiên quốc tế.
- Phase sau thêm MoMo/VNPay qua cổng trung gian.
- Có thể hỗ trợ chuyển khoản thủ công giai đoạn đầu nếu cần.

---

## 15.2 Rủi ro sản phẩm

### Build quá lớn ngay từ đầu

**Rủi ro:** Dự án bị chậm, không launch được.

**Giải pháp:**

- MVP chỉ tập trung digital download.
- Course/video để phase sau.
- Không làm marketplace, affiliate, community sớm.

---

### Không có sản phẩm đủ hấp dẫn

**Rủi ro:** Website có shop nhưng không có thứ để bán.

**Giải pháp:**

- Bắt đầu với 3–5 sản phẩm nhỏ.
- Mỗi sản phẩm cần demo, docs, screenshot.
- Chọn sản phẩm gắn với pain point thực tế.

---

### Người dùng chưa tin tưởng để mua

**Rủi ro:** Conversion thấp.

**Giải pháp:**

- Có demo rõ ràng.
- Có preview code/docs.
- Có refund policy.
- Có profile cá nhân, social proof.
- Có blog/video liên quan.

---

### Nội dung bị rải rác

**Rủi ro:** Blog, YouTube, sản phẩm không kết nối với nhau.

**Giải pháp:**

- Mỗi video/blog nên link về product.
- Mỗi product nên có docs/blog/video liên quan.
- Dùng DanCruShop làm hub trung tâm.

---

## 15.3 Rủi ro vận hành

### Admin phải thao tác quá nhiều

**Rủi ro:** Mất thời gian quản lý thủ công.

**Giải pháp:**

- Admin dashboard đủ dùng.
- Upload file qua UI.
- Webhook tự unlock purchase.
- Template hóa product content.

---

### Refund/dispute

**Rủi ro:** Người dùng refund sau khi tải file.

**Giải pháp:**

- Chính sách refund rõ.
- Revoke access khi refund.
- Với digital product, cần ghi rõ điều kiện hoàn tiền.

---

### Chi phí video tăng

**Rủi ro:** Video hosting tốn phí khi traffic tăng.

**Giải pháp:**

- Không host video raw trên Supabase.
- Theo dõi bandwidth.
- Dùng Bunny hoặc Cloudflare Stream.
- Tối ưu video bitrate.

---

## 16. Success Metrics

## 16.1 Product metrics

- Số lượt truy cập product page.
- Conversion rate từ product page sang checkout.
- Số đơn hàng thành công.
- Doanh thu tháng.
- Tỷ lệ refund.
- Số lượt tải file.
- Số user đăng ký.

## 16.2 Content metrics

- Lượt xem blog.
- Traffic từ Google.
- Click từ blog sang product.
- Click từ YouTube/LinkedIn sang product.

## 16.3 Technical metrics

- Webhook success rate.
- Payment unlock latency.
- Download error rate.
- Page load speed.
- Auth error rate.

---

## 17. Suggested Initial Products

Để MVP có nội dung thật, nên bắt đầu với một số sản phẩm nhỏ:

1. **Next.js + Supabase Starter Kit**
   - Auth
   - Dashboard
   - Protected routes
   - Example schema

2. **AI Agent Lab Template**
   - LangChain/LangGraph starter
   - Tool calling example
   - RAG example

3. **Prompt Engineering Notes**
   - Markdown/PDF
   - Cheatsheet
   - Real examples

4. **Mini SaaS Boilerplate**
   - Landing page
   - Pricing page
   - Auth
   - Dashboard

5. **Dev Productivity Toolkit**
   - Scripts
   - VS Code setup
   - Git workflow
   - Bash/PowerShell helper commands

---

## 18. Recommended MVP Build Order

```text
1. Next.js project setup
2. UI layout + design system
3. Supabase schema
4. Public product pages
5. Auth
6. Dashboard
7. Admin product CRUD
8. File upload/private storage
9. Lemon Squeezy checkout
10. Webhook unlock purchase
11. Signed download
12. Blog/SEO
13. Deploy
14. Test full purchase flow
```

---

## 19. Environment Variables

```env
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=

VIDEO_PROVIDER=
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_STREAM_TOKEN=
```

---

## 20. Open Questions

Những câu hỏi cần chốt sau tài liệu này:

1. MVP sẽ bán bằng USD, VND hay cả hai?
2. Có cần hỗ trợ khách Việt thanh toán qua chuyển khoản thủ công không?
3. Sản phẩm đầu tiên cụ thể là gì?
4. File source code sẽ lưu ở Supabase Storage hay private GitHub release?
5. DanCruShop có cần giao diện tiếng Việt, tiếng Anh, hay song ngữ?
6. Có cần blog ngay MVP không, hay để sau?
7. Có cần course/video ngay MVP không, hay chỉ chuẩn bị schema?
8. License sản phẩm là personal use, commercial use, hay nhiều tier?
9. Refund policy là gì?
10. Có cần email gửi link tải sau thanh toán không?

---

## 21. Final Recommendation

Nên xây DanCruShop theo hướng:

```text
MVP = Digital Product Shop
Không phải full LMS
Không phải marketplace
Không phải SaaS quá phức tạp
```

Ưu tiên launch nhanh với 3 năng lực lõi:

```text
Trưng bày sản phẩm
→ Thanh toán
→ Mở quyền tải/xem
```

Sau khi có sản phẩm đầu tiên và có người dùng thật, mới mở rộng sang:

```text
Course
→ Video
→ Bundle
→ Coupon
→ Subscription
→ Community
```

DanCruShop nên được xem là **nền tảng thương hiệu cá nhân + cửa hàng sản phẩm số**, không chỉ là một website bán hàng đơn thuần.


---

# 22. PRD Refinements (Post Review Updates)

## 22.1 Guest Checkout + Magic Link Authentication

### Problem

Flow cũ:

```text
User mua hàng
→ Thanh toán thành công
→ Bị yêu cầu đăng ký tài khoản
→ Sau đó mới vào dashboard
```

Flow này tạo friction không cần thiết.

---

### Updated Flow

```text
User chọn sản phẩm
→ Checkout bằng email
→ Thanh toán thành công
→ System tự động tạo account placeholder
→ Gửi email magic link
→ User click magic link
→ Vào thẳng Dashboard
→ Product đã unlock sẵn
```

---

### Benefits

- Giảm friction mạnh.
- Tăng conversion rate.
- Không bắt buộc signup trước khi mua.
- UX phù hợp thị trường Việt Nam.
- Đơn giản hơn cho user không rành công nghệ.

---

### Technical Design

#### Auth Strategy

```text
- Optional pre-login
- Guest checkout supported
- Auto account provisioning after payment
- Magic link onboarding
```

---

### Updated Payment Flow

```text
User Buy Now
→ Lemon Squeezy Checkout
→ Payment Success Webhook
→ System:
    - Find existing user by email
    - If not exists:
        - Create auth placeholder
        - Generate magic login flow
    - Create order
    - Create purchase
→ Send email:
    - Purchase confirmation
    - Magic login link
    - Dashboard link
```

---

## 22.2 Vietnamese Payment Support (VietQR)

### Decision

MVP sẽ hỗ trợ:

```text
1. Lemon Squeezy (USD)
2. VietQR Manual Transfer (VND)
```

---

### Reasoning

Target user ban đầu nhiều khả năng là:

- Sinh viên công nghệ
- Dev Việt Nam
- Người theo dõi từ YouTube/TikTok/Facebook
- Người chưa quen thanh toán quốc tế

Việc chỉ hỗ trợ Lemon Squeezy có thể làm giảm conversion.

---

## 22.3 VietQR Manual Flow

```text
User chọn "Chuyển khoản ngân hàng"
→ System tạo ORDER_ID
→ Generate VietQR
→ Nội dung CK = ORDER_xxx
→ User chuyển khoản
→ Admin nhận biến động số dư
→ Admin approve payment
→ System tạo purchase
→ Email gửi quyền truy cập
```

---

### MVP Decision

Không cần auto banking webhook ở MVP.

Approval thủ công là chấp nhận được ở giai đoạn đầu.

---

## 22.4 Additional Database Improvements

### Updated `products` table

Thêm:

```sql
is_free boolean not null default false
```

### Reason

- Query sản phẩm free nhanh hơn.
- Logic rõ ràng hơn thay vì check `price_cents = 0`.

---

### Updated `product_files` table

Thêm:

```sql
download_count integer not null default 0
```

### Reason

- Tracking tài nguyên được tải nhiều.
- Hữu ích cho analytics.
- Hữu ích cho free resources.

---

## 22.5 Storage Architecture Update

### MVP

```text
Auth + Database = Supabase
Storage = Supabase Storage
```

---

### Scale Phase

```text
Auth + Database = Supabase
Large Files = Cloudflare R2
Video = Bunny.net / Cloudflare Stream
```

---

### Reasoning

Supabase Storage free tier có giới hạn bandwidth.

Khi bắt đầu có:

- Video
- Large ZIP
- AI datasets
- Model files
- Toolkits lớn

thì cần storage chuyên cho large file delivery.

---

## 22.6 Email Infrastructure

### Decision

Email là critical infrastructure và phải có ngay từ MVP.

---

### Email Provider Recommendation

Ưu tiên:

- Resend
- Postmark

Recommended:

```text
Resend
```

vì tích hợp tốt với Next.js ecosystem.

---

## 22.7 Email Events

MVP cần các email sau:

```text
purchase_success
magic_login_link
download_ready
refund_notice
admin_manual_approval
```

---

## 22.8 Analytics MVP

### Problem

Không tracking từ đầu sẽ khó biết:

- Product nào convert tốt
- Blog nào kéo sales
- Funnel nào đang fail

---

### MVP Events

```text
product_page_view
checkout_clicked
purchase_completed
download_started
download_completed
```

---

### Suggested Stack

MVP:

```text
Simple internal tracking
```

Future:

```text
PostHog
Plausible
Mixpanel
```

---

## 22.9 Updated Final MVP Architecture

```text
Frontend
- Next.js App Router
- Tailwind CSS
- shadcn/ui

Backend
- Next.js Route Handlers
- Server Actions

Database/Auth
- Supabase

Payment
- Lemon Squeezy
- VietQR Manual Transfer

Storage
- Supabase Storage (MVP)
- Cloudflare R2 (Scale Phase)

Video
- Bunny.net / Cloudflare Stream

Email
- Resend

Hosting
- Vercel
```

---

## 22.10 Updated Core Philosophy

DanCruShop KHÔNG nên bắt đầu như:

```text
Udemy clone
Marketplace
Complex LMS
```

DanCruShop nên bắt đầu như:

```text
A creator-focused digital product shop
```

Core loop:

```text
Useful content
→ Useful product
→ Simple checkout
→ Instant access
```

---

## 22.11 Updated Immediate Next Steps

```text
1. Finalize database schema
2. Setup Supabase project
3. Build UI shell/layout
4. Setup auth + magic link
5. Build product CRUD
6. Build payment flow
7. Build download flow
8. Launch first real product
```

---

## 22.12 Final Strategic Direction

DanCruShop nên được xem là:

```text
Personal Brand Hub
+
Digital Product Store
+
Learning Platform Expansion Base
```

Không phải:

```text
A giant LMS from day one
```

Launch nhanh với:

```text
Trưng bày sản phẩm
→ Thanh toán
→ Unlock quyền truy cập
```

sẽ quan trọng hơn việc cố xây một hệ thống hoàn hảo ngay từ đầu.
