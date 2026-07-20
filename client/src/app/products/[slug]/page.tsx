import { notFound } from "next/navigation";
import ProductDetailView from "../../../component/products/ProductDetailView";
import {
  getProductBySlug,
  productItems,
} from "../../../component/products/productData";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return productItems.map((item) => ({ slug: item.slug }));
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="w-full">
      <ProductDetailView product={product} />
    </main>
  );
}
