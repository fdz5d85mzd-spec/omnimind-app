export default function AdminLoading() {
  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-7 w-40 rounded bg-white/[0.06]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 h-[72px]" />
          ))}
        </div>
        <div className="glass rounded-2xl p-5 h-40" />
        <div className="glass rounded-2xl p-5 h-40" />
      </main>
    </div>
  );
}
