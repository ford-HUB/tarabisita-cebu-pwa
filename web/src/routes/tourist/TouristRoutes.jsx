import TouristLayout from "../../components/layout/tourist/TouristLayout";
import Home from "../../pages/dashboard/tourist/Home";

export const TouristRoutes = [
    {
        path: '/explore',
        element: <TouristLayout />,
        children: [
            {
                index: true,
                element: <Home/>
            }
        ]

    }
]