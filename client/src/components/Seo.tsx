import { useEffect } from "react";

const DEFAULT_SITE_URL = "https://mery-palencia-client.vercel.app";
const SITE_NAME = "Mery Palencia";

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

function upsertMeta(selector: string, attribute: "name" | "property", key: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  return element;
}

export default function Seo({
  title,
  description,
  path = "/",
  image = "/og/social-preview.png",
  imageAlt = "Mery Palencia — Ilustración digital y diseño de personajes",
  type = "website",
  noIndex = false,
}: SeoProps) {
  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(
      /\/$/,
      ""
    );
    const canonicalUrl = new URL(path, `${baseUrl}/`).toString();
    const imageUrl = new URL(image, `${baseUrl}/`).toString();
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;
    document.documentElement.lang = "es";

    const values: Array<[string, "name" | "property", string, string]> = [
      ['meta[name="description"]', "name", "description", description],
      ['meta[name="robots"]', "name", "robots", noIndex ? "noindex, nofollow" : "index, follow"],
      ['meta[property="og:title"]', "property", "og:title", fullTitle],
      ['meta[property="og:description"]', "property", "og:description", description],
      ['meta[property="og:type"]', "property", "og:type", type],
      ['meta[property="og:url"]', "property", "og:url", canonicalUrl],
      ['meta[property="og:image"]', "property", "og:image", imageUrl],
      ['meta[property="og:image:alt"]', "property", "og:image:alt", imageAlt],
      ['meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME],
      ['meta[property="og:locale"]', "property", "og:locale", "es_CO"],
      ['meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image"],
      ['meta[name="twitter:title"]', "name", "twitter:title", fullTitle],
      ['meta[name="twitter:description"]', "name", "twitter:description", description],
      ['meta[name="twitter:image"]', "name", "twitter:image", imageUrl],
      ['meta[name="twitter:image:alt"]', "name", "twitter:image:alt", imageAlt],
    ];

    values.forEach(([selector, attribute, key, value]) => {
      upsertMeta(selector, attribute, key).content = value;
    });

    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [description, image, imageAlt, noIndex, path, title, type]);

  return null;
}
