"use client";

import { useEffect, useState } from "react";
import { faqItems } from "./faqData";
import FaqItem from "./FaqItem";
import { fetchMergedFaqs, type CmsFaq } from "../../services/cmsPublic";

export default function FaqSection() {
  const [items, setItems] = useState<
    Array<{ id: number | string; question?: string; answer?: string }>
  >(faqItems);

  useEffect(() => {
    fetchMergedFaqs().then((list: CmsFaq[]) => {
      if (list.length) setItems(list);
    });
  }, []);

  return (
    <section className="bg-[#F5F3EF] pb-20 lg:pb-28">
      <div className="max-w-4xl mx-auto px-6 pt-12 lg:pt-16">
        {items.map((item) => (
          <FaqItem key={String(item.id)} item={item as any} />
        ))}
      </div>
    </section>
  );
}
