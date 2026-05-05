import { useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import { useBusinessInterfaceStore } from '../store/business/businessInterface.store'
import { useBusinessMenuItemsStore } from '../store/business/menuItems.store'

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
  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [businessNameInput, setBusinessNameInput] = useState('')
  const [businessDescriptionInput, setBusinessDescriptionInput] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFileData, setLogoFileData] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerFileData, setBannerFileData] = useState('')
  const [showCardDetails, setShowCardDetails] = useState(true)

  const { businessProfile, isSavingHeader } = useBusinessInterfaceStore(
    useShallow((s) => ({
      businessProfile: s.businessProfile,
      isSavingHeader: s.isSavingHeader
    }))
  )
  const { menuItems, isLoadingMenuItems } = useBusinessMenuItemsStore(
    useShallow((s) => ({
      menuItems: s.menuItems,
      isLoadingMenuItems: s.isLoadingMenuItems
    }))
  )

  useEffect(() => {
    const run = async () => {
      const { profile } = await useBusinessInterfaceStore.getState().loadInterfaceProfile()
      setBusinessNameInput(profile?.name || '')
      setBusinessDescriptionInput(
        profile?.description || `${categoryLabel} profile and branding setup`
      )
      setLogoUrl(profile?.logo || '')
      setBannerUrl(profile?.banner || profile?.coverImage || '')
    }
    void run()
  }, [categoryLabel])

  useEffect(() => {
    if (!user?._id) {
      useBusinessMenuItemsStore.getState().clearMenuLists()
      return
    }
    void useBusinessMenuItemsStore.getState().fetchMenuItems()
  }, [user?._id])

  const menuCategories = useMemo(() => {
    const categoriesMap = new Map()
    menuItems.forEach((item) => {
      const normalized = String(item?.category || 'All').trim() || 'All'
      const key = normalized.toLowerCase()
      const count = categoriesMap.get(key)?.count || 0
      categoriesMap.set(key, { label: normalized, count: count + 1 })
    })
    return Array.from(categoriesMap.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [menuItems])

  const hasTextHeaderChanges =
    businessNameInput.trim() !== (businessProfile?.name || '').trim() ||
    businessDescriptionInput.trim() !==
      (businessProfile?.description || `${categoryLabel} profile and branding setup`).trim()

  const hasHeaderChanges = hasTextHeaderChanges || Boolean(logoFileData) || Boolean(bannerFileData)

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

  const cardListClassName = 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
  const getCardClassName = () =>
    'rounded-xl border border-dashed border-[#d8cec3] bg-[#fffdf9] p-4'

  return {
    emptyCards,
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
    showCardDetails,
    setShowCardDetails,
    hasHeaderChanges,
    cardListClassName,
    handleLogoChange,
    handleBannerChange,
    handleHeaderAction,
    getCardClassName,
    menuItems,
    isLoadingMenuItems,
    menuCategories
  }
}
