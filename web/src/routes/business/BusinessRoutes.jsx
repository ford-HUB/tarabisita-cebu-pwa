import BusinessLayout from "../../components/layout/business/BusinessLayout";
import Billing from "../../pages/dashboard/business/Billing";
import BookingRequests from "../../pages/dashboard/business/BookingRequests";
import BookingsRecord from "../../pages/dashboard/business/BookingsRecord";
import Chat from "../../pages/dashboard/business/Chat";
import DailySales from "../../pages/dashboard/business/DailySales";
import Home from "../../pages/dashboard/business/Home";
import Interface from "../../pages/dashboard/business/Interface";
import Menu from "../../pages/dashboard/business/Menu";
import Notifications from "../../pages/dashboard/business/Notifications";
import Orders from "../../pages/dashboard/business/Orders";
import Profile from "../../pages/dashboard/business/Profile";
import Reservations from "../../pages/dashboard/business/Reservations";
import Settings from "../../pages/dashboard/business/Settings";
import PaymentMethods from "../../pages/dashboard/business/PaymentMethods";
import TodaysRecord from "../../pages/dashboard/business/TodaysRecord";
import Records from "../../pages/dashboard/business/Records";
import TrafficInsights from "../../pages/dashboard/business/TrafficInsights";
import Ratings from "../../pages/dashboard/business/Ratings";
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
                path: 'settings',
                element: <Settings />
            },
            {
                path: 'payment-methods',
                element: <PaymentMethods />
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
                path: 'booking-requests',
                element: <BookingRequests />
            },
            {
                path: 'reservations',
                element: <Reservations />
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
            },
            {
                path: 'bookings-records',
                element: <BookingsRecord />
            },
            {
                path: 'reports/daily-sales',
                element: <DailySales />
            },
            {
                path: 'reports/traffic-insights',
                element: <TrafficInsights />
            },
            {
                path: 'ratings',
                element: <Ratings />
            }
        ]
    }
]