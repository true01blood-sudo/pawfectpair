import AppShell from "@/components/AppShell";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <article className="prose prose-zinc max-w-none prose-headings:font-bold prose-a:text-primary">
          {children}
        </article>
      </main>
    </AppShell>
  );
}
