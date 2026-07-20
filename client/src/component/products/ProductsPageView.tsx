import ProductsHero from "./ProductsHero";
import ProductsListSection from "./ProductsListSection";
import Footer from "../Footer/footer";

export default function ProductsPageView() {
  return (
    <div className="w-full bg-[#F5F3EF]">
      <ProductsHero />
      <div className="max-w-6xl mx-auto px-6">
        <ProductsListSection />
      </div>
      <Footer />
    </div>
  );
}
