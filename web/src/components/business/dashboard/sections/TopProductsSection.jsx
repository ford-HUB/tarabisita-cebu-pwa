const TopProductsSection = ({ topProducts, formatCurrency }) => (
  <article className="rounded-2xl border border-[#ece3d9] bg-white p-5 shadow-sm">
    <h2 className="text-xl font-semibold text-[#1f1f1f]">Top Products</h2>
    <p className="text-sm text-[#7a7169]">Best menu items by quantity sold this year</p>

    <div className="mt-4 h-60">
      <div className="space-y-3">
        {topProducts.length === 0 ? (
          <p className="text-xs text-[#8a8179]">No completed orders yet.</p>
        ) : (
          topProducts.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-xs text-[#6d645d]">
                <span className="truncate pr-2">{item.name}</span>
                <span className="font-medium text-[#1f1f1f]">{item.sold}</span>
              </div>
              <div className="h-2 rounded-full bg-[#f2e7db]">
                <div
                  className="h-full rounded-full bg-[#9b5a2c]"
                  style={{ width: `${item.progressPct}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {topProducts.length > 0 && (
      <div className="mt-4 space-y-2 border-t border-[#f0e8de] pt-4">
        {topProducts.map((product) => (
          <div key={`${product.name}-revenue`} className="flex items-center justify-between text-xs text-[#7a7169]">
            <span className="truncate pr-2">{product.name}</span>
            <span className="font-medium text-[#4f4f4f]">{formatCurrency(product.revenue)}</span>
          </div>
        ))}
      </div>
    )}
  </article>
)

export default TopProductsSection
