/**
 * Thin, defensive client for the CMS-managed product categories/products.
 * Every export here fails soft: if the API is slow, cold-starting, or
 * unreachable, callers get `null` (not a thrown error) and are expected to
 * fall back to the static data in `component/products/productData.ts`.
 */

const CMS_BASE = (
  process.env.NEXT_PUBLIC_CMS_API_URL || "https://thailand-kitchen-api.onrender.com/api"
).replace(/\/+$/, "");

const SITE_ID = "thailand-kitchen";

// Render's free tier cold-starts after idling; don't make a real visitor's
// page load hang waiting for it. If it doesn't answer quickly, fall back.
const FETCH_TIMEOUT_MS = 6000;

export interface CmsCategoryTranslations {
  th?: { title?: string };
  pl?: { title?: string };
}

export interface CmsCategory {
  _id: string;
  siteId: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  translations?: CmsCategoryTranslations;
  sortOrder: number;
}

export interface CmsProductFeature {
  title: string;
  description: string;
}

export interface CmsProduct {
  _id: string;
  siteId: string;
  title: string;
  slug: string;
  subtitle: string;
  productType: string;
  sectionTag: string;
  description: string;
  image: string;
  icon: string;
  gallery: string[];
  pdfUrl: string;
  featureHighlights: CmsProductFeature[];
  category: string;
  featured: boolean;
}

async function cmsFetch<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${CMS_BASE}${path}`, {
      signal: controller.signal,
      // Categories/products change rarely; a short revalidate window keeps
      // pages fast while still picking up admin edits within a few minutes.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.success !== true) return null;
    return data as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCmsCategories(): Promise<CmsCategory[] | null> {
  const data = await cmsFetch<{ items: CmsCategory[] }>(
    `/cms/${SITE_ID}/categories`
  );
  if (!data || !Array.isArray(data.items) || data.items.length === 0) return null;
  return [...data.items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fetchCmsProducts(): Promise<CmsProduct[] | null> {
  const data = await cmsFetch<{ items: CmsProduct[] }>(
    `/cms/${SITE_ID}/products`
  );
  if (!data || !Array.isArray(data.items) || data.items.length === 0) return null;
  return data.items;
}

/** Localized category label: TH/PL translation if present, else the base title. */
export function categoryLabel(category: CmsCategory, locale: "EN" | "TH" | "PL"): string {
  if (locale === "TH" && category.translations?.th?.title) {
    return category.translations.th.title;
  }
  if (locale === "PL" && category.translations?.pl?.title) {
    return category.translations.pl.title;
  }
  return category.title;
}
