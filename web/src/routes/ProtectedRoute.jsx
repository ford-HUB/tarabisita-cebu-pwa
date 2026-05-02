import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/useAuth.hook"
import { isSignedRouteValid, roleBasedRoute } from "../shared/utils/direct.utils"

export const ProtectedRoute = ({ children, allowedRoles, requireSignature = true }) => {
    const { user, isAuthenticated, isAuthLoading } = useAuth()
    const location = useLocation()

    if (isAuthLoading) {
        return null
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const userRole = typeof user?.role === "string" ? user.role.toUpperCase() : ""
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to={`/${roleBasedRoute(user?.role)}`} replace />
        }
    }

    if (requireSignature) {
        const routeKey = new URLSearchParams(location.search).get("rk")
        const isValidSignedRoute = isSignedRouteValid(location.pathname, routeKey)

        if (!isValidSignedRoute) {
            return <Navigate to={`/${roleBasedRoute(user?.role)}`} replace />
        }
    }

    return children
}