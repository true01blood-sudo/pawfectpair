"use client";

import { useState } from "react";

type Tab = "following" | "foryou" | "local";

type Props = {
  userName: string;
  avatarUrl?: string | null;
};

const SAMPLE_POSTS = [
  {
    id: "1",
    avatarUrl: null as string | null,
    avatarEmoji: "👩‍⚕️",
    author: "Dr. Maya",
    badge: "Veterinarian",
    badgeColor: "#16a34a",
    verified: true,
    time: "2h ago",
    location: "Lugano",
    visibility: "public",
    title: "A calmer vet visit starts at home",
    subtitle: "Simple, positive training steps can make a big difference for your pet's wellbeing.",
    imageUrl: null as string | null,
    hasVideo: true,
    videoDuration: "4:32",
    reactions: { heart: true, thumbUp: false, smile: false, count: 248 },
    comments: 42,
    shares: 18,
    ctaPrimary: "Save lesson",
    ctaSecondary: "View professional",
  },
  {
    id: "2",
    avatarUrl: null as string | null,
    avatarEmoji: "👩",
    author: "Lara & Max",
    badge: null as string | null,
    badgeColor: "",
    verified: false,
    time: "5h ago",
    location: "Parco Ciani, Lugano",
    visibility: "public",
    title: "Perfect morning at the lake 🧡",
    subtitle: "Nothing beats fresh air, good company and happy dogs! 🐾",
    imageUrl: null as string | null,
    hasVideo: false,
    videoDuration: "",
    reactions: { heart: false, thumbUp: true, smile: true, count: 91 },
    comments: 14,
    shares: 6,
    ctaPrimary: null as string | null,
    ctaSecondary: null as string | null,
  },
];

function PostCard({ post }: { post: typeof SAMPLE_POSTS[0] }) {
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(post.reactions.heart);
  const [likeCount, setLikeCount] = useState(post.reactions.count);

  return (
    <article
      className="rounded-2xl border overflow-hidden"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="p-4">
        {/* Author row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-lg"
              style={{ background: "#fff7ed" }}
            >
              {post.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  {post.author}
                </span>
                {post.verified && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                  </svg>
                )}
                {post.badge && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: `color-mix(in srgb, ${post.badgeColor} 12%, transparent)`,
                      color: post.badgeColor,
                    }}
                  >
                    🐾 {post.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                <span>{post.time}</span>
                {post.location && (
                  <>
                    <span>·</span>
                    <span>{post.location}</span>
                  </>
                )}
                <span>·</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
            </div>
          </div>
          <button type="button" className="p-1 rounded-full hover:bg-primary/10 transition-colors" style={{ color: "var(--muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>

        {/* Title + body */}
        <div className="mt-3">
          <h3 className="font-bold text-base leading-snug" style={{ color: "var(--foreground)" }}>
            {post.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {post.subtitle}
          </p>
        </div>
      </div>

      {/* Image/video placeholder */}
      {(post.imageUrl || post.hasVideo) && (
        <div
          className="relative mx-4 mb-3 rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #e8f4ea 0%, #c8ddc9 100%)", aspectRatio: "16/9" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl opacity-40">🐕</div>
          </div>
          {post.hasVideo && (
            <>
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--primary)">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
              </button>
              <span
                className="absolute bottom-2 right-2 rounded-md px-2 py-0.5 text-xs font-bold text-white"
                style={{ background: "rgba(0,0,0,0.7)" }}
              >
                {post.videoDuration}
              </span>
            </>
          )}
        </div>
      )}

      <div className="px-4 pb-4">
        {/* Reactions row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[
                { emoji: "❤️", active: liked },
                { emoji: "👍", active: post.reactions.thumbUp },
                { emoji: "😊", active: post.reactions.smile },
              ].filter((r) => r.active).map((r, i) => (
                <span key={i} className="text-sm">{r.emoji}</span>
              ))}
              {!liked && !post.reactions.thumbUp && !post.reactions.smile && (
                <span className="text-sm">👍</span>
              )}
            </div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {likeCount}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
            <span>{post.comments} comments</span>
            <span>{post.shares} shares</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
          <button
            type="button"
            onClick={() => {
              setLiked((p) => {
                setLikeCount((n) => p ? n - 1 : n + 1);
                return !p;
              });
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-colors hover:bg-primary/8 hover:text-primary"
            style={{ color: liked ? "var(--primary)" : "var(--muted)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Like
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-colors hover:bg-primary/8 hover:text-primary"
            style={{ color: "var(--muted)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Comment
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-colors hover:bg-primary/8 hover:text-primary"
            style={{ color: "var(--muted)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>

        {/* CTAs */}
        {post.ctaPrimary && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setSaved((p) => !p)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-colors"
              style={{
                background: saved ? "var(--primary)" : "transparent",
                color: saved ? "white" : "var(--primary)",
                border: "2px solid var(--primary)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
              </svg>
              {post.ctaPrimary}
            </button>
            {post.ctaSecondary && (
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                style={{ border: "1.5px solid var(--card-border)", color: "var(--foreground)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                {post.ctaSecondary}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function SocialFeed({ userName, avatarUrl }: Props) {
  const [tab, setTab] = useState<Tab>("following");
  const [composerText, setComposerText] = useState("");

  const initials = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 space-y-3">

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(["following", "foryou", "local"] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = {
            following: "Following",
            foryou: "For you",
            local: "Local",
          };
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
              style={{
                background: active ? "var(--primary)" : "transparent",
                color: active ? "white" : "var(--foreground)",
                border: active ? "none" : "1.5px solid var(--card-border)",
              }}
            >
              {labels[t]}
              {t === "local" && (
                <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M5 7 1 3h8z"/></svg>
              )}
            </button>
          );
        })}
        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors hover:border-primary/40"
          style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filter
        </button>
      </div>

      {/* Composer */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden"
            style={{ background: "var(--primary)" }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={userName} className="h-9 w-9 rounded-full object-cover" />
            ) : initials}
          </div>
          <input
            type="text"
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder="Share a moment, ask a question or give a tip..."
            className="flex-1 rounded-full border px-4 py-2 text-sm outline-none transition-colors focus:border-primary"
            style={{
              background: "var(--surface)",
              borderColor: "var(--card-border)",
              color: "var(--foreground)",
            }}
          />
        </div>
        <div className="flex items-center gap-1 border-t pt-3" style={{ borderColor: "var(--card-border)" }}>
          {[
            { icon: <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></>, label: "Photo/Video" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label: "Ask" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label: "Poll" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: "Event" },
          ].map((a) => (
            <button
              key={a.label}
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-colors hover:bg-primary/8 hover:text-primary"
              style={{ color: "var(--muted)" }}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {(tab === "following" || tab === "foryou") && (
        <>
          {SAMPLE_POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </>
      )}

      {tab === "local" && (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="text-4xl mb-3">📍</div>
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            Feed local în curând
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Postări de la utilizatori din zona ta.
          </p>
        </div>
      )}
    </div>
  );
}
