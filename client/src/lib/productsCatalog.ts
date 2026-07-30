import {
  fetchCmsCategories,
  fetchCmsProducts,
} from "../services/cmsPublic";
import {
  productItems,
  productLayouts,
  getProductBySlug,
  cmsProductToItem,
  layoutFromCategorySlug,
  categorySlugForLayout,
  type ProductItem,
} from "../component/products/productData";

export const BEST_SELLER_SLUG = "best-seller";

export interface ProductsTab {
  slug: string;
  label: string;
}

export interface ProductsPageData {
  tabs: ProductsTab[];
  activeSlug: string;
  activeLabel: string;
  products: ProductItem[];
}

async function loadCatalog(): Promise<{ tabs: ProductsTab[]; products: ProductItem[] }> {
  const [cmsCategories, cmsProducts] = await Promise.all([
    fetchCmsCategories(),
    fetchCmsProducts(),
  ]);

  if (cmsCategories && cmsProducts) {
    return {
      tabs: [
        ...cmsCategories.map((c) => ({ slug: c.slug, label: c.title })),
        { slug: BEST_SELLER_SLUG, label: "Best Seller" },
      ],
      products: cmsProducts.map(cmsProductToItem),
    };
  }

  // CMS unreachable/empty — fall back to the static catalogue baked into the build.
  return {
    tabs: [
      ...productLayouts.map((l) => ({ slug: categorySlugForLayout(l), label: l })),
      { slug: BEST_SELLER_SLUG, label: "Best Seller" },
    ],
    products: productItems,
  };
}

/** Data for /products (bare) and /products/[category-or-best-seller]. Returns
 * null if `activeSlug` doesn't match any known tab — caller should 404. */
export async function getProductsPageData(
  activeSlug: string
): Promise<ProductsPageData | null> {
  const { tabs, products } = await loadCatalog();
  const tab = tabs.find((t) => t.slug === activeSlug);
  if (!tab) return null;

  const filtered =
    activeSlug === BEST_SELLER_SLUG
      ? products.filter((p) => p.bestSeller)
      : products.filter((p) => p.layoutType === layoutFromCategorySlug(activeSlug));

  return { tabs, activeSlug, activeLabel: tab.label, products: filtered };
}

/** All tab slugs (categories + best-seller), CMS-aware, for generateStaticParams. */
export async function getAllCategorySlugs(): Promise<string[]> {
  const { tabs } = await loadCatalog();
  return tabs.map((t) => t.slug);
}

/** All product slugs, CMS-aware, for generateStaticParams. */
export async function getAllProductSlugs(): Promise<string[]> {
  const cmsProducts = await fetchCmsProducts();
  if (cmsProducts) return cmsProducts.map((p) => p.slug);
  return productItems.map((p) => p.slug);
}

/** Single product by slug: CMS first, then the static fallback catalogue. */
export async function findProductBySlug(slug: string): Promise<ProductItem | null> {
  const cmsProducts = await fetchCmsProducts();
  if (cmsProducts) {
    const match = cmsProducts.find((p) => p.slug === slug);
    if (match) return cmsProductToItem(match);
    // Product genuinely doesn't exist in the CMS catalogue — don't fall
    // through to static data, that would resurrect a deleted product.
    return null;
  }
  return getProductBySlug(slug) ?? null;
}
