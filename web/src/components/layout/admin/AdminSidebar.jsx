import { NavLink } from 'react-router-dom'
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiMenu } from 'react-icons/fi'

const AdminSidebar = ({
  isSidebarCollapsed,
  onToggleSidebar,
  expandedMenus,
  onToggleMenu,
  sidebarLinks
}) => {
  return (
    <aside
      className={`flex h-dvh shrink-0 flex-col overflow-hidden border-r border-[#ece3d9] bg-white transition-all ${
        isSidebarCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-[#ece3d9] px-4">
        {!isSidebarCollapsed && (
          <p className="text-base font-semibold tracking-wide text-[#9b5a2c]">TaraBisita Admin</p>
        )}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg border border-[#ece3d9] p-2 text-[#6d645d] transition hover:bg-[#f5eee4]"
        >
          {isSidebarCollapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>
      </div>

      <div className="px-4 pt-4">
        {!isSidebarCollapsed && <p className="text-xs tracking-[0.18em] text-[#a79a8b]">MENU</p>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <nav className="space-y-1.5 p-3 pb-4">
          {sidebarLinks.map((menu, index) => (
            <div key={menu.type === 'section' ? `section-${menu.label}-${index}` : `${menu.label}-${index}`}>
              {menu.type === 'section' ? (
                !isSidebarCollapsed ? (
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b0a396]">
                    {menu.label}
                  </p>
                ) : null
              ) : menu.path ? (
                <NavLink
                  to={menu.path}
                  end={typeof menu.path === 'string' && menu.path.startsWith('/admin/dashboard')}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      isActive
                        ? 'bg-[#f2e8da] text-[#9b5a2c]'
                        : 'text-[#2f2f2f] hover:bg-[#f7f3ed]'
                    }`
                  }
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg">
                    <menu.icon size={18} />
                  </span>
                  {!isSidebarCollapsed && <span className="flex-1 text-left">{menu.label}</span>}
                </NavLink>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => menu.children && onToggleMenu(menu.label)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#2f2f2f] transition hover:bg-[#f7f3ed]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg">
                      <menu.icon size={18} />
                    </span>
                    {!isSidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{menu.label}</span>
                        {menu.children && (
                          <span>
                            {expandedMenus[menu.label] ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                          </span>
                        )}
                      </>
                    )}
                  </button>

                  {!isSidebarCollapsed && menu.children && expandedMenus[menu.label] && (
                    <div className="mt-1 space-y-1 pl-12">
                      {menu.children.map((subItem) => (
                        <NavLink
                          key={subItem.label}
                          to={subItem.path}
                          end
                          className={({ isActive }) =>
                            `block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                              isActive
                                ? 'bg-[#f2e8da] text-[#9b5a2c]'
                                : 'text-[#5f5f5f] hover:bg-[#f7f3ed]'
                            }`
                          }
                        >
                          {subItem.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>
      </div>

      {isSidebarCollapsed && (
        <div className="mt-2 flex justify-center pb-3">
          <span className="rounded-lg bg-[#f7f3ed] p-2 text-[#7d736a]">
            <FiMenu size={16} />
          </span>
        </div>
      )}
    </aside>
  )
}

export default AdminSidebar
