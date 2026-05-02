const ManageUsersWhitelistToggle = ({ checked, disabled, busy, onChange, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-busy={busy}
    disabled={disabled || busy}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-[2.75rem] shrink-0 items-center rounded-full border transition ${
      checked
        ? 'border-[#c49a6c] bg-[#9b5a2c]'
        : 'border-[#e1d4c5] bg-[#e8dfd4]'
    } ${disabled || busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-95'}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition ${
        checked ? 'translate-x-[1.35rem]' : 'translate-x-1'
      }`}
    />
    <span className="sr-only">{checked ? 'Whitelisted' : 'Not whitelisted'}</span>
  </button>
)

export default ManageUsersWhitelistToggle
