"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

type Props = {
  notifications: Record<string, unknown>[];
  unreadCount: number;
};

const TYPE_ICON: Record<string, string> = {
  appointment: "🩺",
  vaccine: "💉",
  adoption: "🐾",
  event: "🎉",
  social: "💬",
  system: "⚙️",
  info: "🔔",
  emergency: "🆘",
};

const TYPE_LABEL: Record<string, string> = {
  appointment: "Programare",
  vaccine: "Vaccinare",
  adoption: "Adopție",
  event: "Eveniment",
  social: "Social",
  system: "Sistem",
  info: "Notificare",
  emergency: "Urgență",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "acum";
  if (mins < 60) return `acum ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `acum ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `acum ${days}z`;
  return new Date(dateStr).toLocaleDateString("ro-RO");
}

const FILTER_TABS = [
  { id: "", label: "Toate" },
  { id: "unread", label: "Necitite" },
  { id: "appointment", label: "Programări" },
  { id: "vaccine", label: "Vaccinuri" },
  { id: "adoption", label: "Adopții" },
];

export default function NotificariClient({ notifications: rawNotifs, unreadCount: initialUnread }: Props) {
  const notifications = rawNotifs as unknown as Notification[];
  const [filter, setFilter] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [allRead, setAllRead] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const unreadCount = allRead ? 0 : Math.max(0, initialUnread - readIds.size);

  function isRead(n: Notification) {
    if (allRead) return true;
    if (readIds.has(n.id)) return true;
    return n.is_read;
  }

  async function markRead(id: string) {
    if (isRead({ id } as Notification)) return;
    setReadIds((s) => new Set([...s, id]));
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  async function markAllRead() {
    setAllRead(true);
    const supabase = createClient();
    startTransition(async () => {
      const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (ids.length > 0) {
        await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      }
      router.refresh();
    });
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !isRead(n);
    if (filter && filter !== "unread") return n.type === filter;
    return true;
  });

  const displayList = filtered;
  const isEmpty = filtered.length === 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            Notificări
            {unreadCount > 0 && (
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                style={{ background: "var(--primary)" }}
              >
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-medium"
            style={{ color: "var(--primary)" }}
          >
            Marchează toate citite
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className="flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: filter === tab.id ? "var(--primary)" : "var(--card-bg)",
              borderColor: filter === tab.id ? "var(--primary)" : "var(--card-border)",
              color: filter === tab.id ? "#fff" : "var(--foreground)",
            }}
          >
            {tab.label}
            {tab.id === "unread" && unreadCount > 0 && (
              <span className="ml-1 opacity-80">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {isEmpty ? (
        <div
          className="rounded-2xl border-2 border-dashed p-10 text-center"
          style={{ borderColor: "var(--card-border)" }}
        >
          <p className="text-3xl mb-2">✓</p>
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>
            {filter === "unread"
              ? "Nicio notificare necitită"
              : filter === "" && notifications.length === 0
                ? "Nicio notificare momentan"
                : "Nicio notificare în această categorie"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map((n) => {
            const read = isRead(n);
            return (
              <button
                key={n.id}
                className="w-full text-left flex items-start gap-3 rounded-2xl border p-4 transition-all hover:shadow-sm"
                style={{
                  background: read
                    ? "var(--card-bg)"
                    : "color-mix(in srgb, var(--primary) 5%, var(--card-bg))",
                  borderColor: read
                    ? "var(--card-border)"
                    : "color-mix(in srgb, var(--primary) 25%, transparent)",
                }}
                onClick={() => markRead(n.id)}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: read
                      ? "var(--surface)"
                      : "color-mix(in srgb, var(--primary) 10%, transparent)",
                  }}
                >
                  {TYPE_ICON[n.type] ?? "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {n.title}
                      </p>
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: "var(--muted)" }}
                      >
                        {TYPE_LABEL[n.type] ?? n.type}
                      </span>
                    </div>
                    <span className="text-[10px] shrink-0 mt-0.5" style={{ color: "var(--muted)" }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{n.body}</p>
                  {n.link && (
                    <a
                      href={n.link}
                      className="text-xs mt-1 block font-medium"
                      style={{ color: "var(--primary)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Deschide →
                    </a>
                  )}
                </div>
                {!read && (
                  <div
                    className="h-2 w-2 rounded-full mt-2 shrink-0"
                    style={{ background: "var(--primary)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {notifications.length === 0 && (
        <p className="mt-4 text-center text-xs" style={{ color: "var(--muted)" }}>
          Notificările vor apărea aici pe măsură ce activezi aplicația.
        </p>
      )}
    </>
  );
}
