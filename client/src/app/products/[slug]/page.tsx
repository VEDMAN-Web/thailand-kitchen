import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailView from "../../../component/products/ProductDetailView";
import ProductsPageView from "../../../component/products/ProductsPageView";
import {
  getAllCategorySlugs,
  getAllProductSlugs,
  getProductsPageData,
  findProductBySlug,
} from "../../../lib/productsCatalog";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * This single dynamic segment serves two different kinds of page:
 *   /products/modern, /products/islands, ...  -> category listing
 *   /products/obsidian-bay, ...                -> individual product
 * A category slug is checked first, so a product can never accidentally
 * shadow a category (categories are a small, admin-managed list; matching
 * against them first keeps the check cheap and unambiguous).
 */
export async function generateStaticParams() {
  const [categorySlugs, productSlugs] = await Promise.all([
    getAllCategorySlugs(),
    getAllProductSlugs(),
  ]);
  return [...categorySlugs, ...productSlugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const categoryData = await getProductsPageData(slug);
  if (categoryData) {
    return {
      title: `${categoryData.activeLabel} Kitchens | Thailand Kitchens`,
      description: `Explore our ${categoryData.activeLabel.toLowerCase()} kitchen collection — custom teak cabinetry crafted and installed across Thailand.`,
    };
  }

  const product = await findProductBySlug(slug);
  if (product) {
    return {
      title: `${product.name} | Thailand Kitchens`,
      description: product.description,
    };
  }

  return {};
}

export default async function ProductsSlugPage({ params }: Props) {
  const { slug } = await params;

  const categoryData = await getProductsPageData(slug);
  if (categoryData) {
    return (
      <main className="w-full">
        <ProductsPageView {...categoryData} />
      </main>
    );
  }

  const product = await findProductBySlug(slug);
  if (!product) notFound();

  return (
    <main className="w-full">
      <ProductDetailView product={product} />
    </main>
  );
}
