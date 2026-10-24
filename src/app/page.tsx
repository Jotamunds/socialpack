export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#08090a] text-[#f7f8f8]">
      <div className="max-w-md text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
          SocialPack Foundation Ready
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#f7f8f8]">
          SocialPack AI
        </h1>
        <p className="text-sm text-[#8a8f98]">
          Fundação, clientes Supabase e middleware de segurança inicializados.
        </p>
      </div>
    </main>
  );
}
