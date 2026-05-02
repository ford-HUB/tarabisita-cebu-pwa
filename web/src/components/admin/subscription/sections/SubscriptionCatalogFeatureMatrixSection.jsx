import { useWatch } from 'react-hook-form'

const SubscriptionCatalogFeatureMatrixSection = ({ register, control, errors }) => {
  const columns = useWatch({ control, name: 'columns' }) || []
  const rows = useWatch({ control, name: 'rows' }) || []

  return (
    <section className="rounded-2xl border border-[#e7dfd5] bg-white p-5 shadow-sm">
      <header className="mb-4 border-b border-[#f0e8de] pb-3">
        <h2 className="text-base font-semibold text-[#2f2f2f]">Compare features matrix</h2>
        <p className="mt-1 text-sm text-[#6d645d]">
          Column headers and row cells use the same keys as the business{' '}
          <span className="font-medium text-[#2f2f2f]">Compare features</span> modal. Cell values:{' '}
          <code className="text-[11px] text-[#9b5a2c]">yes</code>, <code className="text-[11px] text-[#9b5a2c]">no</code>,{' '}
          <code className="text-[11px] text-[#9b5a2c]">limited</code>, <code className="text-[11px] text-[#9b5a2c]">dash</code>, or
          plain text (for prices and copy).
        </p>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col, index) => (
          <div
            key={col?.key || index}
            className={`rounded-xl border p-3 ${col?.highlighted ? 'border-[#d8b79f] bg-[#fff8f1]' : 'border-[#efe7dc] bg-[#fcfaf7]'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#a19384]">Column: {col?.key}</p>
            <label className="mt-2 block text-xs text-[#6d645d]">
              Title
              <input className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-2 py-1.5 text-sm" {...register(`columns.${index}.title`)} />
            </label>
            <label className="mt-2 block text-xs text-[#6d645d]">
              Subtitle
              <input
                className="mt-1 w-full rounded-lg border border-[#e7dfd5] bg-white px-2 py-1.5 text-sm"
                {...register(`columns.${index}.subtitle`)}
              />
            </label>
            <label className="mt-2 flex items-center gap-2 text-xs text-[#6d645d]">
              <input type="checkbox" {...register(`columns.${index}.highlighted`, { valueAsBoolean: true })} />
              Highlight column
            </label>
            <input type="hidden" {...register(`columns.${index}.key`)} />
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#efe7dc]">
        <table className="min-w-[720px] w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#fcfaf7]">
              <th className="border-b border-[#f0e8de] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#a19384]">
                Feature label
              </th>
              {columns.map((col) => (
                <th key={col?.key} className="border-b border-[#f0e8de] px-2 py-2 text-left text-xs text-[#6d645d]">
                  {col?.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[#f5eee4] last:border-0">
                <td className="px-3 py-2 align-top">
                  <input
                    className="w-full min-w-[180px] rounded-lg border border-[#e7dfd5] px-2 py-1.5 text-sm"
                    {...register(`rows.${rowIndex}.label`)}
                  />
                  {errors.rows?.[rowIndex]?.label && (
                    <span className="mt-1 block text-xs text-red-600">{errors.rows[rowIndex].label.message}</span>
                  )}
                </td>
                {columns.map((col) => (
                  <td key={`${rowIndex}-${col?.key}`} className="px-2 py-2 align-top">
                    <input
                      className="w-full min-w-[100px] rounded-lg border border-[#e7dfd5] px-2 py-1.5 text-sm"
                      {...register(`rows.${rowIndex}.values.${col.key}`)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default SubscriptionCatalogFeatureMatrixSection
