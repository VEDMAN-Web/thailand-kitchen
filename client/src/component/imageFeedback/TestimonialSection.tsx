"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

import { testimonials } from "./testimonialData";
import TestimonialCard from "./TestimonialCard";

export default function TestimonialSection() {
  return (
    <section className="py-10 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <Swiper
          modules={[Autoplay]}
          loop
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          spaceBetween={20}
          slidesPerView={1.05}
          breakpoints={{
            640: { slidesPerView: 1.1, spaceBetween: 24 },
            768: { slidesPerView: 1.2, spaceBetween: 24 },
            1024: { slidesPerView: 1.25, spaceBetween: 28 },
          }}
        >
          {testimonials.map((item) => (
            <SwiperSlide key={item.id} className="h-auto">
              <TestimonialCard testimonial={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
