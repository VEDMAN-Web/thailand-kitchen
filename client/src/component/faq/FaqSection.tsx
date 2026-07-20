import { faqItems } from "./faqData";
import FaqItem from "./FaqItem";

export default function FaqSection() {
  return (
    <section className="bg-[#F5F3EF] pb-20 lg:pb-28">
      <div className="max-w-4xl mx-auto px-6 pt-12 lg:pt-16">
        {faqItems.map((item) => (
          <FaqItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
