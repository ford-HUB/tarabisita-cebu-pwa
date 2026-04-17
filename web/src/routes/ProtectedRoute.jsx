import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth.hook"

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return children
}