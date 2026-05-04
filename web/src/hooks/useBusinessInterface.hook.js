import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import { useBusinessInterfaceStore } from '../store/business/businessInterface.store'

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!dataUrl.startsWith('data:image/')) {
        reject(new Error('INVALID_IMAGE'))
        return
      }
      resolve(dataUrl)
    }
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'))
    reader.readAsDataURL(file)
  })

export const useBusinessInterface = ({ user, categoryLabel }) => {
  const emptyCards = Array.from({ length: 6 })
  const [themeColor, setThemeColor] = useState('#ff7a1a')
  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [businessNameInput, setBusinessNameInput] = useState('')
  const [businessDescriptionInput, setBusinessDescriptionInput] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFileData, setLogoFileData] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerFileData, setBannerFileData] = useState('')
  const [savedCardLayout, setSavedCardLayout] = useState('grid')
  const [cardLayoutDraft, setCardLayoutDraft] = useState('grid')
  const [isEditingLayout, setIsEditingLayout] = useState(false)
  const [showCardDetails, setShowCardDetails] = useState(true)

  const { businessProfile, isSavingThemeColor, isSavingHeader } = useBusinessInterfaceStore(
    useShallow((s) => ({
      businessProfile: s.businessProfile,
      isSavingThemeColor: s.isSavingThemeColor,
      isSavingHeader: s.isSavingHeader
    }))
  )

  useEffect(() => {
    const run = async () => {
      const { profile } = await useBusinessInterfaceStore.getState().loadInterfaceProfile()
      if (profile?.themeColor) setThemeColor(profile.themeColor)
      setBusinessNameInput(profile?.name || '')
      setBusinessDescriptionInput(
        profile?.description || `${categoryLabel} profile and branding setup`
      )
      setLogoUrl(profile?.logo || '')
      setBannerUrl(profile?.banner || profile?.coverImage || '')
    }
    void run()
  }, [categoryLabel])

  const hasTextHeaderChanges =
    businessNameInput.trim() !== (businessProfile?.name || '').trim() ||
    businessDescriptionInput.trim() !==
      (businessProfile?.description || `${categoryLabel} profile and branding setup`).trim()

  const hasHeaderChanges = hasTextHeaderChanges || Boolean(logoFileData) || Boolean(bannerFileData)

  const handleSaveThemeColor = async () => {
    await useBusinessInterfaceStore.getState().saveThemeColor(themeColor)
  }

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await toDataUrl(file)
      setLogoFileData(dataUrl)
      setLogoUrl(dataUrl)
    } catch (_error) {
      toast.error('Please select a valid image file.')
    } finally {
      event.target.value = ''
    }
  }

  const handleBannerChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await toDataUrl(file)
      setBannerFileData(dataUrl)
      setBannerUrl(dataUrl)
    } catch (_error) {
      toast.error('Please select a valid image file.')
    } finally {
      event.target.value = ''
    }
  }

  const resetHeaderDraft = () => {
    setBusinessNameInput(businessProfile?.name || '')
    setBusinessDescriptionInput(
      businessProfile?.description || `${categoryLabel} profile and branding setup`
    )
    setLogoUrl(businessProfile?.logo || '')
    setLogoFileData('')
    setBannerUrl(businessProfile?.banner || businessProfile?.coverImage || '')
    setBannerFileData('')
  }

  const handleHeaderAction = async () => {
    if (!isEditingHeader) {
      setIsEditingHeader(true)
      return
    }

    if (!hasHeaderChanges) {
      resetHeaderDraft()
      setIsEditingHeader(false)
      return
    }

    const result = await useBusinessInterfaceStore.getState().saveHeaderBundle({
      hasTextHeaderChanges,
      businessNameInput,
      businessDescriptionInput,
      logoFileData,
      bannerFileData,
      businessProfile,
      user,
      categoryLabel
    })

    if (result?.ok && result.profile) {
      setBusinessNameInput(result.profile?.name || businessNameInput)
      setBusinessDescriptionInput(result.profile?.description || businessDescriptionInput)
      setLogoUrl(result.profile?.logo || logoUrl)
      setBannerUrl(result.profile?.banner || result.profile?.coverImage || bannerUrl)
      setLogoFileData('')
      setBannerFileData('')
      setIsEditingHeader(false)
    }
  }

  const activeCardLayout = isEditingLayout ? cardLayoutDraft : savedCardLayout
  const hasPendingLayoutChange = cardLayoutDraft !== savedCardLayout
  const isSingleScrollable = activeCardLayout === 'single-scroll'
  const isDoubleCarousel = activeCardLayout === 'double-carousel'

  const cardListClassName = isSingleScrollable
    ? 'flex max-h-[26rem] flex-col gap-4 overflow-y-auto pr-1 scroll-smooth touch-pan-y'
    : isDoubleCarousel
      ? 'flex gap-4 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory scroll-smooth touch-pan-x'
      : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'

  const getCardClassName = (index) =>
    isSingleScrollable
      ? 'aspect-square w-full max-w-[22rem] self-center rounded-xl border border-dashed border-[#d8cec3] bg-[#fffdf9] p-4'
      : isDoubleCarousel
        ? `min-w-[calc(50%_-_8px)] max-w-[calc(50%_-_8px)] ${
            index % 2 === 0 ? 'snap-start' : ''
          } flex-shrink-0 rounded-xl border border-dashed border-[#d8cec3] bg-[#fffdf9] p-4`
        : 'rounded-xl border border-dashed border-[#d8cec3] bg-[#fffdf9] p-4'

  const handleStartLayoutEdit = () => {
    setCardLayoutDraft(savedCardLayout)
    setIsEditingLayout(true)
  }

  const handleSaveLayout = () => {
    setSavedCardLayout(cardLayoutDraft)
    setIsEditingLayout(false)
    toast.success('Card layout updated.')
  }

  const handleCancelLayoutEdit = () => {
    setCardLayoutDraft(savedCardLayout)
    setIsEditingLayout(false)
  }

  return {
    emptyCards,
    themeColor,
    setThemeColor,
    isSavingThemeColor,
    isEditingHeader,
    isSavingHeader,
    businessProfile,
    businessNameInput,
    setBusinessNameInput,
    businessDescriptionInput,
    setBusinessDescriptionInput,
    logoUrl,
    bannerUrl,
    bannerFileData,
    savedCardLayout,
    cardLayoutDraft,
    setCardLayoutDraft,
    isEditingLayout,
    showCardDetails,
    setShowCardDetails,
    hasHeaderChanges,
    activeCardLayout,
    hasPendingLayoutChange,
    cardListClassName,
    handleSaveThemeColor,
    handleLogoChange,
    handleBannerChange,
    handleHeaderAction,
    getCardClassName,
    handleStartLayoutEdit,
    handleSaveLayout,
    handleCancelLayoutEdit
  }
}
