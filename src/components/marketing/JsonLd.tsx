/**
 * Renders a JSON-LD <script> tag for structured data (schema.org).
 * Used to inject Organization, WebSite, Course, FAQPage and BreadcrumbList
 * schema per the Beyond SEO entity/structured-data policy.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is static, derived from our own content — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
