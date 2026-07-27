"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

import { testimonials } from "./testimonialData";
import TestimonialCard from "./TestimonialCard";
import { useCmsSection } from "../../lib/CmsHomeContext";

export default function TestimonialSection() {
  const cms = useCmsSection<{
    items?: { name?: string; role?: string; quote?: string; image?: string }[];
  }>("testimonials");

  const cmsItems = (cms?.items || [])
    .filter((i) => i?.name && i?.quote)
    .map((item, index) => ({
      id: 1000 + index,
      image: item.image || "/testimonial/image1.png",
      name: item.name || "",
      role: item.role || "",
      rating: 5,
      review: item.quote || "",
    }));

  const list = cmsItems.length > 0 ? cmsItems : testimonials;

  return (
    <section className="pb-10 lg:pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <Swiper
          modules={[Autoplay]}
          loop={list.length > 1}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          spaceBetween={20}
          slidesPerView={1.05}
          breakpoints={{
            640: { slidesPerView: 1.1, spaceBetween: 24 },
            768: { slidesPerView: 1.2, spaceBetween: 24 },
            1024: { slidesPerView: 1.25, spaceBetween: 28 },
          }}
        >
          {list.map((item) => (
            <SwiperSlide key={item.id} className="h-auto">
              <TestimonialCard testimonial={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
