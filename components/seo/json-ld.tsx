import type { JsonLdObject } from "@/lib/seo";

type JsonLdProps = {
  data: JsonLdObject | JsonLdObject[];
};

/**
 * Renders a JSON-LD <script> for structured data (rich results). Server-only by
 * nature; safe to drop into any server component's tree.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Structured data is trusted, app-generated content (no user HTML).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
