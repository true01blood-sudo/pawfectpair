import { PawIcon, BagIcon } from "@/components/icons";

export function PetPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-primary/10 ${className}`}>
      <PawIcon className="h-1/3 w-1/3 text-primary/50" />
    </div>
  );
}

export function ProductPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-zinc-100 ${className}`}>
      <BagIcon className="h-1/3 w-1/3 text-zinc-300" />
    </div>
  );
}
