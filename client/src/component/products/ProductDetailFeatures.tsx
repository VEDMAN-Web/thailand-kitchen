import Image from "next/image";
import { ProductItem } from "./productData";

interface Props {
  product: ProductItem;
}

export default function ProductDetailFeatures({ product }: Props) {
  const [detailA, detailB] = product.detailImages;

  return (
    <section className="pt-16 sm:pt-20 lg:pt-24 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <ul className="space-y-8 sm:space-y-10">
          {product.features.map((feature) => (
            <li key={feature.title} className="flex gap-4 sm:gap-5">
              <span
                className="mt-1 shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#E0905A] flex items-center justify-center"
                aria-hidden
              >
                <span className="w-2 h-2 rounded-full bg-[#E0905A]" />
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#1A1A1A]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm sm:text-[15px] text-[#6B6B6B] leading-7 max-w-md">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Wider left + narrower right, tight gap — match design */}
        <div className="flex items-end gap-2.5 sm:gap-3 w-full max-w-md lg:max-w-none mx-auto lg:mx-0">
          <div className="group relative w-[58%] aspect-[3/4] rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden shrink-0">
            <Image
              src={detailA}
              alt={`${product.name} finish detail`}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 1024px) 45vw, 22vw"
            />
          </div>
          <div className="group relative w-[38%] aspect-[2/3] mb-4 sm:mb-6 rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden shrink-0">
            <Image
              src={detailB}
              alt={`${product.name} material detail`}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 1024px) 30vw, 15vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
