"use client";

import { useState } from "react";

type Tab = "following" | "foryou" | "local";

export type SocialPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorRole: string;
  authorVerified: boolean;
  postType: string;
  title: string;
  body: string;
  mediaUrl: string | null;
  mediaType: string | null;
  videoDuration: string | null;
  location: string | null;
  createdAt: string;
  reactionCounts: { heart: number; thumbup: number; smile: number };
  commentCount: number;
};

type Props = {
  userName: string;
  avatarUrl?: string | null;
  initialPosts?: SocialPost[];
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}z`;
}

function roleBadge(role: string): { label: string; color: string } | null {
  if (role === "vet") return { label: "Veterinar", color: "#16a34a" };
  if (role === "shelter") return { label: "Adăpost", color: "#2563eb" };
  if (role === "admin") return { label: "Admin", color: "#7c3aed" };
  return null;
}

function PostCard({ post, currentUserId }: { post: SocialPost; currentUserId?: string }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.reactionCounts.heart);
  const [saved, setSaved] = useState(false);

  const badge = roleBadge(post.authorRole);
  const timeLabel = post.createdAt ? timeAgo(post.createdAt) : "";
  const hasVideo = post.mediaType === "video";

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
              className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-lg overflow-hidden"
              style={{ background: "#fff7ed" }}
            >
              {post.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.authorAvatar} alt={post.authorName} className="h-10 w-10 object-cover rounded-full" />
              ) : (
                <span className="text-base font-bold" style={{ color: "var(--primary)" }}>
                  {post.authorName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  {post.authorName}
                </span>
                {post.authorVerified && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                  </svg>
                )}
                {badge && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: `color-mix(in srgb, ${badge.color} 12%, transparent)`,
                      color: badge.color,
                    }}
                  >
                    🐾 {badge.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {timeLabel && <span>{timeLabel}</span>}
                {post.location && (
                  <>
                    <span>·</span>
                    <span>{post.location}</span>
                  </>
                )}
                <span>·</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
            </div>
          </div>
          <button type="button" className="p-1 rounded-full hover:bg-primary/10 transition-colors" style={{ color: "var(--muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
        </div>

        {/* Title + body */}
        <div className="mt-3">
          {post.title && (
            <h3 className="font-bold text-base leading-snug" style={{ color: "var(--foreground)" }}>
              {post.title}
            </h3>
          )}
          <p className="mt-1 text-sm leading-relaxed" style={{ color: post.title ? "var(--muted)" : "var(--foreground)" }}>
            {post.body}
          </p>
        </div>
      </div>

      {/* Media */}
      {(post.mediaUrl || hasVideo) && (
        <div
          className="relative mx-4 mb-3 rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #e8f4ea 0%, #c8ddc9 100%)", aspectRatio: "16/9" }}
        >
          {post.mediaUrl && post.mediaType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.mediaUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-7xl opacity-40">🐕</div>
            </div>
          )}
          {hasVideo && (
            <>
              <button type="button" className="absolute inset-0 flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--primary)">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
              </button>
              {post.videoDuration && (
                <span
                  className="absolute bottom-2 right-2 rounded-md px-2 py-0.5 text-xs font-bold text-white"
                  style={{ background: "rgba(0,0,0,0.7)" }}
                >
                  {post.videoDuration}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <div className="px-4 pb-4">
        {/* Reaction counts */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-0.5">
              {(liked || post.reactionCounts.heart > 0) && <span className="text-sm">❤️</span>}
              {post.reactionCounts.thumbup > 0 && <span className="text-sm">👍</span>}
              {post.reactionCounts.smile > 0 && <span className="text-sm">😊</span>}
              {!liked && post.reactionCounts.heart === 0 && post.reactionCounts.thumbup === 0 && post.reactionCounts.smile === 0 && (
                <span className="text-sm">👍</span>
              )}
            </div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {likeCount + post.reactionCounts.thumbup + post.reactionCounts.smile}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
            {post.commentCount > 0 && <span>{post.commentCount} comentarii</span>}
          </div>
        </div>

        {/* Actions */}
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
            Comentariu
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

        {/* Save CTA for lesson type */}
        {post.postType === "lesson" && (
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
              {saved ? "Salvat" : "Salvează lecția"}
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
              style={{ border: "1.5px solid var(--card-border)", color: "var(--foreground)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Vezi profesionistul
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// ── Sample fallback posts (shown when DB has no posts yet) ──
const SAMPLE_POSTS: SocialPost[] = [
  {
    id: "sample-1",
    authorId: "",
    authorName: "Dr. Maya",
    authorAvatar: null,
    authorRole: "vet",
    authorVerified: true,
    postType: "lesson",
    title: "O vizită la vet mai calmă începe acasă",
    body: "Pași simpli de antrenament pozitiv care pot face o mare diferență pentru bunăstarea animalului tău.",
    mediaUrl: null,
    mediaType: "video",
    videoDuration: "4:32",
    location: "Cluj-Napoca",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    reactionCounts: { heart: 248, thumbup: 0, smile: 0 },
    commentCount: 42,
  },
  {
    id: "sample-2",
    authorId: "",
    authorName: "Lara & Max",
    authorAvatar: null,
    authorRole: "user",
    authorVerified: false,
    postType: "photo",
    title: "",
    body: "Dimineață perfectă la lac 🧡 Nimic nu bate aerul proaspăt, compania bună și câinii fericiți! 🐾",
    mediaUrl: null,
    mediaType: null,
    videoDuration: null,
    location: "Parcul Cișmigiu",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    reactionCounts: { heart: 0, thumbup: 91, smile: 12 },
    commentCount: 14,
  },
];

export default function SocialFeed({ userName, avatarUrl, initialPosts }: Props) {
  const [tab, setTab] = useState<Tab>("following");
  const [composerText, setComposerText] = useState("");

  const initials = userName ? userName.charAt(0).toUpperCase() : "U";
  const posts = (initialPosts && initialPosts.length > 0) ? initialPosts : SAMPLE_POSTS;

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
                <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 7 1 3h8z"/>
                </svg>
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
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filtre
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
            placeholder="Împărtășește un moment, pune o întrebare sau dă un sfat..."
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
            {
              label: "Foto/Video",
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              ),
            },
            {
              label: "Întreabă",
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              ),
            },
            {
              label: "Sondaj",
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              ),
            },
            {
              label: "Event",
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              ),
            },
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
          {posts.map((post) => (
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
