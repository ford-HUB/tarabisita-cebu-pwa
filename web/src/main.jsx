import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MainRoutes } from './routes/MainRoutes'
import './index.css'

const routes = createBrowserRouter(MainRoutes)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster
      position="bottom-right"
      closeButton
      toastOptions={{
        className: 'border border-[#ecdcc9] bg-[#fffaf4] text-[#2f2a24] shadow-lg',
        descriptionClassName: 'text-[#6c655d]',
      }}
    />
    <RouterProvider router={routes} />
  </StrictMode>
)
