import { useState } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  return (
    <div
      className="
        h-screen
        w-full
        overflow-hidden
        bg-transparent
        text-slate-900
      "
    >
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
          RIGHT SIDE SCROLLING AREA

          IMPORTANT:
          Only this area scrolls.

          Sidebar remains fixed/static.
      ===================================================== */}

      <div
        className="
          h-screen
          min-w-0
          overflow-y-auto
          overflow-x-hidden
          lg:ml-[260px]
        "
      >
        {/* ===================================================
            HEADER
        =================================================== */}

        <div
          className="
            px-4
            pt-6
            sm:px-5
            lg:px-6
            xl:px-8
          "
        >
          <Header
            onOpenSidebar={() =>
              setSidebarOpen(true)
            }
          />
        </div>

        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <main
          className="
            min-w-0
            px-4
            pb-8
            pt-6
            sm:px-5
            lg:px-6
            xl:px-8
          "
        >
          <div
            className="
              mx-auto
              w-full
              min-w-0
              max-w-[1600px]
            "
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;