export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid size-8 place-items-center rounded-xl bg-[#1d1d1f] text-white shadow-sm transition-transform hover:scale-105">
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".4" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".4" />
          <path d="M17 13l1.2 2.8L21 17l-2.8 1.2L17 21l-1.2-2.8L13 17l2.8-1.2z" fill="#0071e3" />
        </svg>
      </span>
      <span className="font-sans text-[17px] font-semibold tracking-tight text-[#1d1d1f]">
        SocialPack <span className="text-[#0071e3] text-xs font-bold uppercase tracking-wider ml-0.5 px-1.5 py-0.5 rounded-full bg-[#0071e3]/10">AI</span>
      </span>
    </span>
  );
}
