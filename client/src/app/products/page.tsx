import { Suspense } from "react";
import ProductsPageView from "../../component/products/ProductsPageView";

export default function Page() {
  return (
    <main className="w-full">
      <Suspense fallback={<div className="min-h-[40vh] bg-[#F5F3EF]" />}>
        <ProductsPageView />
      </Suspense>
    </main>
  );
}
