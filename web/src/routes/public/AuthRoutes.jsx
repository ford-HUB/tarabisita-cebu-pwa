import Login from "../../pages/auth/Login"
import AuthLayout from "../../components/layout/auth/AuthLayout"
import Register from "../../pages/auth/Register"
import VerifyEmail from "../../pages/auth/VerifyEmail"
import ResetPassword from "../../pages/auth/ResetPassword"
import Landing from "../../pages/public/Landing"
import PublicSearchResults from "../../pages/public/PublicSearchResults"
import PublicCart from "../../pages/public/PublicCart"
import PublicBusinessDetail from "../../pages/public/PublicBusinessDetail"
import BookingPayment from "../../pages/dashboard/tourist/BookingPayment"

export const AuthRoutes = [
  {
    path: '/tourist/booking-payment',
    element: <BookingPayment />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: 'home',
        element: <Landing />,
      },
      {
        path: 'search',
        element: <PublicSearchResults />,
      },
      {
        path: 'cart',
        element: <PublicCart />,
      },
      {
        path: 'business/:businessId',
        element: <PublicBusinessDetail />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'verify-email',
        element: <VerifyEmail />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
    ],
  },
]