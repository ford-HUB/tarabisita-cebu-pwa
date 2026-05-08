import AdminLayout from '../../components/layout/admin/AdminLayout'
import Home from '../../pages/dashboard/admin/Home'
import Business from '../../pages/dashboard/admin/Business'
import RequestApproval from '../../pages/dashboard/admin/RequestApproval'
import Report from '../../pages/dashboard/admin/Report'
import Subscription from '../../pages/dashboard/admin/Subscription'
import Transactions from '../../pages/dashboard/admin/Transactions'
import ManageUsers from '../../pages/dashboard/admin/ManageUsers'
import SystemPerformance from '../../pages/dashboard/admin/SystemPerformance'
import { ProtectedRoute } from '../ProtectedRoute'

export const AdminRoutes = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Home />
      },
      {
        path: 'business',
        element: <Business />
      },
      {
        path: 'business/request-approval',
        element: <RequestApproval />
      },
      {
        path: 'users',
        element: <ManageUsers />
      },
      {
        path: 'report',
        element: <Report />
      },
      {
        path: 'subscription',
        element: <Subscription />
      },
      {
        path: 'transactions',
        element: <Transactions />
      },
      {
        path: 'system-performance',
        element: <SystemPerformance />
      }
    ]
  }
]
