import type { Metadata } from "next";

export function baseMetadata(): Metadata {
  return {
    title: "Switchboard — your ventures, one clear signal",
    description:
      "A calm command center for seeing which venture is live, what is waiting, and where to focus next.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"),
    openGraph: {
      title: "Switchboard — your ventures, one clear signal",
      description: "See every venture line and choose where your attention goes next.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}
