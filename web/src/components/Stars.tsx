export function StarsDisplay({ rating, count }: { rating: number; count?: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-500">
        {"★".repeat(rounded)}
        <span className="text-zinc-300">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="text-zinc-500">
        {rating.toFixed(1)}
        {typeof count === "number" ? ` (${count})` : ""}
      </span>
    </span>
  );
}

export function StarsInput({ name = "rating" }: { name?: string }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer text-2xl text-zinc-300 has-[:checked]:text-amber-500">
          <input type="radio" name={name} value={n} required className="sr-only" />
          ★
        </label>
      ))}
    </div>
  );
}
