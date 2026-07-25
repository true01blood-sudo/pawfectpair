type IconProps = { className?: string };

const base = "w-6 h-6";

export const HomeIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PawIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <ellipse cx="7" cy="8" rx="2" ry="2.6" />
    <ellipse cx="12" cy="6" rx="2" ry="2.8" />
    <ellipse cx="17" cy="8" rx="2" ry="2.6" />
    <path d="M12 11c-3.3 0-5.5 2.2-5.5 4.6 0 2 1.6 3.4 3.6 3.4.9 0 1.4-.4 1.9-.4s1 .4 1.9.4c2 0 3.6-1.4 3.6-3.4C17.5 13.2 15.3 11 12 11Z" />
  </svg>
);

export const VetIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M6 4v6a4 4 0 0 0 8 0V4" strokeLinecap="round" />
    <path d="M6 4H4M14 4h-2" strokeLinecap="round" />
    <circle cx="18" cy="16" r="3" />
    <path d="M10 14v1a4 4 0 0 0 4.6 3.96" strokeLinecap="round" />
  </svg>
);

export const BagIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M6 8h12l-1 12H7L6 8Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
  </svg>
);

export const ChatIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M4 5h16v11H8l-4 4V5Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UserIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" strokeLinecap="round" />
  </svg>
);

export const SearchIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
  </svg>
);

export const MenuIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
  </svg>
);

export const CloseIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="m5 5 14 14M19 5 5 19" strokeLinecap="round" />
  </svg>
);

export const PlusIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

export const FilterIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    <circle cx="8" cy="6" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
