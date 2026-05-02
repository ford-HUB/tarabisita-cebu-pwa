import TouristLayout from "../../components/layout/tourist/TouristLayout";
import Home from "../../pages/dashboard/tourist/Home";
import { ProtectedRoute } from "../ProtectedRoute";

export const TouristRoutes = [
    {
        path: '/tourist/explore',
        element: (
            <ProtectedRoute allowedRoles={['TOURIST']}>
                <TouristLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Home/>
            }
        ]

    }
]