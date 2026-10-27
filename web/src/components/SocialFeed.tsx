"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "foryou" | "following" | "local";

type Props = {
  userName: string;
  avatarUrl?: string | null;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "foryou", label: "Pentru tine" },
  { id: "following", label: "Urmărești" },
  { id: "local", label: "Local" },
];

const SAMPLE_POSTS = [
  {
    id: "1",
    avatar: "🐶",
    author: "Maria Popescu",
    handle: "@maria_p",
    time: "acum 2 ore",
    text: "Max a trecut cu brio prin controlul anual! Dr. Ionescu a spus că este perfect sănătos. 🐾❤️",
    likes: 24,
    comments: 5,
    tag: "Sănătate",
    tagColor: "#16a34a",
  },
  {
    id: "2",
    avatar: "🐱",
    author: "Alexandru M.",
    handle: "@alex_m",
    time: "acum 5 ore",
    text: "Luna a descoperit azi că îi place apa 😂 Prima baie fără proteste! Cineva are experiențe similare?",
    likes: 41,
    comments: 12,
    tag: "Îngrijire",
    tagColor: "#0ea5e9",
  },
  {
    id: "3",
    avatar: "🐕",
    author: "PetCare Clinic Cluj",
    handle: "@petcare_cluj",
    time: "ieri",
    text: "Program prelungit în weekend! Acum primim și sâmbăta 10:00–16:00. Programați online direct din aplicație. 🏥",
    likes: 67,
    comments: 8,
    tag: "Anunț",
    tagColor: "var(--primary)",
    verified: true,
  },
];

function PostCard({ post }: { post: typeof SAMPLE_POSTS[0] }) {
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes);

  function handleLike() {
    setLiked((prev) => {
      setLocalLikes((n) => prev ? n - 1 : n + 1);
      return !prev;
    });
  }

  return (
    <article
      className="rounded-2xl border p-4 transition-shadow hover:shadow-sm"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xl"
          style={{ background: "#fff7ed" }}>
          {post.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              {post.author}
            </span>
            {post.verified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
            )}
            <span className="text-xs" style={{ color: "var(--muted)" }}>{post.handle}</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>·</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>{post.time}</span>
            <span
              className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: `color-mix(in srgb, ${post.tagColor} 12%, transparent)`,
                color: post.tagColor,
              }}
            >
              {post.tag}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {post.text}
          </p>
          <div className="mt-3 flex items-center gap-5">
            <button
              type="button"
              onClick={handleLike}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-primary"
              style={{ color: liked ? "var(--primary)" : "var(--muted)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {localLikes}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-primary"
              style={{ color: "var(--muted)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {post.comments}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-primary"
              style={{ color: "var(--muted)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Distribuie
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SocialFeed({ userName, avatarUrl }: Props) {
  const [tab, setTab] = useState<Tab>("foryou");
  const [composerText, setComposerText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div className="max-w-xl mx-auto px-3 py-4 pb-24 md:pb-6 space-y-3">
      {/* Composer */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-base font-bold text-white"
            style={{ background: "var(--primary)" }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={userName} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            {composerOpen ? (
              <div className="space-y-3">
                <textarea
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="Ce mai fac animalele tale? 🐾"
                  rows={3}
                  autoFocus
                  className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--card-border)",
                    color: "var(--foreground)",
                  }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button type="button" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary" style={{ color: "var(--muted)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      Foto
                    </button>
                    <button type="button" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary" style={{ color: "var(--muted)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      Video
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setComposerOpen(false); setComposerText(""); }}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-primary/10"
                      style={{ color: "var(--muted)" }}
                    >
                      Anulează
                    </button>
                    <button
                      type="button"
                      disabled={!composerText.trim()}
                      className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
                    >
                      Postează
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--card-border)",
                  color: "var(--muted)",
                }}
              >
                Ce mai fac animalele tale? 🐾
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-2xl border overflow-hidden"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: tab === t.id ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent",
              color: tab === t.id ? "var(--primary)" : "var(--muted)",
              fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {tab === "foryou" && (
        <>
          {SAMPLE_POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Community CTAs */}
          <div
            className="rounded-2xl border p-5"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
              Explorează comunitatea 🐾
            </p>
            <div className="space-y-2">
              <Link href="/comunitate" className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-primary/5" style={{ background: "var(--background)" }}>
                <span className="text-xl">💬</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Comunitate</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Postări, sfaturi, povești</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
              <Link href="/forum" className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-primary/5" style={{ background: "var(--background)" }}>
                <span className="text-xl">🗣️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Forum</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Întrebări și răspunsuri</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
              <Link href="/cercuri" className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-primary/5" style={{ background: "var(--background)" }}>
                <span className="text-xl">⭕</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Cercuri</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Cluburi, events, rescue</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
          </div>
        </>
      )}

      {tab === "following" && (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="text-4xl mb-3">👥</div>
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            Niciun post de la persoanele urmărite
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Urmărește utilizatori pentru a vedea actualizările lor aici.
          </p>
          <Link href="/comunitate" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-bold text-white">
            Descoperă utilizatori
          </Link>
        </div>
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
          <Link href="/explorare" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-bold text-white">
            Explorare hartă
          </Link>
        </div>
      )}
    </div>
  );
}
