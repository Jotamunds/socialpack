export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-brand-gradient animate-gradient shadow-lg shadow-brand-fuchsia/30">
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".55" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".55" />
          <path d="M17 13l1.2 2.8L21 17l-2.8 1.2L17 21l-1.2-2.8L13 17l2.8-1.2z" fill="currentColor" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        SocialPack <span className="text-gradient">AI</span>
      </span>
    </span>
  );
}
