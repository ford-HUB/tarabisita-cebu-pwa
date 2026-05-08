const ProductCell = ({ images, label }) => {
  const hasImages = Array.isArray(images) && images.length > 0

  return (
    <div className="flex min-w-0 items-center gap-2">
      {hasImages ? (
        <div className="flex shrink-0 items-center">
          {images.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt={index === 0 ? label : ''}
              className={`relative h-8 w-8 rounded-md border-2 border-white object-cover shadow-sm ${
                index > 0 ? '-ml-2' : ''
              }`}
              style={{ zIndex: images.length - index }}
              onError={(e) => {
                e.currentTarget.remove()
              }}
            />
          ))}
        </div>
      ) : (
        <div
          className="h-8 w-8 shrink-0 rounded-md bg-[#f0e8de]"
          aria-hidden
        />
      )}
      <p className="min-w-0 font-medium leading-snug text-[#2f2f2f]">{label}</p>
    </div>
  )
}

const RecordsTableSection = ({ orders }) => {
  return (
    <div className="mt-3 overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[1fr_1.2fr_1.3fr_0.8fr_0.7fr_0.7fr_0.9fr] gap-2 border-b border-[#f0e4d7] bg-[#fff7ee] px-3 py-2 text-xs font-semibold text-[#7d5b3b]">
          <span>Order ID</span>
          <span>Customer</span>
          <span>Product</span>
          <span>Total</span>
          <span>Items</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        <div className="divide-y divide-[#f2e8dc]">
          {orders.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-[#8f8377]">No records found for the selected filters.</div>
          ) : (
            orders.map((order) => (
              <article
                key={order.id}
                className="grid grid-cols-[1fr_1.2fr_1.3fr_0.8fr_0.7fr_0.7fr_0.9fr] items-center gap-2 px-3 py-2 text-sm text-[#4f4f4f]"
              >
                <p className="font-semibold text-[#7d5b3b]">{order.id}</p>
                <p className="font-medium text-[#2f2f2f]">{order.customer}</p>
                <ProductCell images={order.productImages} label={order.product} />
                <p className="font-semibold text-[#9b5a2c]">{order.total}</p>
                <p>{order.items}</p>
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                    order.status === 'FAILED' ? 'bg-[#fff0f0] text-[#b54747]' : 'bg-[#e8f8ec] text-[#2a7b45]'
                  }`}
                >
                  {order.status}
                </span>
                <p>{order.date}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default RecordsTableSection
