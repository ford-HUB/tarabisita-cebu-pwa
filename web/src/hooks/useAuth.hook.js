import { useEffect } from 'react'
import { useAuthStore } from '../store/auth/auth.store'
export const useAuth = () => {
    const checkUser = useAuthStore((state) => state.checkUser)
    const setUser = useAuthStore((state) => state.setUser)
    const user = useAuthStore((state) => state.user)
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth)
    const hasCheckedAuth = useAuthStore((state) => state.hasCheckedAuth)

    useEffect(() => {
        if (!hasCheckedAuth && !isCheckingAuth) {
            checkUser()
        }
    }, [hasCheckedAuth, isCheckingAuth])

    return {
        user,
        isAuthenticated,
        isAuthLoading: !hasCheckedAuth || isCheckingAuth,
        setUser
    }
}