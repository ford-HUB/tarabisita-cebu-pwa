import { Navigate } from 'react-router-dom'
import TouristLayout from '../../components/layout/tourist/TouristLayout'
import { touristHomeHref, touristOrdersHref } from '../../components/layout/tourist/touristLayout.constants'
import Home from '../../pages/dashboard/tourist/Home'
import TouristHomeHub from '../../pages/dashboard/tourist/TouristHomeHub'
import History from '../../pages/dashboard/tourist/History'
import Orders from '../../pages/dashboard/tourist/Orders'
import StoreMessages from '../../pages/dashboard/tourist/StoreMessages'
import RestaurantCart from '../../pages/dashboard/tourist/RestaurantCart'
import RestaurantCheckout from '../../pages/dashboard/tourist/RestaurantCheckout'
import BusinessDetail from '../../pages/dashboard/tourist/BusinessDetail'
import StayBooking from '../../pages/dashboard/tourist/StayBooking'
import TouristSearchResults from '../../pages/dashboard/tourist/TouristSearchResults.jsx'
import { ProtectedRoute } from '../ProtectedRoute'

export const TouristRoutes = [
  {
    path: '/tourist',
    element: (
      <ProtectedRoute allowedRoles={['TOURIST']}>
        <TouristLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'home',
        element: <TouristHomeHub />
      },
      {
        path: 'explore/orders',
        element: <Navigate to={touristOrdersHref} replace />
      },
      {
        path: 'explore/checkout',
        element: <RestaurantCheckout />
      },
      {
        path: 'explore/cart',
        element: <RestaurantCart />
      },
      {
        path: 'explore/search',
        element: <TouristSearchResults />
      },
      {
        path: 'explore',
        element: <Home />
      },
      {
        path: 'explore/business/:businessId',
        element: <BusinessDetail />
      },
      {
        path: 'explore/stay-booking',
        element: <StayBooking />
      },
      {
        path: 'orders',
        element: <Orders />
      },
      {
        path: 'history',
        element: <History />
      },
      {
        path: 'messages',
        element: <StoreMessages />
      },
      {
        index: true,
        element: <Navigate to={touristHomeHref} replace />
      }
    ]
  }
]
