import BusinessLayout from "../../components/layout/business/BusinessLayout";
import Billing from "../../pages/dashboard/business/Billing";
import Chat from "../../pages/dashboard/business/Chat";
import Home from "../../pages/dashboard/business/Home";
import Interface from "../../pages/dashboard/business/Interface";
import Menu from "../../pages/dashboard/business/Menu";
import Notifications from "../../pages/dashboard/business/Notifications";
import Orders from "../../pages/dashboard/business/Orders";
import Profile from "../../pages/dashboard/business/Profile";
import TodaysRecord from "../../pages/dashboard/business/TodaysRecord";
import Records from "../../pages/dashboard/business/Records";
import { ProtectedRoute } from "../ProtectedRoute";


export const BusinessRoutes = [
    {
        path: '/business/dashboard',
        element: (
            <ProtectedRoute allowedRoles={['BUSINESS']}>
                <BusinessLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: 'profile',
                element: <Profile />
            },
            {
                path: 'interface',
                element: <Interface />
            },
            {
                path: 'menu',
                element: <Menu />
            },
            {
                path: 'orders',
                element: <Orders />
            },
            {
                path: 'notifications',
                element: <Notifications />
            },
            {
                path: 'todays-record',
                element: <TodaysRecord />
            },
            {
                path: 'chat',
                element: <Chat />
            },
            {
                path: 'billing',
                element: <Billing />
            },
            {
                path: 'records',
                element: <Records />
            }
        ]
    }
]