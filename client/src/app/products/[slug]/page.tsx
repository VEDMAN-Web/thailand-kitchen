import { notFound } from "next/navigation";
import ProductDetailView from "../../../component/products/ProductDetailView";
import { productItems } from "../../../component/products/productData";
import {
  fetchMergedProducts,
  fetchProductBySlug,
} from "../../../services/cmsPublic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const items = await fetchMergedProducts().catch(() => productItems);
  return items.map((item) => ({ slug: item.slug }));
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="w-full">
      <ProductDetailView product={product} />
    </main>
  );
}
