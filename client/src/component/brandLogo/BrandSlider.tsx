"use client";

import Image from "next/image";
import { brands } from "./brandData";
import { useCmsSection } from "../../lib/CmsHomeContext";

export default function BrandSlider() {
  const partners = useCmsSection<{
    logos?: { name?: string; image?: string }[];
  }>("partners");

  const cmsLogos = (partners?.logos || [])
    .map((l) => l.image)
    .filter((src): src is string => Boolean(src));

  const logos = cmsLogos.length > 0 ? cmsLogos : brands;
  const loop = [...logos, ...logos];

  return (
    <section className="py-12 overflow-hidden ">
      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {loop.map((logo, index) => (
            <div key={index} className="flex-shrink-0 mx-10 lg:mx-16">
              <Image
                src={logo}
                alt="brand"
                width={150}
                height={60}
                className="object-contain h-14 w-auto grayscale opacity-50"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
