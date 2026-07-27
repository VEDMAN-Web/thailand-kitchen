import { notFound } from "next/navigation";
import BlogDetailView from "../../../component/blog/BlogDetailView";
import { blogPosts } from "../../../component/blog/blogData";
import {
  fetchBlogBySlug,
  fetchMergedBlogs,
} from "../../../services/cmsPublic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await fetchMergedBlogs().catch(() => blogPosts);
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = await fetchBlogBySlug(slug);

  if (!post) notFound();

  return (
    <main className="w-full">
      <BlogDetailView post={post} />
    </main>
  );
}
