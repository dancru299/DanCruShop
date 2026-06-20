-- DanCruShop: sample product categories.
-- Run in the Supabase SQL Editor AFTER schema.sql. Safe to re-run — existing
-- slugs are skipped via "on conflict (slug) do nothing".

begin;

insert into public.product_categories (name, slug, description) values
  ('Source code', 'source-code',
   'Mã nguồn hoàn chỉnh: web app, API, starter full-stack sẵn sàng chạy.'),
  ('Template', 'template',
   'Template & starter tái sử dụng cho landing page, dashboard, website.'),
  ('UI Kit', 'ui-kit',
   'Bộ thành phần giao diện, design system, component library.'),
  ('Tool', 'tool',
   'Công cụ và mini-tool giải quyết một việc cụ thể trong workflow.'),
  ('Tài liệu', 'tai-lieu',
   'Tài liệu, ebook, ghi chú triển khai và hướng dẫn thực chiến.'),
  ('Automation & AI', 'automation-ai',
   'Workflow tự động hoá, agent, prompt pack và tích hợp AI.'),
  ('Khóa học', 'khoa-hoc',
   'Khóa học có cấu trúc với bài học, video và file đi kèm.'),
  ('Notion & Productivity', 'notion-productivity',
   'Template Notion, hệ thống quản lý công việc và năng suất.'),
  ('Plugin & Extension', 'plugin-extension',
   'Plugin, extension và add-on mở rộng cho công cụ có sẵn.'),
  ('Design Asset', 'design-asset',
   'Tài nguyên thiết kế: icon, illustration, mockup, font.'),
  ('Bundle', 'bundle',
   'Combo nhiều sản phẩm gộp lại với giá tốt hơn mua lẻ.'),
  ('Free resource', 'free-resource',
   'Tài nguyên miễn phí để dùng thử và xây dựng thư viện đã mua.')
on conflict (slug) do nothing;

commit;
