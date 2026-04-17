import BusinessLayout from "../../components/layout/business/BusinessLayout";
import Home from "../../pages/dashboard/business/Home";


export const BusinessRoutes = [
    {
        path: '/dashboard',
        element: <BusinessLayout />,
        children: [
            {
                index: true,
                element: <Home />
            }
        ]
    }
]