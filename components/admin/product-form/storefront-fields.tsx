import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { AdminMediaUploadField } from "@/components/admin/media-upload-field";
import { statusBadgeVariants } from "./constants";
import type { ProductStatus } from "@/lib/supabase/queries/products";

type StorefrontFieldsProps = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  status: ProductStatus;
  errors: {
    title?: string;
    slug?: string;
  };
  isPending: boolean;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onShortDescriptionChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onThumbnailUrlChange: (value: string) => void;
};

export function StorefrontFields({
  title,
  slug,
  shortDescription,
  description,
  thumbnailUrl,
  status,
  errors,
  isPending,
  onTitleChange,
  onSlugChange,
  onShortDescriptionChange,
  onDescriptionChange,
  onThumbnailUrlChange,
}: StorefrontFieldsProps) {
  return (
    <>
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-normal">
              Storefront content
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              These fields shape the product card and public detail page.
            </p>
          </div>
          <Badge variant={statusBadgeVariants[status]}>{status}</Badge>
        </div>

        <FieldGroup>
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Premium landing page kit"
              aria-invalid={Boolean(errors.title)}
              disabled={isPending}
            />
            <FieldError>{errors.title}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.slug)}>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input
              id="slug"
              value={slug}
              onChange={(event) => onSlugChange(event.target.value)}
              placeholder="premium-landing-page-kit"
              aria-invalid={Boolean(errors.slug)}
              disabled={isPending}
            />
            <FieldDescription>
              Used in the product URL. It is auto-generated from the title.
            </FieldDescription>
            <FieldError>{errors.slug}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="short-description">
              Short description
            </FieldLabel>
            <Textarea
              id="short-description"
              value={shortDescription}
              onChange={(event) => onShortDescriptionChange(event.target.value)}
              placeholder="A concise product summary for cards and SEO."
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Full description</FieldLabel>
            <MarkdownEditor
              id="description"
              value={description}
              onChange={onDescriptionChange}
              placeholder="Mô tả khách nhận được gì, dành cho ai, gồm những gì. Hỗ trợ định dạng Markdown."
              disabled={isPending}
            />
            <FieldDescription>
              Dùng thanh công cụ để in đậm, tạo tiêu đề, danh sách... Nội
              dung hiển thị có định dạng ở trang sản phẩm.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </section>

      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold tracking-normal">
            Product media
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Upload a thumbnail for product cards, or paste a remote image
            URL when the asset already lives elsewhere.
          </p>
        </div>

        <AdminMediaUploadField
          description="Recommended ratio: 16:10. Images are uploaded to the public media bucket."
          disabled={isPending}
          folder="products"
          id="thumbnail-url"
          label="Thumbnail URL"
          onChange={onThumbnailUrlChange}
          placeholder="https://example.com/product-thumbnail.jpg"
          value={thumbnailUrl}
        />
      </section>
    </>
  );
}
