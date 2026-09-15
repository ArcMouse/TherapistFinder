/** A decorative, code-only phone mockup of the MindEase client app. */
export function PhoneMock() {
  const slots = ["5:00 pm", "5:50 pm", "6:40 pm", "7:30 pm"];
  const therapists = [
    { name: "Dr. Ananya Iyer", tag: "anxiety · teens", price: "₹1,500", tone: "bg-primary-100 text-primary-600" },
    { name: "Rohan Mehta", tag: "relationships", price: "₹1,200", tone: "bg-accent-100 text-accent-600" },
    { name: "Dr. Priya Nair", tag: "trauma · EMDR", price: "₹2,200", tone: "bg-ink-100 text-ink-600" },
  ];

  return (
    <div className="relative mx-auto w-[290px] animate-float">
      <div className="absolute -inset-6 -z-10 rounded-[48px] bg-gradient-to-br from-primary-500/25 via-accent-500/20 to-transparent blur-2xl" />
      <div className="rounded-[42px] border border-ink-200 bg-ink-900 p-2.5 shadow-soft">
        <div className="overflow-hidden rounded-[34px] bg-ink-50">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-4 text-[10px] font-semibold text-ink-600">
            <span>9:41</span>
            <span className="tracking-widest">▮▮▮ ᯤ ▰</span>
          </div>

          {/* greeting */}
          <div className="px-5 pb-3 pt-3">
            <p className="text-[11px] text-ink-400">Hello, Aarav 👋</p>
            <p className="text-[15px] font-bold text-ink-900">Find your therapist</p>
          </div>

          {/* search */}
          <div className="mx-5 flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-3 py-2.5">
            <span className="text-xs text-ink-400">🔍</span>
            <span className="text-[11px] text-ink-400">anxiety in teens, Sunday evening</span>
          </div>

          {/* filters */}
  

          {/* therapist cards */}
          <div className="mt-3 space-y-2.5 px-5 pb-5">
            {therapists.map((t) => (
              <div key={t.name} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">
                  {t.name.split(" ").slice(-1)[0][0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-ink-900">{t.name}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium ${t.tone}`}>
                    {t.tag}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-primary-600">{t.price}</p>
                  <p className="text-[9px] text-ink-400">/session</p>
                </div>
              </div>
            ))}
          </div>

          {/* slot strip */}
          
          </div>
        </div>
      </div>

  );
}