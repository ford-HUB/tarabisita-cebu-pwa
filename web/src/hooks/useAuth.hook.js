import { useEffect } from "react";
import { useAuthStore } from "../stores/auth/auth.store";

export const useAuth = () => {
    const checkUser = useAuthStore((state) => state.checkUser)
    const user = useAuthStore((state) => state.user)
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    useEffect(() => {
        if (!user && !isAuthenticated) {
            checkUser()
        }
    }, [user, isAuthenticated])

    return {
        user,
        isAuthenticated
    }
}