"use client";

import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "./blogData";
import { useTranslation } from "../../i18n/LanguageProvider";

interface Props {
  post: BlogPost;
}

export default function BlogCard({ post }: Props) {
  const { t } = useTranslation();

  return (
    <article className="group flex flex-col text-left h-full">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block w-full aspect-[16/11] rounded-[1.5rem] overflow-hidden"
      >
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>

      <p className="mt-5 text-[#E0905A] text-xs tracking-[0.22em] uppercase font-semibold">
        {post.category}
      </p>

      <h3 className="mt-3 text-xl font-extrabold text-[#1A1A1A] leading-snug">
        <Link href={`/blog/${post.slug}`} className="hover:text-[#E0905A] transition">
          {post.title}
        </Link>
      </h3>

      <p className="mt-3 text-sm text-[#6B6B6B] leading-7 line-clamp-2 flex-1">
        {post.excerpt}
      </p>

      <Link
        href={`/blog/${post.slug}`}
        className="mt-5 inline-flex items-center gap-2 text-[#E0905A] text-sm font-semibold tracking-[0.12em] uppercase hover:gap-3 transition-all"
      >
        {t("blog.readArticle")}
        <span aria-hidden>→</span>
      </Link>
    </article>
  );
}
