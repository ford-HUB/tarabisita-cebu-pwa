import { Navigate } from 'react-router-dom'
import { BusinessRoutes } from "./business/BusinessRoutes"
import { AuthRoutes } from "./public/AuthRoutes"
import { AdminRoutes } from './admin/AdminRoutes'
import { TouristRoutes } from "./tourist/TouristRoutes"

export const MainRoutes = [
    ...AuthRoutes,
    ...TouristRoutes,
    ...BusinessRoutes,
    {
        path: '/admin/login',
        element: <Navigate to="/login" replace />,
    },
    ...AdminRoutes
]