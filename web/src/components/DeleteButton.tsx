"use client";

export default function DeleteButton({
  action,
  confirmText,
  children,
}: {
  action: () => void;
  confirmText: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button className="min-h-11 rounded-full border border-red-300 px-5 text-sm font-semibold text-red-600">
        {children}
      </button>
    </form>
  );
}
