const ActionModalFormFields = ({ register, errors, disabled }) => (
  <label className="mt-4 block">
    <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">Admin Notes (Optional)</span>
    <textarea
      {...register('notes')}
      rows={3}
      disabled={disabled}
      className="mt-1 w-full rounded-xl border border-[#e7dfd5] px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] disabled:cursor-not-allowed disabled:opacity-60"
      placeholder="Reason or context for this action..."
    />
    {errors.notes?.message ? (
      <p className="mt-1 text-xs text-[#b42318]" role="alert">
        {errors.notes.message}
      </p>
    ) : null}
  </label>
)

export default ActionModalFormFields
