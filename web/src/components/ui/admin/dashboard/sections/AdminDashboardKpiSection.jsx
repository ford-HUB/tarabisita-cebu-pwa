const AdminDashboardKpiSection = ({ cards }) => (
  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {cards.map((card) => (
      <article key={card.label} className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">{card.label}</p>
        <p className="mt-2 text-3xl font-bold text-[#202020]">{Number(card.value || 0).toLocaleString()}</p>
        <p className="mt-1 text-xs text-[#7a7169]">{card.helper}</p>
      </article>
    ))}
  </section>
)

export default AdminDashboardKpiSection
