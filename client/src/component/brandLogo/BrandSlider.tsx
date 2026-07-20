"use client";

import Image from "next/image";
import { brands } from "./brandData";

export default function BrandSlider() {
  return (
    <section className="py-12 overflow-hidden ">

      <div className="relative">

        <div className="flex animate-marquee whitespace-nowrap">

          {[...brands, ...brands].map((logo, index) => (
            <div
              key={index}
              className="flex-shrink-0 mx-10 lg:mx-16"
            >
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