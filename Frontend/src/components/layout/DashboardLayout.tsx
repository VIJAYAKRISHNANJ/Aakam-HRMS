import { useState } from 'react'

import Header from './Header'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-transparent text-slate-900">

      {/* =====================================================
          FIXED SIDEBAR
      ===================================================== */}

      <Sidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      {/* =====================================================
          RIGHT SIDE SCROLLING PAGE

          Header + Dashboard content scroll together
      ===================================================== */}

      <div
        className="
          min-h-screen
          min-w-0
          lg:ml-[260px]
        "
      >

        {/* ===================================================
            HEADER

            This is NOT fixed.
            It scrolls together with the dashboard.
        =================================================== */}

        <div
          className="
            px-3
            pt-6
            sm:px-4
            lg:px-6
          "
        >

          <Header
            onOpenSidebar={() =>
              setSidebarOpen(true)
            }
          />

        </div>

        {/* ===================================================
            DASHBOARD CONTENT
        =================================================== */}

        <main
          className="
            min-w-0
            overflow-x-hidden
            px-3
            pb-8
            pt-5
            sm:px-4
            lg:px-6
          "
        >

          <div className="mx-auto w-full min-w-0 max-w-[1600px]">

            {children}

          </div>

        </main>

      </div>

    </div>
  )
}

export default DashboardLayout