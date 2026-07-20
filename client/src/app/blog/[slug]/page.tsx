import { notFound } from "next/navigation";
import BlogDetailView from "../../../component/blog/BlogDetailView";
import { blogPosts, getBlogBySlug } from "../../../component/blog/blogData";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) notFound();

  return (
    <main className="w-full">
      <BlogDetailView post={post} />
    </main>
  );
}
