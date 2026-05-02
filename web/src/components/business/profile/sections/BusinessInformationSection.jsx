import { InfoTile } from '../ui'

const BusinessInformationSection = ({
  isEditing,
  register,
  errors,
  profile,
  hasProfileChanges,
  isSaving,
  isBusinessVerified,
  onSubmitProfile,
  onStartEdit,
  onCancelEdit,
  onOpenChangePasswordFlow,
  onOpenSecurityModal,
  onOpenProofModal
}) => {
  return (
    <form
      onSubmit={onSubmitProfile}
      className="rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1f1f1f]">Business Information</h3>
      <p className="mt-2 text-sm text-[#5b5b5b]">
        This panel follows your existing color theme while refining spacing and card hierarchy for better readability.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {isEditing ? (
          <>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">Owner Name</span>
              <input
                {...register('ownerName')}
                className="w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
              />
              {errors.ownerName && <p className="text-xs text-[#b42318]">{errors.ownerName.message}</p>}
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">Business Name</span>
              <input
                {...register('businessName')}
                className="w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
              />
              {errors.businessName && <p className="text-xs text-[#b42318]">{errors.businessName.message}</p>}
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">Address</span>
              <input
                {...register('address')}
                minLength={5}
                className="w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
              />
              {errors.address && <p className="text-xs text-[#b42318]">{errors.address.message}</p>}
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">Phone</span>
              <input
                {...register('phone')}
                className="w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
              />
              {errors.phone && <p className="text-xs text-[#b42318]">{errors.phone.message}</p>}
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">Website</span>
              <input
                {...register('website')}
                placeholder="https://your-business-site.com"
                className="w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
              />
              {errors.website && <p className="text-xs text-[#b42318]">{errors.website.message}</p>}
            </label>
          </>
        ) : (
          <>
            <InfoTile label="Address" value={profile.address} tone="outlined" expandable maxLength={90} />
            <InfoTile label="Account Role" value={profile.role} tone="outlined" />
          </>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[#efe6dc] bg-[#fffdf9] p-4">
        <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">About</p>
        {isEditing ? (
          <textarea
            {...register('about')}
            rows={4}
            minLength={10}
            className="mt-2 w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
          />
        ) : (
          <p className="mt-2 text-sm text-[#4f4f4f]">{profile.about}</p>
        )}
        {isEditing && errors.about && <p className="mt-2 text-xs text-[#b42318]">{errors.about.message}</p>}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {isEditing ? (
          <button
            type="submit"
            disabled={isSaving || !hasProfileChanges}
            className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12]"
          >
            Edit Profile
          </button>
        )}
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-full border border-[#e7dfd5] bg-white px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel Edit
          </button>
        )}
        <button
          type="button"
          onClick={onOpenChangePasswordFlow}
          className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4]"
        >
          Change Password
        </button>
        <button
          type="button"
          onClick={onOpenSecurityModal}
          className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4]"
        >
          Security & Activity
        </button>
        {!isBusinessVerified && (
          <button
            type="button"
            onClick={onOpenProofModal}
            className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4]"
          >
            Upload Business Proof
          </button>
        )}
      </div>
    </form>
  )
}

export default BusinessInformationSection
