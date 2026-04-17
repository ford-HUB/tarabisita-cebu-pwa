import Login from "../../pages/auth/Login"
import AuthLayout from "../../components/layout/auth/AuthLayout"
import Register from "../../pages/auth/Register"
import VerifyEmail from "../../pages/auth/VerifyEmail"
import ResetPassword from "../../pages/auth/ResetPassword"

export const AuthRoutes = [
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Register />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
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