export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify({ "@context": "https://schema.org", ...data }),
  };
}
