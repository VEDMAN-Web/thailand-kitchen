"use client";

import { useEffect, useState } from "react";
import BlogFilters from "./BlogFilters";
import BlogFeaturedCard from "./BlogFeaturedCard";
import BlogCard from "./BlogCard";
import { blogPosts, BlogCategory, type BlogPost } from "./blogData";
import { useTranslation } from "../../i18n/LanguageProvider";
import { fetchMergedBlogs } from "../../services/cmsPublic";

export default function BlogListSection() {
  const { t } = useTranslation();
  const [active, setActive] = useState<BlogCategory>("All");
  const [posts, setPosts] = useState<BlogPost[]>(blogPosts);

  useEffect(() => {
    let alive = true;
    fetchMergedBlogs().then((list) => {
      if (alive) setPosts(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered =
    active === "All"
      ? posts
      : posts.filter((post) => post.filter === active);

  const featured = filtered.filter((post) => post.featured);
  const gridPosts = filtered.filter((post) => !post.featured);

  return (
    <section className="pb-16 lg:pb-24 bg-[#F5F3EF] pt-10 lg:pt-12">
      <BlogFilters active={active} onChange={setActive} />

      <div className="mt-12 lg:mt-16 space-y-16 lg:space-y-20 w-full">
        {featured.map((post) => (
          <BlogFeaturedCard key={post.id} post={post} />
        ))}
      </div>

      {gridPosts.length > 0 ? (
        <div className="mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 w-full">
          {gridPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-left text-[#6B6B6B]">
          {t("blog.empty")}
        </p>
      )}
    </section>
  );
}
