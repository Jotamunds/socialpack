export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#828fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]";

export const primaryButtonClass = `h-10 px-4 rounded-md bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-[13px] font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.4)] active:scale-[0.98] inline-flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${focusRing}`;

export const secondaryButtonClass = `h-10 px-4 rounded-md bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-[#f7f8f8] text-[13px] font-medium transition-colors inline-flex items-center justify-center ${focusRing}`;
