const inputClassName =
  'w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a] disabled:cursor-not-allowed disabled:opacity-60'

const fields = [
  { name: 'currentPassword', label: 'Current Password' },
  { name: 'newPassword', label: 'New Password' },
  { name: 'confirmPassword', label: 'Confirm New Password' }
]

const ChangePasswordFormFields = ({ register, errors, disabled = false }) => {
  return (
    <div className="mt-4 space-y-3">
      {fields.map(({ name, label }) => (
        <label key={name} className="space-y-1">
          <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">{label}</span>
          <input
            type="password"
            autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
            disabled={disabled}
            {...register(name)}
            className={inputClassName}
          />
          {errors[name] ? <p className="text-xs text-[#b42318]">{errors[name].message}</p> : null}
        </label>
      ))}
    </div>
  )
}

export default ChangePasswordFormFields
