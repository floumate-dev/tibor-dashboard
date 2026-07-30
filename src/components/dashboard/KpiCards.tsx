interface KpiCardsProps {
  totalLeads: number;
  totalPurchases: number;
  topSource: string;
  totalRevenue: number;
  currency: string;
}

export default function KpiCards({ totalLeads, totalPurchases, topSource, totalRevenue, currency }: KpiCardsProps) {
  const cards = [
    {
      label: "Ukupno leadova", value: totalLeads.toLocaleString(), accent: "#c4b5fd",
      iconBg: "rgba(139,92,246,0.1)", iconColor: "#a78bfa",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    },
    {
      label: "Ukupno kupovina", value: totalPurchases.toLocaleString(), accent: "#34d399",
      iconBg: "rgba(52,211,153,0.1)", iconColor: "#34d399",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />,
    },
    {
      label: "Top source", value: topSource || "—", accent: "#c4b5fd",
      iconBg: "rgba(139,92,246,0.1)", iconColor: "#a78bfa",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />,
    },
    {
      label: "Ukupan prihod", value: `${totalRevenue.toLocaleString()} ${currency}`, accent: "#34d399",
      iconBg: "rgba(52,211,153,0.1)", iconColor: "#34d399",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="qcard-glow p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#6b6b80" }}>{card.label}</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.iconBg }}>
              <svg className="w-[18px] h-[18px]" style={{ color: card.iconColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{card.icon}</svg>
            </div>
          </div>
          <p className="text-[30px] font-bold tracking-tight leading-none" style={{ color: card.accent }}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
