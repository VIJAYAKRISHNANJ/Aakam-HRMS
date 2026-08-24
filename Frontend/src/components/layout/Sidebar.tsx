import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Workforce",
    icon: Users,
    path: "/workforce",
  },
  {
    label: "Recruitment",
    icon: BriefcaseBusiness,
    path: "/recruitment",
  },
  {
    label: "Clients",
    icon: Building2,
    path: "/clients",
  },
  {
    label: "Onboarding",
    icon: UserPlus,
    path: "/onboarding",
  },
  {
    label: "Payroll",
    icon: WalletCards,
    path: "/payroll",
  },
  {
    label: "Performance",
    icon: Sparkles,
    path: "/performance",
  },
  {
    label: "Training",
    icon: GraduationCap,
    path: "/training",
  },
  {
    label: "Reports",
    icon: BarChart3,
    path: "/reports",
  },
  {
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
  {
    label: "Exit",
    icon: LogOut,
    path: "/exit",
  },
];

function Sidebar({
  open,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* =====================================================
          FIXED SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-[260px]
          flex-col
          overflow-hidden
          bg-[#08152f]
          text-white
          transition-transform
          duration-300
          ease-in-out
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
          lg:translate-x-0
        `}
      >
        {/* ===================================================
            BRAND
        =================================================== */}

        <div className="flex h-[86px] shrink-0 items-center px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 shadow-lg shadow-blue-950/30">
              <span className="text-xl font-black text-white">
                A
              </span>
            </div>

            <div>
              <p className="text-[17px] font-bold tracking-tight text-white">
                Aakam HRMS
              </p>

              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Human Resource Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* ===================================================
            NAVIGATION

            Equal item height + equal spacing
            No sidebar scrollbar
        =================================================== */}

        <nav className="min-h-0 flex-1 overflow-hidden px-3 pt-1">
          <div className="flex flex-col gap-[8px]">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  group
                  flex
                  h-[44px]
                  min-h-[44px]
                  w-full
                  shrink-0
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  text-[14px]
                  font-medium
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? `
                        bg-gradient-to-r
                        from-blue-600/80
                        to-violet-600/70
                        text-white
                        shadow-lg
                        shadow-blue-950/30
                        ring-1
                        ring-blue-400/20
                      `
                      : `
                        text-slate-300
                        hover:bg-white/[0.06]
                        hover:text-white
                      `
                  }
                `}
              >
                {({ isActive }) => {
                  const Icon =
                    item.icon;

                  return (
                    <>
                      <span
                        className={`
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          ${
                            isActive
                              ? "bg-white/10 text-blue-200"
                              : "text-slate-400 group-hover:text-blue-300"
                          }
                        `}
                      >
                        <Icon
                          size={19}
                          strokeWidth={
                            isActive
                              ? 2.2
                              : 1.9
                          }
                        />
                      </span>

                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight
                          size={15}
                          className="shrink-0 text-blue-200"
                        />
                      )}
                    </>
                  );
                }}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;