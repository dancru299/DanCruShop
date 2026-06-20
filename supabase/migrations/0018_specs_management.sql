-- 0018_specs_management.sql
-- Quản lý thông số kỹ thuật (tech stack, integrations, hosting, AI...)
-- 3 bảng chuẩn normalized: spec_groups → spec_fields → spec_options

-- ============================================================================
-- Bảng 1: Nhóm thông số
-- ============================================================================
CREATE TABLE IF NOT EXISTS spec_groups (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label      text NOT NULL,
  label_en   text NOT NULL,
  kind       text NOT NULL CHECK (kind IN ('tech', 'meta')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Bảng 2: Field trong nhóm
-- ============================================================================
CREATE TABLE IF NOT EXISTS spec_fields (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key        text NOT NULL UNIQUE,
  label      text NOT NULL,
  label_en   text NOT NULL,
  type       text NOT NULL CHECK (type IN ('single', 'multi', 'boolean')),
  hint       text,
  group_id   uuid NOT NULL REFERENCES spec_groups(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Bảng 3: Option trong field
-- ============================================================================
CREATE TABLE IF NOT EXISTS spec_options (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  value      text NOT NULL,
  label      text NOT NULL,
  label_en   text,
  class_name text,
  logo       text,
  field_id   uuid NOT NULL REFERENCES spec_fields(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_spec_fields_group ON spec_fields(group_id);
CREATE INDEX IF NOT EXISTS idx_spec_options_field ON spec_options(field_id);
CREATE INDEX IF NOT EXISTS idx_spec_options_value ON spec_options(value);
CREATE INDEX IF NOT EXISTS idx_spec_groups_sort ON spec_groups(sort_order);
CREATE INDEX IF NOT EXISTS idx_spec_fields_sort ON spec_fields(sort_order);
CREATE INDEX IF NOT EXISTS idx_spec_options_sort ON spec_options(sort_order);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE spec_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_options ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY admin_all_spec_groups ON spec_groups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY admin_all_spec_fields ON spec_fields FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY admin_all_spec_options ON spec_options FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Public: read-only
CREATE POLICY public_read_spec_groups ON spec_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_read_spec_fields ON spec_fields FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_read_spec_options ON spec_options FOR SELECT TO anon, authenticated USING (true);

-- ============================================================================
-- Seed Data: chuyển từ hardcode trong lib/products/specs.ts
-- ============================================================================

-- Groups
INSERT INTO spec_groups (id, label, label_en, kind, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Stack công nghệ', 'Tech stack', 'tech', 1),
  ('00000000-0000-0000-0000-000000000002', 'Tính năng tích hợp', 'Integrations', 'tech', 2),
  ('00000000-0000-0000-0000-000000000003', 'Hosting', 'Hosting', 'tech', 3),
  ('00000000-0000-0000-0000-000000000004', 'Trí tuệ nhân tạo', 'AI', 'tech', 4),
  ('00000000-0000-0000-0000-000000000005', 'Bản quyền & Hỗ trợ', 'License & support', 'meta', 5);

-- Fields
INSERT INTO spec_fields (id, key, label, label_en, type, hint, group_id, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'framework', 'Framework chính', 'Main framework', 'single', NULL, '00000000-0000-0000-0000-000000000001', 1),
  ('10000000-0000-0000-0000-000000000002', 'css', 'CSS / UI', 'CSS / UI', 'multi', NULL, '00000000-0000-0000-0000-000000000001', 2),
  ('10000000-0000-0000-0000-000000000003', 'database', 'Database', 'Database', 'single', NULL, '00000000-0000-0000-0000-000000000001', 3),
  ('10000000-0000-0000-0000-000000000004', 'payment', 'Cổng thanh toán', 'Payments', 'multi', NULL, '00000000-0000-0000-0000-000000000002', 1),
  ('10000000-0000-0000-0000-000000000005', 'auth', 'Xác thực (Auth)', 'Authentication', 'single', NULL, '00000000-0000-0000-0000-000000000002', 2),
  ('10000000-0000-0000-0000-000000000006', 'email', 'Email', 'Email', 'multi', NULL, '00000000-0000-0000-0000-000000000002', 3),
  ('10000000-0000-0000-0000-000000000007', 'hosting', 'Nền tảng hosting', 'Hosting', 'multi', NULL, '00000000-0000-0000-0000-000000000003', 1),
  ('10000000-0000-0000-0000-000000000008', 'ai', 'AI / ML', 'AI / ML', 'multi', NULL, '00000000-0000-0000-0000-000000000004', 1),
  ('10000000-0000-0000-0000-000000000009', 'project_limit', 'Giới hạn dự án', 'Project limit', 'single', NULL, '00000000-0000-0000-0000-000000000005', 1),
  ('10000000-0000-0000-0000-000000000010', 'lifetime_updates', 'Cập nhật trọn đời', 'Lifetime updates', 'boolean', 'Người mua nhận update mãi mãi.', '00000000-0000-0000-0000-000000000005', 2),
  ('10000000-0000-0000-0000-000000000011', 'support', 'Kênh hỗ trợ', 'Support channels', 'multi', NULL, '00000000-0000-0000-0000-000000000005', 3);

-- Options: Framework
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('nextjs', 'Next.js', 'Next.js', 'border-foreground/25 bg-foreground/5 text-foreground', '/logo_tech/nextjs-white.svg', '10000000-0000-0000-0000-000000000001', 1),
  ('react', 'React', 'React', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', '/logo_tech/react_61DAFB.png', '10000000-0000-0000-0000-000000000001', 2),
  ('vue', 'Vue', 'Vue', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', '/logo_tech/vue.svg', '10000000-0000-0000-0000-000000000001', 3),
  ('nuxt', 'Nuxt', 'Nuxt', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', NULL, '10000000-0000-0000-0000-000000000001', 4),
  ('svelte', 'Svelte', 'Svelte', 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400', NULL, '10000000-0000-0000-0000-000000000001', 5),
  ('remix', 'Remix', 'Remix', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000001', 6),
  ('astro', 'Astro', 'Astro', 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400', NULL, '10000000-0000-0000-0000-000000000001', 7),
  ('laravel', 'Laravel', 'Laravel', 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400', '/logo_tech/laravel.svg', '10000000-0000-0000-0000-000000000001', 8),
  ('nestjs', 'NestJS', 'NestJS', 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400', NULL, '10000000-0000-0000-0000-000000000001', 9),
  ('express', 'Express', 'Express', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000001', 10),
  ('go', 'Go', 'Go', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', '/logo_tech/go_00ADD8.png', '10000000-0000-0000-0000-000000000001', 11);

-- Options: CSS
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('tailwind', 'Tailwind CSS', 'Tailwind CSS', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', '/logo_tech/tailwind-css.svg', '10000000-0000-0000-0000-000000000002', 1),
  ('shadcn', 'shadcn/ui', 'shadcn/ui', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000002', 2),
  ('css-modules', 'CSS Modules', 'CSS Modules', NULL, NULL, '10000000-0000-0000-0000-000000000002', 3),
  ('styled-components', 'styled-components', 'styled-components', 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400', NULL, '10000000-0000-0000-0000-000000000002', 4),
  ('mui', 'MUI', 'MUI', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', NULL, '10000000-0000-0000-0000-000000000002', 5),
  ('bootstrap', 'Bootstrap', 'Bootstrap', 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400', '/logo_tech/bootstrap.svg', '10000000-0000-0000-0000-000000000002', 6);

-- Options: Database
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('supabase', 'Supabase', 'Supabase', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', '/logo_tech/supabase.svg', '10000000-0000-0000-0000-000000000003', 1),
  ('postgres', 'PostgreSQL', 'PostgreSQL', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', '/logo_tech/postgresql.svg', '10000000-0000-0000-0000-000000000003', 2),
  ('mysql', 'MySQL', 'MySQL', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', NULL, '10000000-0000-0000-0000-000000000003', 3),
  ('mongodb', 'MongoDB', 'MongoDB', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', '/logo_tech/mongodb.svg', '10000000-0000-0000-0000-000000000003', 4),
  ('sqlite', 'SQLite', 'SQLite', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000003', 5),
  ('planetscale', 'PlanetScale', 'PlanetScale', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000003', 6),
  ('firebase', 'Firebase', 'Firebase', 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', '/logo_tech/firebase.svg', '10000000-0000-0000-0000-000000000003', 7),
  ('prisma', 'Prisma', 'Prisma', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000003', 8);

-- Options: Payment
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('stripe', 'Stripe', 'Stripe', 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', '/logo_tech/stripe.svg', '10000000-0000-0000-0000-000000000004', 1),
  ('vietqr', 'VietQR', 'VietQR', 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400', NULL, '10000000-0000-0000-0000-000000000004', 2),
  ('lemonsqueezy', 'Lemon Squeezy', 'Lemon Squeezy', 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', NULL, '10000000-0000-0000-0000-000000000004', 3),
  ('paypal', 'PayPal', 'PayPal', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', NULL, '10000000-0000-0000-0000-000000000004', 4),
  ('momo', 'MoMo', 'MoMo', 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400', NULL, '10000000-0000-0000-0000-000000000004', 5),
  ('paddle', 'Paddle', 'Paddle', 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', NULL, '10000000-0000-0000-0000-000000000004', 6);

-- Options: Auth
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('supabase-auth', 'Supabase Auth', 'Supabase Auth', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', NULL, '10000000-0000-0000-0000-000000000005', 1),
  ('nextauth', 'NextAuth / Auth.js', 'NextAuth / Auth.js', 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400', NULL, '10000000-0000-0000-0000-000000000005', 2),
  ('clerk', 'Clerk', 'Clerk', 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400', NULL, '10000000-0000-0000-0000-000000000005', 3),
  ('kinde', 'Kinde', 'Kinde', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000005', 4),
  ('auth0', 'Auth0', 'Auth0', 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', NULL, '10000000-0000-0000-0000-000000000005', 5),
  ('firebase-auth', 'Firebase Auth', 'Firebase Auth', 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', NULL, '10000000-0000-0000-0000-000000000005', 6),
  ('custom', 'Custom / JWT', 'Custom / JWT', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000005', 7);

-- Options: Email
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('resend', 'Resend', 'Resend', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000006', 1),
  ('mailgun', 'Mailgun', 'Mailgun', 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400', NULL, '10000000-0000-0000-0000-000000000006', 2),
  ('sendgrid', 'SendGrid', 'SendGrid', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', NULL, '10000000-0000-0000-0000-000000000006', 3),
  ('postmark', 'Postmark', 'Postmark', 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', NULL, '10000000-0000-0000-0000-000000000006', 4),
  ('ses', 'Amazon SES', 'Amazon SES', 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', NULL, '10000000-0000-0000-0000-000000000006', 5),
  ('nodemailer', 'Nodemailer', 'Nodemailer', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', NULL, '10000000-0000-0000-0000-000000000006', 6);

-- Options: Hosting
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('vercel', 'Vercel', 'Vercel', 'border-foreground/25 bg-foreground/5 text-foreground', '/logo_tech/vercel.svg', '10000000-0000-0000-0000-000000000007', 1),
  ('railway', 'Railway', 'Railway', 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400', NULL, '10000000-0000-0000-0000-000000000007', 2),
  ('flyio', 'Fly.io', 'Fly.io', 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400', NULL, '10000000-0000-0000-0000-000000000007', 3),
  ('cloudflare', 'Cloudflare', 'Cloudflare', 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', NULL, '10000000-0000-0000-0000-000000000007', 4);

-- Options: AI
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('openai', 'OpenAI', 'OpenAI', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', '/logo_tech/openai.svg', '10000000-0000-0000-0000-000000000008', 1),
  ('anthropic', 'Anthropic', 'Anthropic', 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', '/logo_tech/claude_D97757.png', '10000000-0000-0000-0000-000000000008', 2),
  ('langchain', 'LangChain', 'LangChain', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', NULL, '10000000-0000-0000-0000-000000000008', 3),
  ('pinecone', 'Pinecone', 'Pinecone', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', NULL, '10000000-0000-0000-0000-000000000008', 4);

-- Options: Project limit
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('one', '1 dự án', '1 project', NULL, NULL, '10000000-0000-0000-0000-000000000009', 1),
  ('three', '3 dự án', '3 projects', NULL, NULL, '10000000-0000-0000-0000-000000000009', 2),
  ('unlimited', 'Không giới hạn', 'Unlimited', 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', NULL, '10000000-0000-0000-0000-000000000009', 3);

-- Options: Support
INSERT INTO spec_options (value, label, label_en, class_name, logo, field_id, sort_order) VALUES
  ('discord', 'Discord', 'Discord', 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', NULL, '10000000-0000-0000-0000-000000000011', 1),
  ('email', 'Email', 'Email', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', NULL, '10000000-0000-0000-0000-000000000011', 2),
  ('github', 'GitHub Issues', 'GitHub Issues', 'border-foreground/25 bg-foreground/5 text-foreground', NULL, '10000000-0000-0000-0000-000000000011', 3),
  ('telegram', 'Telegram', 'Telegram', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', NULL, '10000000-0000-0000-0000-000000000011', 4),
  ('zalo', 'Zalo', 'Zalo', 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', NULL, '10000000-0000-0000-0000-000000000011', 5);
