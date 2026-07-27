import {
  productItems,
  type ProductItem,
  type ProductLayout,
} from "../component/products/productData";
import {
  blogPosts,
  type BlogPost,
  type BlogCategory,
} from "../component/blog/blogData";

const SITE_ID = "thailand-kitchen";

function cmsBase() {
  // Prefer same-origin proxy (works on localhost + LAN IP)
  if (typeof window !== "undefined") {
    return "/cms-api";
  }
  const raw =
    process.env.NEXT_PUBLIC_CMS_API_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    "http://127.0.0.1:5000/api";
  if (!raw || raw === "/api") return "http://127.0.0.1:5000/api";
  return raw.replace(/\/+$/, "");
}

async function cmsFetch(path: string) {
  const base = cmsBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export type HomeSections = Record<string, any>;

type CmsProduct = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  icon?: string;
  gallery?: string[];
  pdfUrl?: string;
  category: string;
  featured: boolean;
};

type CmsBlog = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  published: boolean;
  createdAt?: string;
};

const LAYOUTS: ProductLayout[] = [
  "Modern",
  "Islands",
  "U Shape",
  "L Shape",
  "Straight",
  "T Shape",
];

function mapLayout(category: string): ProductLayout {
  const match = LAYOUTS.find(
    (l) => l.toLowerCase() === String(category || "").toLowerCase()
  );
  return match || "Modern";
}

function mapCmsProduct(p: CmsProduct, index: number): ProductItem {
  const template = productItems[0];
  const image = p.image || template.image;
  const galleryImages =
    p.gallery && p.gallery.length
      ? p.gallery
      : [image, image, image];
  const layoutType = mapLayout(p.category);

  return {
    ...template,
    id: 10000 + index,
    slug: p.slug,
    name: p.title,
    layout: p.category || layoutType,
    layoutType,
    image,
    bestSeller: Boolean(p.featured),
    heroImages: galleryImages.slice(0, 3),
    tag: p.category || "Collection",
    headline: p.title,
    description: p.description || template.description,
    gallery: galleryImages.map((img) => ({ image: img, caption: p.title })),
    detailImages: galleryImages.slice(0, 2),
    contactImage: image,
  };
}

function mapCmsBlog(b: CmsBlog, index: number): BlogPost {
  const paragraphs = String(b.content || "")
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  const date = b.createdAt
    ? new Date(b.createdAt)
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    : "RECENT";

  return {
    id: 20000 + index,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt || paragraphs[0] || "",
    category: "Journal",
    filter: "All" as BlogCategory,
    date,
    readTime: "5 MIN READ",
    image: b.image || "/blog/blogImage (1).jpg",
    gallery: [
      b.image || "/blog/blogImage (2).jpg",
      "/blog/blogImage (3).jpg",
    ],
    featured: index === 0,
    content: paragraphs.length ? paragraphs : [b.excerpt || b.title],
  };
}

/** Home CMS sections from admin panel */
export async function fetchHomeSections(): Promise<HomeSections> {
  const json = (await cmsFetch(`/cms/${SITE_ID}/home`)) as
    | { home?: { sections?: HomeSections } }
    | null;
  return json?.home?.sections || {};
}

/**
 * Products: if admin has CMS products, those win (CMS-first).
 * Otherwise keep static seed data so the site never looks empty.
 */
export async function fetchMergedProducts(): Promise<ProductItem[]> {
  try {
    const json = (await cmsFetch(`/cms/${SITE_ID}/products`)) as
      | { items?: CmsProduct[] }
      | null;
    if (!json) return productItems;
    const cmsItems = (json.items || []).map(mapCmsProduct);
    if (!cmsItems.length) return productItems;
    return cmsItems;
  } catch {
    return productItems;
  }
}

export async function fetchMergedBlogs(): Promise<BlogPost[]> {
  try {
    const json = (await cmsFetch(`/cms/${SITE_ID}/blogs`)) as
      | { items?: CmsBlog[] }
      | null;
    if (!json) return blogPosts;
    const cmsItems = (json.items || [])
      .filter((b) => b.published !== false)
      .map(mapCmsBlog);
    if (!cmsItems.length) return blogPosts;
    return cmsItems;
  } catch {
    return blogPosts;
  }
}

export async function fetchProductBySlug(
  slug: string
): Promise<ProductItem | undefined> {
  const all = await fetchMergedProducts();
  return all.find((p) => p.slug === slug) || productItems.find((p) => p.slug === slug);
}

export async function fetchBlogBySlug(
  slug: string
): Promise<BlogPost | undefined> {
  const all = await fetchMergedBlogs();
  return all.find((b) => b.slug === slug) || blogPosts.find((b) => b.slug === slug);
}

export type CmsCatalogue = {
  id: number;
  category: string;
  title: string;
  image: string;
  pdf: string;
  pdfUrl?: string;
  downloadName: string;
};

export async function fetchMergedCatalogues(): Promise<CmsCatalogue[]> {
  const { products } = await import("../component/catlog/catlogData");
  const home = await fetchHomeSections();
  const homeItems = (home?.catalogue?.items || []) as any[];

  const dedicated = (await cmsFetch(`/cms/${SITE_ID}/catalogues`)) as
    | { items?: any[] }
    | null;

  const fromDedicated = (dedicated?.items || []).map((c, index) => ({
    id: 30000 + index,
    category: c.category || "Catalogue",
    title: c.title || "Catalogue",
    image: c.image || "/catlog/catlog.png",
    pdf: c.fileName || "",
    pdfUrl: c.pdfUrl || "",
    downloadName: c.downloadName || c.fileName || "catalogue.pdf",
  }));

  const fromHome = homeItems.map((c, index) => ({
    id: 31000 + index,
    category: c.category || "Catalogue",
    title: c.title || "Catalogue",
    image: c.image || "/catlog/catlog.png",
    pdf: c.fileName || "",
    pdfUrl: c.pdfUrl || "",
    downloadName: c.downloadName || c.fileName || "catalogue.pdf",
  }));

  if (fromDedicated.length) return fromDedicated;
  if (fromHome.length) return fromHome;
  return products.map((p) => ({
    ...p,
    pdfUrl: "",
  }));
}

export type CmsFaq = {
  id: number | string;
  question: string;
  answer: string;
};

export async function fetchMergedFaqs(): Promise<CmsFaq[]> {
  const dedicated = (await cmsFetch(`/cms/${SITE_ID}/faqs`)) as
    | { items?: any[] }
    | null;
  const fromDedicated = (dedicated?.items || []).map((f, index) => ({
    id: f._id || 40000 + index,
    question: f.question || "",
    answer: f.answer || "",
  }));
  if (fromDedicated.length) return fromDedicated;

  const home = await fetchHomeSections();
  const homeItems = (home?.faq?.items || []) as any[];
  if (homeItems.length) {
    return homeItems.map((f, index) => ({
      id: 41000 + index,
      question: f.question || "",
      answer: f.answer || "",
    }));
  }
  return [];
}

export type CmsGallery = {
  id: number | string;
  image: string;
  title: string;
  filter: string;
  tall?: boolean;
  wide?: boolean;
};

export async function fetchMergedGallery(): Promise<CmsGallery[]> {
  const { galleryItems } = await import("../component/gallery/galleryData");
  const json = (await cmsFetch(`/cms/${SITE_ID}/gallery`)) as
    | { items?: any[] }
    | null;
  const cmsItems = (json?.items || []).map((g, index) => ({
    id: g._id || 50000 + index,
    image: g.image || "",
    title: g.title || "Gallery",
    filter: g.filter || "Style & Color",
    tall: Boolean(g.tall),
    wide: Boolean(g.wide),
  }));
  if (cmsItems.length) return cmsItems;
  return galleryItems;
}
