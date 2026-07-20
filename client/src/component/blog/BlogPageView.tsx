import BlogHero from "./BlogHero";
import BlogListSection from "./BlogListSection";
import Footer from "../Footer/footer";

export default function BlogPageView() {
  return (
    <div className="w-full bg-[#F5F3EF]">
      <BlogHero />
      <div className="max-w-6xl mx-auto px-6">
        <BlogListSection />
      </div>
      <Footer />
    </div>
  );
}
