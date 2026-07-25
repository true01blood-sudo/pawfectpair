import Image from "next/image";

export default function PageBanner({
  src,
  alt,
  title,
  subtitle,
}: {
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative mb-4 h-32 w-full overflow-hidden rounded-2xl sm:h-40">
      <Image src={src} alt={alt} fill className="object-cover" priority sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
      </div>
    </div>
  );
}
