import type { Metadata } from "next";
import ProductsPageView from "../../component/products/ProductsPageView";
import { getProductsPageData } from "../../lib/productsCatalog";

export const metadata: Metadata = {
  title: "Kitchen Collections | Thailand Kitchens",
  description:
    "Browse our full range of custom teak kitchen collections — modern, island, U-shape, L-shape, straight, and T-shape layouts crafted and installed across Thailand.",
};

export default async function ProductsPage() {
  const data = (await getProductsPageData("modern")) ?? {
    tabs: [],
    activeSlug: "modern",
    activeLabel: "Modern",
    products: [],
  };
  return (
    <main className="w-full">
      <ProductsPageView {...data} />
    </main>
  );
}
