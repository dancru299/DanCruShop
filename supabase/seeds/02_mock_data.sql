-- ============================================================================
-- DanCruShop: Mock Data for Testing / Development
-- Run AFTER schema.sql + seed-categories.sql in the Supabase SQL Editor.
-- Safe to re-run — uses ON CONFLICT DO NOTHING.
-- ============================================================================

begin;

-- ============================================================================
-- 1. MOCK CUSTOMER ACCOUNTS
--    Admin account already exists. These rows create only customer auth users
--    so profile/user_id foreign keys are valid in Supabase.
-- ============================================================================
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000101',
    'authenticated',
    'authenticated',
    'customer1@dancrushop.test',
    extensions.crypt('Customer123@', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Tran Khach Hang", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=customer1"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000102',
    'authenticated',
    'authenticated',
    'customer2@dancrushop.test',
    extensions.crypt('Customer123@', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Le Minh Anh", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=customer2"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000103',
    'authenticated',
    'authenticated',
    'customer3@dancrushop.test',
    extensions.crypt('Customer123@', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Pham Gia Bao", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=customer3"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update set
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000101',
    '{"sub": "00000000-0000-0000-0000-000000000101", "email": "customer1@dancrushop.test", "email_verified": true}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000102',
    '{"sub": "00000000-0000-0000-0000-000000000102", "email": "customer2@dancrushop.test", "email_verified": true}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000103',
    '{"sub": "00000000-0000-0000-0000-000000000103", "email": "customer3@dancrushop.test", "email_verified": true}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do update set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, full_name, avatar_url, role) values
  ('00000000-0000-0000-0000-000000000101', 'Tran Khach Hang', 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer1', 'customer'),
  ('00000000-0000-0000-0000-000000000102', 'Le Minh Anh', 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer2', 'customer'),
  ('00000000-0000-0000-0000-000000000103', 'Pham Gia Bao', 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer3', 'customer')
on conflict (id) do update set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  role = 'customer',
  updated_at = now();

do $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'seed-mock-data.sql requires an existing admin profile. Create your admin account first.';
  end if;
end $$;

-- ============================================================================
-- 2. PRODUCTS (10 sản phẩm đa dạng loại)
-- ============================================================================
insert into public.products (id, title, slug, short_description, description, product_type, status, price_cents, currency, is_free, thumbnail_url, demo_url, metadata) values

  -- P1: Template trả phí
  ('10000000-0000-0000-0000-000000000001',
   'Landing Page Template Pro',
   'landing-page-template-pro',
   'Template landing page cao cấp với 10 section, tối ưu mobile và tốc độ load siêu nhanh.',
   '# Landing Page Template Pro

Bộ template landing page chuyên nghiệp được xây dựng trên Next.js + Tailwind CSS.

## Tính năng nổi bật
- 10 section được thiết kế sẵn: Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer...
- Tối ưu SEO, tốc độ load dưới 2 giây
- Responsive trên mọi thiết bị
- Dark mode tích hợp sẵn
- Dễ dàng tùy chỉnh màu sắc, font chữ qua biến CSS
- Form liên hệ tích hợp sẵn

## Yêu cầu
- Node.js 18+, npm hoặc pnpm',
   'template',
   'published',
   299000,
   'USD',
   false,
   'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
   'https://landing-demo.example.com',
   '{"tech": ["Next.js", "Tailwind CSS", "TypeScript"], "version": "2.1.0", "pages": 10}'::jsonb),

  -- P2: Source code trả phí
  ('10000000-0000-0000-0000-000000000002',
   'React Admin Dashboard',
   'react-admin-dashboard',
   'Mã nguồn admin dashboard React hoàn chỉnh với quản lý users, sản phẩm, đơn hàng.',
   '# React Admin Dashboard

Dashboard quản trị đầy đủ tính năng, sẵn sàng tích hợp vào dự án của bạn.

## Tính năng
- CRUD users, sản phẩm, đơn hàng, danh mục
- Phân quyền admin/editor/viewer
- Biểu đồ thống kê doanh thu, traffic
- Dark/light theme
- i18n hỗ trợ tiếng Việt + English
- Responsive, mobile-friendly

## Stack
- React 18, Vite, Zustand, React Query
- Tailwind CSS, Recharts
- Supabase (auth + database)',
   'digital_download',
   'published',
   599000,
   'USD',
   false,
   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600',
   'https://admin-demo.example.com',
   '{"tech": ["React", "Vite", "Zustand", "Supabase"], "version": "1.5.0"}'::jsonb),

  -- P3: Design asset trả phí
  ('10000000-0000-0000-0000-000000000003',
   'Icon Set Premium - 2000+ Icons',
   'icon-set-premium-2000',
   'Bộ icon vector 2000+ với 5 phong cách, hỗ trợ SVG, PNG, Figma.',
   '# Icon Set Premium

Bộ sưu tập icon chất lượng cao cho mọi dự án thiết kế.

## Bao gồm
- 2000+ icon vector
- 5 phong cách: Outline, Filled, Duotone, Color, Hand-drawn
- Định dạng: SVG, PNG (24/48/96/144px), Figma component
- 30 danh mục: Business, Education, Food, Health, Tech...
- Cập nhật miễn phí trọn đời

## Sử dụng
- Web, mobile app, presentation, print',
   'digital_download',
   'published',
   199000,
   'USD',
   false,
   'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600',
   'https://icons-demo.example.com',
   '{"total_icons": 2000, "styles": ["outline", "filled", "duotone", "color", "hand-drawn"], "formats": ["svg", "png", "figma"]}'::jsonb),

  -- P4: Tool trả phí
  ('10000000-0000-0000-0000-000000000004',
   'Automation Bot Telegram',
   'automation-bot-telegram',
   'Bot Telegram tự động hoá: gửi tin nhắn hàng loạt, auto-reply, quản lý group.',
   '# Automation Bot Telegram

Giải pháp tự động hoá Telegram giúp bạn tiết kiệm hàng giờ làm việc mỗi ngày.

## Tính năng chính
- Gửi tin nhắn hàng loạt đến users/groups
- Auto-reply theo keyword
- Quản lý group: welcome message, anti-spam, ban/unban
- Lên lịch gửi bài viết
- Thống kê lượt tương tác
- Tích hợp webhook với n8n, Zapier

## Cài đặt
- Python 3.11+, Docker optional
- Hỗ trợ deploy lên VPS, Railway, Render',
   'tool',
   'published',
   249000,
   'USD',
   false,
   'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600',
   null,
   '{"tech": ["Python", "python-telegram-bot", "Docker"], "version": "2.3.0"}'::jsonb),

  -- P5: UI Kit trả phí
  ('10000000-0000-0000-0000-000000000005',
   'Figma UI Kit Pro',
   'figma-ui-kit-pro',
   'UI Kit Figma đầy đủ 500+ component, design system hoàn chỉnh cho web app.',
   '# Figma UI Kit Pro

Design system toàn diện giúp designer và developer làm việc hiệu quả hơn.

## Nội dung
- 500+ component có sẵn
- Design tokens: màu sắc, typography, spacing, shadows
- Auto layout 4.0
- Responsive variants cho desktop/tablet/mobile
- Light & dark mode
- File Figma community sẵn sàng duplicate

## Phù hợp
- Web app, dashboard, SaaS, landing page',
   'digital_download',
   'published',
   149000,
   'USD',
   false,
   'https://images.unsplash.com/photo-1581291518633-83b4eef4c340?w=600',
   'https://figma.com/community/file/demo',
   '{"components": 500, "modes": ["light", "dark"], "breakpoints": ["desktop", "tablet", "mobile"]}'::jsonb),

  -- P6: Khóa học trả phí
  ('10000000-0000-0000-0000-000000000006',
   'Khóa Học Next.js Master 2024',
   'khoa-hoc-nextjs-master-2024',
   'Học Next.js từ zero đến production-ready: App Router, Server Actions, Supabase, Stripe.',
   '# Khóa Học Next.js Master 2024

Khóa học toàn diện giúp bạn thành thạo Next.js 14+ và xây dựng ứng dụng thực tế.

## Lộ trình
1. **Fundamentals**: App Router, layouts, routing
2. **Data Fetching**: Server Components, Server Actions, caching
3. **Authentication**: Supabase Auth, middleware, RLS
4. **Database**: Supabase schema design, migrations
5. **Payments**: Lemon Squeezy integration
6. **Deployment**: Vercel, CI/CD, monitoring

## Kết quả
- Xây dựng hoàn chỉnh 1 SaaS app
- Tự tin deploy production
- Hiểu sâu kiến trúc Next.js',
   'course',
   'published',
   799000,
   'USD',
   false,
   'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600',
   'https://course-demo.example.com',
   '{"duration_hours": 24, "lessons": 48, "level": "intermediate", "tech": ["Next.js", "Supabase", "Tailwind CSS", "Stripe"]}'::jsonb),

  -- P7: Notion template miễn phí
  ('10000000-0000-0000-0000-000000000007',
   'Notion Template Quản Lý Dự Án',
   'notion-template-quan-ly-du-an',
   'Hệ thống quản lý dự án trong Notion với task tracker, timeline, meeting notes.',
   '# Notion Template Quản Lý Dự Án

Template miễn phí giúp bạn tổ chức công việc hiệu quả ngay trong Notion.

## Bao gồm
- Dashboard tổng quan dự án
- Task tracker với trạng thái & ưu tiên
- Timeline view (Gantt chart đơn giản)
- Meeting notes database
- Resource library
- Template sprint planning

## Cách dùng
- Duplicate vào workspace Notion của bạn
- Xem video hướng dẫn 5 phút đi kèm',
   'free_resource',
   'published',
   0,
   'USD',
   true,
   'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600',
   null,
   '{"category": "productivity", "compatibility": "Notion only"}'::jsonb),

  -- P8: Plugin trả phí
  ('10000000-0000-0000-0000-000000000008',
   'VS Code Theme Pack - 10 Themes',
   'vs-code-theme-pack-10',
   'Bộ 10 theme VS Code đẹp mắt, tối ưu cho coding dài giờ không mỏi mắt.',
   '# VS Code Theme Pack

10 theme được thiết kế tỉ mỉ cho trải nghiệm coding tuyệt vời.

## Danh sách theme
1. **Cyber Dark** - Dark theme phong cách cyberpunk
2. **Ocean Blue** - Mát mắt, phù hợp ban ngày
3. **Forest Green** - Giảm mỏi mắt tối đa
4. **Sunset Warm** - Tông ấm, nhẹ nhàng
5. **Midnight Purple** - Sang trọng, tinh tế
6. **Monochrome Pro** - Đen trắng tối giản
7. **Neon Glow** - Rực rỡ, năng động
8. **Pastel Dream** - Ngọt ngào, dễ chịu
9. **Arctic Frost** - Lạnh lùng, sắc nét
10. **Retro Wave** - Hoài cổ, độc đáo

## Tính năng
- Hỗ trợ 30+ ngôn ngữ lập trình
- Italic variant cho keyword
- Custom file icon (optional)',
   'digital_download',
   'published',
   99000,
   'USD',
   false,
   'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
   'https://marketplace.visualstudio.com/items?itemName=demo',
   '{"themes": 10, "languages_supported": 30, "platform": "VS Code"}'::jsonb),

  -- P9: Tài liệu miễn phí (draft - để test trạng thái)
  ('10000000-0000-0000-0000-000000000009',
   'Ebook Tối Ưu SEO Cho Developer',
   'ebook-toi-uu-seo-cho-developer',
   'Hướng dẫn SEO kỹ thuật cho lập trình viên: Core Web Vitals, metadata, structured data.',
   '# Ebook Tối Ưu SEO Cho Developer

Ebook miễn phí giúp developer hiểu và áp dụng SEO đúng cách.

## Nội dung
- SEO fundamentals cho developer
- Core Web Vitals: LCP, FID, CLS
- Metadata & Open Graph tối ưu
- Structured Data (JSON-LD)
- Sitemap & robots.txt
- Next.js SEO best practices
- Công cụ audit: Lighthouse, PageSpeed Insights, Ahrefs',
   'digital_download',
   'draft',
   0,
   'USD',
   true,
   'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=600',
   null,
   '{"pages": 45, "format": "PDF", "version": "1.0.0"}'::jsonb),

  -- P10: Bundle trả phí
  ('10000000-0000-0000-0000-000000000010',
   'Bundle All-in-One Developer 2024',
   'bundle-all-in-one-developer-2024',
   'Combo 5 sản phẩm developer: dashboard, template, UI kit, icon set, ebook — tiết kiệm 40%.',
   '# Bundle All-in-One Developer 2024

Tất cả công cụ developer cần trong một bundle với giá siêu tiết kiệm.

## Sản phẩm trong bundle
1. React Admin Dashboard (trị giá $59)
2. Landing Page Template Pro (trị giá $29)
3. Figma UI Kit Pro (trị giá $14)
4. Icon Set Premium (trị giá $19)
5. Ebook Tối Ưu SEO (trị giá $9)

**Tổng giá lẻ: $130 → Bundle: $79 (tiết kiệm 40%)**

## Bonus
- File hướng dẫn tích hợp các sản phẩm với nhau
- Hỗ trợ priority email',
   'bundle',
   'published',
   790000,
   'USD',
   false,
   'https://images.unsplash.com/photo-1550439062-609e1531270e?w=600',
   null,
   '{"products_in_bundle": 5, "total_retail_price_cents": 130000, "discount_percent": 40}'::jsonb)

on conflict (slug) do nothing;

-- ============================================================================
-- 3. PRODUCT_CATEGORY_MAP (gán sản phẩm vào danh mục)
--    Dựa trên 12 danh mục từ seed-categories.sql (slug = tên slug đã seed)
-- ============================================================================
insert into public.product_category_map (product_id, category_id)
select p.id, c.id
from (values
  ('10000000-0000-0000-0000-000000000001', 'template'),
  ('10000000-0000-0000-0000-000000000002', 'source-code'),
  ('10000000-0000-0000-0000-000000000002', 'tool'),
  ('10000000-0000-0000-0000-000000000003', 'design-asset'),
  ('10000000-0000-0000-0000-000000000003', 'ui-kit'),
  ('10000000-0000-0000-0000-000000000004', 'automation-ai'),
  ('10000000-0000-0000-0000-000000000004', 'tool'),
  ('10000000-0000-0000-0000-000000000005', 'ui-kit'),
  ('10000000-0000-0000-0000-000000000005', 'design-asset'),
  ('10000000-0000-0000-0000-000000000006', 'khoa-hoc'),
  ('10000000-0000-0000-0000-000000000007', 'notion-productivity'),
  ('10000000-0000-0000-0000-000000000007', 'free-resource'),
  ('10000000-0000-0000-0000-000000000008', 'plugin-extension'),
  ('10000000-0000-0000-0000-000000000009', 'tai-lieu'),
  ('10000000-0000-0000-0000-000000000009', 'free-resource'),
  ('10000000-0000-0000-0000-000000000010', 'bundle')
) as t(product_id, category_slug)
join public.product_categories c on c.slug = t.category_slug
join public.products p on p.id = t.product_id::uuid
on conflict (product_id, category_id) do nothing;

-- ============================================================================
-- 4. PRODUCT_FILES (file chính + phụ cho từng sản phẩm)
-- ============================================================================
insert into public.product_files (id, product_id, file_name, file_path, file_size_bytes, file_type, version, is_primary) values

  -- P1: Template
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'landing-page-template-pro-v2.1.0.zip', 'products/landing-page-template-pro/v2.1.0/main.zip',
   15728640, 'application/zip', '2.1.0', true),

  -- P2: Dashboard
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'react-admin-dashboard-v1.5.0.zip', 'products/react-admin-dashboard/v1.5.0/main.zip',
   35651584, 'application/zip', '1.5.0', true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
   'react-admin-dashboard-docs-v1.5.0.pdf', 'products/react-admin-dashboard/v1.5.0/docs.pdf',
   5242880, 'application/pdf', '1.5.0', false),

  -- P3: Icon Set
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003',
   'icon-set-premium-v2.0.0.zip', 'products/icon-set-premium/v2.0.0/icons.zip',
   83886080, 'application/zip', '2.0.0', true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003',
   'icon-set-premium-figma-v2.0.0.fig', 'products/icon-set-premium/v2.0.0/figma.fig',
   12582912, 'application/octet-stream', '2.0.0', false),

  -- P4: Bot Telegram
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004',
   'telegram-bot-v2.3.0.zip', 'products/telegram-bot/v2.3.0/source.zip',
   10485760, 'application/zip', '2.3.0', true),

  -- P5: Figma UI Kit
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005',
   'figma-ui-kit-pro-v3.0.0.fig', 'products/figma-ui-kit/v3.0.0/kit.fig',
   20971520, 'application/octet-stream', '3.0.0', true),

  -- P6: Khóa học
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006',
   'nextjs-master-course-assets.zip', 'products/nextjs-master/assets.zip',
   104857600, 'application/zip', '1.0.0', true),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000006',
   'nextjs-master-course-slides.pdf', 'products/nextjs-master/slides.pdf',
   15728640, 'application/pdf', '1.0.0', false),

  -- P7: Notion Template
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000007',
   'notion-template-guide.pdf', 'products/notion-template/guide.pdf',
   1048576, 'application/pdf', '1.0.0', true),

  -- P8: VS Code Theme
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000008',
   'vscode-theme-pack-v1.2.0.vsix', 'products/vscode-theme-pack/v1.2.0/theme.vsix',
   5242880, 'application/octet-stream', '1.2.0', true),

  -- P10: Bundle
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000010',
   'bundle-all-in-one-dev-v1.0.0.zip', 'products/bundle-all-in-one/v1.0.0/bundle.zip',
   157286400, 'application/zip', '1.0.0', true)

on conflict (id) do nothing;

-- ============================================================================
-- 5. PRODUCT_REVIEWS (8 reviews từ customer, gắn với purchases)
--    Dùng user 0002 (customer). Lưu ý: RLS yêu cầu user đã mua mới review được,
--    nên ta seed purchases trước khi review (trong file này purchases ở dưới).
--    Thực tế Supabase SQL Editor bypass RLS, nên thứ tự không quan trọng.
-- ============================================================================
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null,
  title text,
  comment text not null,
  status text not null default 'published',
  helpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_reviews_user_product_unique unique (user_id, product_id),
  constraint product_reviews_rating_check check (rating between 1 and 5),
  constraint product_reviews_status_check check (
    status in ('pending', 'published', 'hidden', 'flagged')
  ),
  constraint product_reviews_helpful_count_check check (helpful_count >= 0)
);

alter table public.product_reviews enable row level security;

drop policy if exists "Public can view published product reviews" on public.product_reviews;
create policy "Public can view published product reviews"
on public.product_reviews
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Verified buyers can create product reviews" on public.product_reviews;
create policy "Verified buyers can create product reviews"
on public.product_reviews
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.purchases
    where purchases.product_id = product_reviews.product_id
      and purchases.user_id = (select auth.uid())
      and purchases.access_status = 'active'
  )
);

drop policy if exists "Review authors can update own reviews" on public.product_reviews;
create policy "Review authors can update own reviews"
on public.product_reviews
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage product reviews" on public.product_reviews;
create policy "Admins can manage product reviews"
on public.product_reviews
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.product_reviews (id, product_id, user_id, rating, title, comment, status) values

  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000101', 5,
   'Template cực kỳ chất lượng!',
   'Mình đã dùng template này cho 3 dự án landing page khác nhau. Code sạch, dễ custom, tốc độ load nhanh. Rất đáng tiền. Anh em developer nào cần landing page nhanh thì mua ngay nhé!',
   'published'),

  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000101', 4,
   'Dashboard đầy đủ tính năng',
   'Dashboard rất đầy đủ, tiết kiệm cho mình ít nhất 2 tuần dev. Chỉ trừ 1 sao vì documentation hơi sơ sài, cần cập nhật thêm. Tổng thể vẫn rất tốt.',
   'published'),

  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000101', 5,
   'Bộ icon tuyệt vời cho designer',
   '2000+ icon chất lượng cao, đủ mọi phong cách mình cần. File Figma rất tiện, kéo thả là dùng được ngay. Giá quá hời cho những gì nhận được.',
   'published'),

  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000101', 3,
   'Bot hoạt động ổn nhưng cần cải thiện',
   'Bot chạy ổn định, auto-reply đúng ý mình. Tuy nhiên phần quản lý group còn hay bị lag khi group >1000 members. Hy vọng tác giả sớm fix.',
   'published'),

  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000101', 5,
   'UI Kit chuẩn chỉnh từng pixel',
   'Là designer mình rất khó tính, nhưng UI Kit này thực sự làm mình hài lòng. Auto layout chuẩn, design tokens đầy đủ, dark mode có sẵn. Quá xuất sắc!',
   'published'),

  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000101', 4,
   'Khóa học Next.js chi tiết, dễ hiểu',
   'Mình từ React sang Next.js và khóa học này giúp mình hiểu rất nhanh. Giảng viên giải thích dễ hiểu, project thực tế. Chỉ mong có thêm phần về testing.',
   'published'),

  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000101', 5,
   'Notion template miễn phí mà xịn',
   'Không ngờ template miễn phí mà đầy đủ và chuyên nghiệp như này. Mình dùng để quản lý team 5 người rất hiệu quả. Cảm ơn tác giả rất nhiều!',
   'published'),

  ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000101', 2,
   'Theme đẹp nhưng thiếu hỗ trợ',
   'Theme nhìn đẹp thật, nhưng mình mua về mới thấy thiếu hỗ trợ cho Python và Go. Cũng không có hướng dẫn custom. Mong tác giả cập nhật thêm.',
   'published')

on conflict (id) do nothing;

-- ============================================================================
-- 6. PRODUCT_REVIEW_REPLIES (admin trả lời review)
-- ============================================================================
create table if not exists public.product_review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  comment text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_review_replies_status_check check (
    status in ('pending', 'published', 'hidden', 'flagged')
  )
);

alter table public.product_review_replies enable row level security;

drop policy if exists "Public can view published product review replies" on public.product_review_replies;
create policy "Public can view published product review replies"
on public.product_review_replies
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.product_reviews
    where product_reviews.id = product_review_replies.review_id
      and product_reviews.status = 'published'
  )
);

drop policy if exists "Verified buyers can create product review replies" on public.product_review_replies;
create policy "Verified buyers can create product review replies"
on public.product_review_replies
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.product_reviews
    join public.purchases on purchases.product_id = product_reviews.product_id
    where product_reviews.id = product_review_replies.review_id
      and product_reviews.status = 'published'
      and purchases.user_id = (select auth.uid())
      and purchases.access_status = 'active'
  )
);

drop policy if exists "Reply authors can update own product review replies" on public.product_review_replies;
create policy "Reply authors can update own product review replies"
on public.product_review_replies
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage product review replies" on public.product_review_replies;
create policy "Admins can manage product review replies"
on public.product_review_replies
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.product_review_replies (id, review_id, user_id, comment, status) values

  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002',
   (select id from public.profiles where role = 'admin' order by created_at limit 1),
   'Cảm ơn bạn đã góp ý! Mình sẽ cập nhật documentation chi tiết hơn trong bản 1.6.0 sắp tới nhé.',
   'published'),

  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004',
   (select id from public.profiles where role = 'admin' order by created_at limit 1),
   'Cảm ơn phản hồi của bạn. Mình đã note lại vấn đề group >1000 members và sẽ tối ưu trong bản 2.4.0. Bạn theo dõi changelog nhé!',
   'published'),

  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006',
   (select id from public.profiles where role = 'admin' order by created_at limit 1),
   'Cảm ơn bạn! Mình đang làm thêm module về testing (unit test + e2e) và sẽ cập nhật vào khóa học trong tháng tới.',
   'published'),

  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000008',
   (select id from public.profiles where role = 'admin' order by created_at limit 1),
   'Xin lỗi bạn vì trải nghiệm chưa tốt. Mình sẽ bổ sung hỗ trợ Python & Go trong bản 1.3.0, đồng thời làm thêm video hướng dẫn custom. Cảm ơn bạn đã góp ý!',
   'published')

on conflict (id) do nothing;

-- ============================================================================
-- 7. PURCHASES (5 giao dịch của customer)
-- ============================================================================
insert into public.purchases (id, user_id, product_id, access_status, purchased_at) values

  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000001', 'active',
   '2024-06-15 08:30:00+07'),

  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000002', 'active',
   '2024-06-20 14:00:00+07'),

  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000003', 'active',
   '2024-07-01 10:00:00+07'),

  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000004', 'active',
   '2024-07-10 16:30:00+07'),

  ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000006', 'active',
   '2024-07-15 09:00:00+07')

on conflict (id) do nothing;

-- ============================================================================
-- 8. PRODUCT_FAVORITES (5 sản phẩm yêu thích của customer)
-- ============================================================================
insert into public.product_favorites (user_id, product_id, created_at) values

  ('00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000005',
   '2024-07-20 15:00:00+07'),

  ('00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000008',
   '2024-07-21 10:30:00+07'),

  ('00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000010',
   '2024-07-22 08:00:00+07'),

  ('00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000007',
   '2024-07-23 20:00:00+07'),

  ('00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000005',
   '2024-07-24 12:00:00+07')

on conflict (user_id, product_id) do nothing;

-- ============================================================================
-- 9. BLOG_POSTS (4 bài viết: 2 published, 1 draft, 1 archived)
-- ============================================================================
insert into public.blog_posts (id, title, slug, excerpt, content, cover_image_url, status, author_id, seo_title, seo_description, published_at) values

  ('60000000-0000-0000-0000-000000000001',
   'Hướng Dẫn Tối Ưu Tốc Độ Website Với Next.js 14',
   'huong-dan-toi-uu-toc-do-website-nextjs-14',
   'Khám phá các kỹ thuật tối ưu tốc độ website trong Next.js 14: Server Components, Streaming, Partial Prerendering và Image Optimization.',
   '# Hướng Dẫn Tối Ưu Tốc Độ Website Với Next.js 14

Tốc độ website là yếu tố sống còn với mọi dự án web hiện đại. Trong bài viết này, mình sẽ chia sẻ những kỹ thuật tối ưu tốc độ hiệu quả nhất với Next.js 14.

## 1. Server Components mặc định

Next.js 14 sử dụng React Server Components làm mặc định. Điều này có nghĩa component của bạn chỉ render trên server, giảm đáng kể JavaScript gửi về client.

```tsx
// Component này chạy hoàn toàn trên server
export default async function ProductList() {
  const products = await db.product.findMany();
  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

## 2. Streaming với Suspense

Thay vì đợi toàn bộ page render xong, bạn có thể stream từng phần:

```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}
```

## 3. Image Optimization

Luôn dùng `next/image` thay vì thẻ `<img>` thông thường:

```tsx
import Image from "next/image";

<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  alt="Hero banner"
  priority // Ưu tiên load ảnh trên fold
  placeholder="blur" // Hiển thị blur placeholder
/>
```

## 4. Font Optimization

Next.js tự động optimize font với `next/font`:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["vietnamese", "latin"],
  display: "swap", // Tránh FOIT
});
```

## Kết luận

Áp dụng đúng những kỹ thuật trên, mình đã cải thiện Lighthouse score từ 65 lên 98 cho một dự án thực tế. Bạn đã thử chưa?',
   'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
   'published',
   (select id from public.profiles where role = 'admin' order by created_at limit 1),
   'Hướng Dẫn Tối Ưu Tốc Độ Website Với Next.js 14 | DanCruShop Blog',
   'Khám phá các kỹ thuật tối ưu tốc độ website trong Next.js 14: Server Components, Streaming, Partial Prerendering và Image Optimization.',
   '2024-06-01 09:00:00+07'),

  ('60000000-0000-0000-0000-000000000002',
   '5 Công Cụ AI Giúp Developer Code Nhanh Gấp 3 Lần',
   '5-cong-cu-ai-giup-developer-code-nhanh-gap-3-lan',
   'Tổng hợp 5 công cụ AI mạnh mẽ nhất giúp lập trình viên tăng năng suất: GitHub Copilot, Cursor, Claude, ChatGPT, và Phind.',
   '# 5 Công Cụ AI Giúp Developer Code Nhanh Gấp 3 Lần

AI đang thay đổi cách chúng ta code. Dưới đây là 5 công cụ AI mình dùng hàng ngày và thực sự hiệu quả.

## 1. GitHub Copilot

**Ưu điểm:**
- Tích hợp trực tiếp vào VS Code, JetBrains
- Gợi ý code theo context cực chính xác
- Hỗ trợ Copilot Chat để hỏi về codebase

**Mẹo:** Viết comment mô tả chức năng trước, Copilot sẽ suggest implementation.

## 2. Cursor IDE

**Ưu điểm:**
- AI-native code editor dựa trên VS Code
- Composer mode: sửa nhiều file cùng lúc
- Inline editing với Ctrl+K

## 3. Claude (Anthropic)

**Ưu điểm:**
- Phân tích codebase lớn rất tốt (200K context)
- Giải thích code phức tạp chi tiết
- Viết test case, documentation xuất sắc

## 4. ChatGPT (OpenAI)

**Ưu điểm:**
- GPT-4 Turbo code generation chất lượng cao
- Custom GPTs cho từng stack cụ thể
- Code interpreter để test code trực tiếp

## 5. Phind

**Ưu điểm:**
- Tìm kiếm + AI = câu trả lời chính xác có nguồn
- Tối ưu cho câu hỏi technical
- Miễn phí với model cơ bản

## Cách mình kết hợp

- **Phind** để research vấn đề mới
- **Claude** để phân tích codebase, viết doc
- **Cursor/Copilot** để code nhanh trong editor
- **ChatGPT** để brainstorm architecture

Kết quả: năng suất tăng ~3x so với trước đây. Bạn đã dùng công cụ nào trong list này?',
   'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
   'published',
   (select id from public.profiles where role = 'admin' order by created_at limit 1),
   '5 Công Cụ AI Giúp Developer Code Nhanh Gấp 3 Lần | DanCruShop Blog',
   'Tổng hợp 5 công cụ AI mạnh mẽ nhất giúp lập trình viên tăng năng suất: GitHub Copilot, Cursor, Claude, ChatGPT, và Phind.',
   '2024-06-15 10:00:00+07'),

  ('60000000-0000-0000-0000-000000000003',
   'Roadmap Trở Thành Full-Stack Developer 2024',
   'roadmap-tro-thanh-fullstack-developer-2024',
   'Lộ trình chi tiết để trở thành Full-Stack Developer trong năm 2024: từ HTML/CSS cơ bản đến DevOps và System Design.',
   '# Roadmap Trở Thành Full-Stack Developer 2024

Bài viết này dành cho các bạn đang muốn trở thành Full-Stack Developer. Mình sẽ chia sẻ lộ trình học tập dựa trên kinh nghiệm 5 năm trong nghề.

## Giai đoạn 1: Frontend Fundamentals (2-3 tháng)

Bắt đầu với nền tảng web:
- HTML5 semantic, accessibility
- CSS3: Flexbox, Grid, animation, responsive
- JavaScript ES6+: async/await, destructuring, modules

## Giai đoạn 2: Frontend Framework (2-3 tháng)

Chọn một trong hai hướng chính:
- **React ecosystem**: React, Next.js, Tailwind CSS
- **Vue ecosystem**: Vue 3, Nuxt.js, Pinia

## Giai đoạn 3: Backend & Database (3-4 tháng)

Học backend với Node.js:
- Express.js hoặc Fastify
- PostgreSQL + Prisma ORM
- REST API design, authentication (JWT, OAuth)
- Supabase (BaaS) - lựa chọn tuyệt vời cho startup

## Giai đoạn 4: DevOps & Deployment (1-2 tháng)

- Git & GitHub workflow
- Docker cơ bản
- CI/CD với GitHub Actions
- Deploy lên Vercel/Railway/VPS

## Giai đoạn 5: System Design & Best Practices

- Design patterns
- SOLID principles
- Microservices vs Monolith
- Performance optimization
- Security best practices

## Tổng thời gian: 8-12 tháng (học toàn thời gian)

Quan trọng nhất là **thực hành liên tục**. Xây dựng ít nhất 3-5 project thực tế trong quá trình học. Chúc các bạn thành công!',
   'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
   'draft',
   (select id from public.profiles where role = 'admin' order by created_at limit 1),
   'Roadmap Trở Thành Full-Stack Developer 2024 | DanCruShop Blog',
   'Lộ trình chi tiết để trở thành Full-Stack Developer trong năm 2024: từ HTML/CSS cơ bản đến DevOps và System Design.',
   null),

  ('60000000-0000-0000-0000-000000000004',
   'Tại Sao Nên Dùng TypeScript Thay Vì JavaScript?',
   'tai-sao-nen-dung-typescript-thay-vi-javascript',
   'So sánh TypeScript và JavaScript: type safety, developer experience, và lý do TypeScript là lựa chọn hàng đầu cho dự án lớn.',
   'Bài viết cũ, đã được thay thế bởi nội dung mới hơn.',
   'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
   'archived',
   (select id from public.profiles where role = 'admin' order by created_at limit 1),
   'Tại Sao Nên Dùng TypeScript? | DanCruShop Blog',
   'So sánh TypeScript và JavaScript cho dự án web.',
   '2023-12-01 08:00:00+07')

on conflict (slug) do nothing;

-- ============================================================================
-- 10. DOWNLOAD_LOGS (6 bản ghi tải file của customer)
-- ============================================================================
create table if not exists public.download_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  file_id uuid not null references public.product_files(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

alter table public.download_logs enable row level security;

drop policy if exists "Users can view own download logs" on public.download_logs;
create policy "Users can view own download logs"
on public.download_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage download logs" on public.download_logs;
create policy "Admins can manage download logs"
on public.download_logs
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.download_logs (id, user_id, product_id, file_id, downloaded_at) values

  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   '2024-06-15 09:00:00+07'),

  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
   '2024-06-20 15:00:00+07'),

  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003',
   '2024-06-20 15:30:00+07'),

  ('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004',
   '2024-07-01 11:00:00+07'),

  ('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005',
   '2024-07-05 14:00:00+07'),

  ('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000101',
   '10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000008',
   '2024-07-15 10:00:00+07')

on conflict (id) do nothing;

commit;
