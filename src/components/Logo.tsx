export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid size-8 place-items-center rounded-lg bg-[#0f1011] border border-[rgba(255,255,255,0.08)] text-white shadow-sm transition-transform hover:scale-105">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".9" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".35" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".35" />
          <path d="M17 13l1.2 2.8L21 17l-2.8 1.2L17 21l-1.2-2.8L13 17l2.8-1.2z" fill="#5e6ad2" />
        </svg>
      </span>
      <span className="font-sans text-[15px] font-semibold tracking-tight text-[#f7f8f8]">
        SocialPack <span className="text-[#7170ff] text-[10px] font-bold uppercase tracking-wider ml-1 px-1.5 py-0.5 rounded-full bg-[#5e6ad2]/15 border border-[#5e6ad2]/30">AI</span>
      </span>
    </span>
  );
}
