import { Link, useRoute } from "wouter";
import { getPostBySlug } from "@/lib/blog-posts";
import NotFound from "@/pages/not-found";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const post = params ? getPostBySlug(params.slug) : undefined;

  if (!post) return <NotFound />;

  return (
    <div className="animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 lg:col-start-3">
          <Link href="/blog">
            <span className="inline-block text-[11px] font-light text-foreground/40 hover:text-foreground tracking-[0.04em] cursor-pointer mb-10 transition-colors">
              ← Blog
            </span>
          </Link>

          <header className="mb-12">
            <div className="flex items-baseline gap-3 mb-5">
              <time className="text-[10px] font-light text-foreground/30 tracking-[0.06em] uppercase">
                {post.date}
              </time>
              <span className="text-[10px] font-light text-foreground/20">·</span>
              <span className="text-[10px] font-light text-foreground/30 tracking-[0.06em]">
                {post.author}
              </span>
            </div>
            <h1 className="font-serif-editorial text-[44px] tracking-[-0.025em] text-foreground leading-[1.08]">
              {post.title}
            </h1>
          </header>

          <article className="prose-blog">{post.content}</article>
        </div>
      </div>
    </div>
  );
}
