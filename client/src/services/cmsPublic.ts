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
  const raw =
    process.env.NEXT_PUBLIC_CMS_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "";
  if (!raw || raw === "/api") return "";
  return raw.replace(/\/+$/, "");
}

async function cmsFetch(path: string) {
  const base = cmsBase();
  if (!base) return null;
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

type CmsProduct = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
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
    heroImages: [image, image, image],
    tag: p.category || "Collection",
    headline: p.title,
    description: p.description || template.description,
    gallery: [
      { image, caption: p.title },
      { image, caption: p.title },
      { image, caption: p.title },
    ],
    detailImages: [image, image],
    contactImage: image,
  };
}

function mapCmsBlog(b: CmsBlog, index: number): BlogPost {
  const paragraphs = String(b.content || "")
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  const date = b.createdAt
    ? new Date(b.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).toUpperCase()
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

export async function fetchMergedProducts(): Promise<ProductItem[]> {
  try {
    const json = (await cmsFetch(`/cms/${SITE_ID}/products`)) as
      | { items?: CmsProduct[] }
      | null;
    if (!json) return productItems;
    const cmsItems = (json.items || []).map(mapCmsProduct);
    if (!cmsItems.length) return productItems;

    const bySlug = new Map(productItems.map((p) => [p.slug, p]));
    for (const item of cmsItems) bySlug.set(item.slug, item);
    return Array.from(bySlug.values());
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

    const bySlug = new Map(blogPosts.map((b) => [b.slug, b]));
    for (const item of cmsItems) bySlug.set(item.slug, item);
    return Array.from(bySlug.values());
  } catch {
    return blogPosts;
  }
}

export async function fetchProductBySlug(
  slug: string
): Promise<ProductItem | undefined> {
  const all = await fetchMergedProducts();
  return all.find((p) => p.slug === slug);
}

export async function fetchBlogBySlug(
  slug: string
): Promise<BlogPost | undefined> {
  const all = await fetchMergedBlogs();
  return all.find((b) => b.slug === slug);
}
