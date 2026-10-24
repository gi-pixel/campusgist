type IconProps = { className?: string; filled?: boolean };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const HeartIcon = ({ className = "w-5 h-5", filled }: IconProps) => (
  <svg {...base} fill={filled ? "currentColor" : "none"} className={className}>
    <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
  </svg>
);

export const CommentIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M20.5 12a8.5 8.5 0 1 1-3.4-6.8L20.5 4l-.9 4.1A8.4 8.4 0 0 1 20.5 12z" />
  </svg>
);

export const RepostIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M17 3l3 3-3 3" />
    <path d="M4 11V9a3 3 0 0 1 3-3h13" />
    <path d="M7 21l-3-3 3-3" />
    <path d="M20 13v2a3 3 0 0 1-3 3H4" />
  </svg>
);

export const SendIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M21 3L10 14" />
    <path d="M21 3l-6.5 18-4-8-8-4L21 3z" />
  </svg>
);

export const HomeIcon = ({ className = "w-6 h-6", filled }: IconProps) => (
  <svg {...base} fill={filled ? "currentColor" : "none"} className={className}>
    <path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5z" />
  </svg>
);

export const SearchIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);

export const ComposeIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    <path d="M18.5 3.5a2 2 0 0 1 3 3L12 16l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const UserIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" />
  </svg>
);

export const MoreIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="5.5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18.5" cy="12" r="1.6" />
  </svg>
);

export const ThreadsLogo = ({ className = "w-8 h-8" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.6 11.2c-.4-3.2-2.4-5-5.6-5-3.4 0-5.6 2.4-5.6 6s2.2 6 5.6 6c2.8 0 4.7-1.4 4.7-3.5 0-2.2-2-3.2-4.4-3.2-1.8 0-3 .8-3 2 0 1.1.9 1.8 2.2 1.8 2.2 0 3.7-1.7 3.7-4.6" />
  </svg>
);