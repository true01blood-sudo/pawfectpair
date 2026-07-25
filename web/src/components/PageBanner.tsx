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
    <div className="relative -mx-4 mb-6 h-56 w-[calc(100%+2rem)] overflow-hidden sm:mx-0 sm:h-72 sm:w-full sm:rounded-3xl md:h-80 lg:h-96">
      <Image src={src} alt={alt} fill className="object-cover" priority sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <h1 className="font-heading text-2xl font-bold text-white drop-shadow sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/90 sm:text-base">{subtitle}</p>}
      </div>
    </div>
  );
}
