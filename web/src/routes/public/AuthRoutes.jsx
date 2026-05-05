import Login from "../../pages/auth/Login"
import AuthLayout from "../../components/layout/auth/AuthLayout"
import Register from "../../pages/auth/Register"
import VerifyEmail from "../../pages/auth/VerifyEmail"
import ResetPassword from "../../pages/auth/ResetPassword"
import Landing from "../../pages/public/Landing"

export const AuthRoutes = [
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
        path: 'register',
        element: <Register />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'admin/login',
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