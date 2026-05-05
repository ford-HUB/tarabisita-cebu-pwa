import { FiCamera } from 'react-icons/fi'

const InterfaceHeaderSection = ({
  businessLabel,
  categoryLabel,
  bannerUrl,
  isEditingHeader,
  bannerFileData,
  handleBannerChange,
  logoUrl,
  handleLogoChange,
  businessNameInput,
  businessNameFallback,
  setBusinessNameInput,
  businessDescriptionInput,
  setBusinessDescriptionInput,
  handleHeaderAction,
  hasHeaderChanges,
  isSavingHeader
}) => {
  return (
    <section
      className="overflow-visible rounded-2xl shadow-sm"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e7ddd2'
      }}
    >
      <div
        className="relative h-56 w-full overflow-hidden rounded-t-2xl"
        style={{
          background: bannerUrl
            ? `linear-gradient(0deg, rgba(255,255,255,0.18), rgba(255,255,255,0.18)), url(${bannerUrl}) center/cover no-repeat`
            : 'linear-gradient(90deg, #efe7dc, #f8f3ec, #fff7ed)'
        }}
      >
        {isEditingHeader && (
          <label className="absolute right-4 bottom-4 cursor-pointer rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-[#2f2f2f] shadow-sm transition hover:bg-white">
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            {bannerFileData ? 'Banner selected' : 'Edit cover photo'}
          </label>
        )}
      </div>

      <div className="px-6 pt-4 pb-8">
        <div className="relative z-10 -mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[#f5eee4] text-2xl font-semibold text-[#9b5a2c] shadow-sm">
                {logoUrl ? (
                  <img src={logoUrl} alt="Business logo" className="h-full w-full rounded-full object-cover" />
                ) : (
                  (businessNameInput || businessNameFallback || categoryLabel).slice(0, 1).toUpperCase()
                )}
              </div>
              {isEditingHeader && (
                <label
                  className="absolute -right-1 -bottom-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#e7dfd5] bg-white text-[#7d7164] shadow-sm transition hover:bg-[#f5eee4]"
                  title={logoUrl ? 'Update logo' : 'Add logo'}
                >
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <FiCamera size={14} />
                </label>
              )}
            </div>

            <div>
              {isEditingHeader ? (
                <>
                  <input
                    type="text"
                    value={businessNameInput}
                    onChange={(event) => setBusinessNameInput(event.target.value)}
                    className="w-full max-w-md rounded-lg border border-[#e7dfd5] bg-white px-3 py-1.5 text-2xl font-semibold text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
                  />
                  <textarea
                    value={businessDescriptionInput}
                    onChange={(event) => setBusinessDescriptionInput(event.target.value)}
                    rows={2}
                    className="mt-2 w-full max-w-md rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#5f5f5f] outline-none transition focus:border-[#ff7a1a]"
                  />
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-semibold text-[#1f1f1f]">{businessNameInput || 'Business Owner'}</h2>
                  <p className="text-sm text-[#5f5f5f]">{businessDescriptionInput || businessLabel}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleHeaderAction}
              disabled={isSavingHeader}
              className="rounded-full border bg-white px-3.5 py-2 text-xs font-medium text-[#2f2f2f] transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: '#d7cbbb' }}
            >
              {!isEditingHeader ? 'Edit' : hasHeaderChanges ? (isSavingHeader ? 'Saving...' : 'Save') : 'Cancel Edit'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InterfaceHeaderSection
