import { Outlet } from 'react-router-dom'


const BusinessLayout = () => {
  return (
    <div className="bg-[#f8f5f0] text-[#1f1f1f]">
        {/* Header ang dapat diri */}
      <main>
        <Outlet />
      </main>
        {/* Footer diri sa ubos */}
    </div>
  )
}

export default BusinessLayout
