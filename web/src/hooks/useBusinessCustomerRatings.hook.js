import { useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCustomerRatingsStore } from '../store/business/customerRatings.store.js'

export const useBusinessCustomerRatings = () => {
  const { data, sentiment, page, isLoading, errorMessage, setSentiment, setPage, loadRatings } =
    useCustomerRatingsStore(
      useShallow((state) => ({
        data: state.data,
        sentiment: state.sentiment,
        page: state.page,
        isLoading: state.isLoading,
        errorMessage: state.errorMessage,
        setSentiment: state.setSentiment,
        setPage: state.setPage,
        loadRatings: state.loadRatings
      }))
    )

  useEffect(() => {
    void loadRatings({ page, sentiment })
  }, [loadRatings, page, sentiment])

  const refreshRatings = useCallback(() => {
    void loadRatings({ page, sentiment })
  }, [loadRatings, page, sentiment])

  return {
    data,
    summary: data?.summary || null,
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination || null,
    supported: data?.supported !== false,
    sentiment,
    page,
    setSentiment,
    setPage,
    isLoading,
    errorMessage,
    refreshRatings
  }
}
