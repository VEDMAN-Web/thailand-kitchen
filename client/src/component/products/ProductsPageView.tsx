import ProductsHero from "./ProductsHero";
import ProductsListSection from "./ProductsListSection";
import Footer from "../Footer/footer";
import type { ProductsPageData } from "../../lib/productsCatalog";

export default function ProductsPageView({ tabs, activeSlug, products }: ProductsPageData) {
  return (
    <div className="w-full bg-[#F5F3EF]">
      <ProductsHero />
      <div className="max-w-6xl mx-auto px-6">
        <ProductsListSection key={activeSlug} tabs={tabs} activeSlug={activeSlug} products={products} />
      </div>
      <Footer />
    </div>
  );
}
