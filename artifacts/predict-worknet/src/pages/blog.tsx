import { Link } from "wouter";
import { BLOG_POSTS } from "@/lib/blog-posts";

export default function Blog() {
  return (
    <div className="animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-9 lg:col-start-2 space-y-16">
          <div>
            <h1 className="font-serif-editorial text-[48px] tracking-[-0.03em] text-foreground leading-[1.05] mb-4">
              Blog
            </h1>
            <p className="text-[13px] text-foreground/30 font-light leading-relaxed max-w-xl">
              Notes from the team — research, mechanism changes, what we're seeing on the
              network.
            </p>
          </div>

          <div className="divide-y divide-border/40">
            {BLOG_POSTS.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className="group cursor-pointer py-8 first:pt-0 block">
                  <div className="flex items-baseline gap-3 mb-3">
                    <time className="text-[10px] font-light text-foreground/30 tracking-[0.06em] uppercase">
                      {post.date}
                    </time>
                    <span className="text-[10px] font-light text-foreground/20">·</span>
                    <span className="text-[10px] font-light text-foreground/30 tracking-[0.06em]">
                      {post.author}
                    </span>
                  </div>
                  <h2 className="font-serif-editorial text-[28px] tracking-[-0.02em] text-foreground leading-[1.15] mb-3 group-hover:text-foreground/70 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-[13px] text-foreground/50 font-light leading-[1.7] max-w-2xl">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 text-[11px] font-light text-foreground/40 group-hover:text-foreground transition-colors tracking-[0.04em]">
                    Read →
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
