const CoordinateInput = ({ label, value, disabled, onChange }) => (
  <label className="space-y-1">
    <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">{label}</span>
    <input
      type="number"
      step="0.000001"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] disabled:cursor-not-allowed disabled:bg-[#f5f1ea]"
    />
  </label>
)

export default CoordinateInput
