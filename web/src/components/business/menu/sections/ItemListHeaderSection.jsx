import { FiArchive, FiPlus, FiX } from 'react-icons/fi'

const ItemListHeaderSection = ({
  categoryLabel,
  addLabel,
  isAccommodationBusiness = false,
  isAddingMenu,
  setIsAddingMenu,
  deletedCount,
  setIsDeletedModalOpen
}) => {
  return (
    <section className="rounded-2xl border border-[#ece3d9] bg-[#fffcf8] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">
            {categoryLabel === 'Restaurant'
              ? 'Restaurant Menu'
              : isAccommodationBusiness
                ? `${categoryLabel} Management`
                : 'Business Catalog'}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#2f2f2f]">{addLabel}</h2>
          <p className="mt-1 text-sm text-[#6f665d]">
            {isAccommodationBusiness
              ? 'Post room details, accommodation information, and availability with multiple photos.'
              : 'Add complete dish details and upload multiple photos to make your listing more attractive.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDeletedModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#efdcd0] bg-white px-3 py-2 text-xs font-medium text-[#7d5b3b] transition hover:bg-[#fff7ef]"
          >
            <FiArchive size={14} />
            {isAccommodationBusiness ? `Archived Listings (${deletedCount})` : `Deleted Menus (${deletedCount})`}
          </button>
          <button
            type="button"
            onClick={() => setIsAddingMenu((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ee6d0f]"
          >
            {isAddingMenu ? <FiX size={16} /> : <FiPlus size={16} />}
            {isAddingMenu ? 'Close Form' : addLabel}
          </button>
        </div>
      </div>
    </section>
  )
}

export default ItemListHeaderSection
