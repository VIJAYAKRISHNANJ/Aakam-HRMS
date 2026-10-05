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

import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  matchPaths?: string[];
  permission: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    permission: "dashboard.view",
  },

  {
    label: "Workforce",
    icon: Users,
    path: "/workforce",
    permission: "workforce.view",
  },

  {
    label: "Organization",
    icon: Building2,
    path: "/organization/company",
    matchPaths: [
      "/organization/company",
      "/organization/branches",
      "/organization/departments",
    ],
    permission: "organization.view",
  },

  {
    label: "Recruitment",
    icon: BriefcaseBusiness,
    path: "/recruitment",
    permission: "recruitment.view",
  },

  {
    label: "Clients",
    icon: Building2,
    path: "/clients",
    permission: "clients.view",
  },

  {
    label: "Onboarding",
    icon: UserPlus,
    path: "/onboarding",
    permission: "onboarding.view",
  },

  {
    label: "Payroll",
    icon: WalletCards,
    path: "/payroll",
    permission: "payroll.view",
  },

  {
    label: "Performance",
    icon: Sparkles,
    path: "/performance",
    permission: "performance.view",
  },

  {
    label: "Training",
    icon: GraduationCap,
    path: "/training",
    permission: "training.view",
  },

  {
    label: "Reports",
    icon: BarChart3,
    path: "/reports",
    permission: "reports.view",
  },

  {
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
    permission: "notifications.view",
  },

  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
    permission: "settings.view",
  },

  {
    label: "Exit",
    icon: LogOut,
    path: "/exits",
    permission: "offboarding.view",
  },
];

function normalizePermission(
  permission: string,
): string {
  return permission
    .trim()
    .toLowerCase();
}

function Sidebar({
  open,
  onClose,
}: SidebarProps) {
  const {
    hasPermission,
    permissions,
  } = useAuth();

  const normalizedPermissions =
    permissions.map(
      normalizePermission,
    );

  const canView = (
    permission: string,
  ): boolean => {
    return normalizedPermissions.includes(
      normalizePermission(permission),
    );
  };

  /* ============================================================
     ORGANIZATION PERMISSIONS
  ============================================================ */

  const canViewCompany =
    canView("companies.view");

  const canViewBranches =
    canView("branches.view");

  const canViewDepartments =
    canView("departments.view");

  const canViewOrganization =
    canViewCompany ||
    canViewBranches ||
    canViewDepartments;

  const getOrganizationPath =
    (): string => {
      if (canViewCompany) {
        return "/organization/company";
      }

      if (canViewBranches) {
        return "/organization/branches";
      }

      if (canViewDepartments) {
        return "/organization/departments";
      }

      return "/organization/company";
    };

  const getOrganizationMatchPaths =
    (): string[] => {
      const paths: string[] = [];

      if (canViewCompany) {
        paths.push(
          "/organization/company",
        );
      }

      if (canViewBranches) {
        paths.push(
          "/organization/branches",
        );
      }

      if (canViewDepartments) {
        paths.push(
          "/organization/departments",
        );
      }

      return paths;
    };

  /* ============================================================
     FILTER NAVIGATION BY RBAC
  ============================================================ */

  const visibleNavItems =
    navItems
      .filter((item) => {
        if (
          item.label ===
          "Organization"
        ) {
          return canViewOrganization;
        }

        return canView(
          item.permission,
        );
      })
      .map((item) => {
        if (
          item.label !==
          "Organization"
        ) {
          return item;
        }

        return {
          ...item,
          path:
            getOrganizationPath(),
          matchPaths:
            getOrganizationMatchPaths(),
        };
      });

  /*
   * Keep AuthContext's hasPermission in use
   * for compatibility with the central RBAC system.
   */
  void hasPermission;

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
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/50
            lg:hidden
          "
        />
      )}

      {/* =====================================================
          FIXED STATIC SIDEBAR

          The sidebar itself never scrolls.
          Only the right-side application area scrolls.
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

            Reduced slightly from 88px to 78px so that
            every navigation item fits at 100% zoom.
        =================================================== */}

        <div
          className="
            flex
            h-[78px]
            shrink-0
            items-center
            px-5
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                from-violet-500
                via-blue-500
                to-cyan-400
                shadow-lg
                shadow-blue-950/30
              "
            >
              <span className="text-xl font-black text-white">
                A
              </span>
            </div>

            <div className="min-w-0">

              <p className="text-[17px] font-bold tracking-tight text-white">
                Aakam HRMS
              </p>

              <p
                className="
                  mt-1
                  text-[8px]
                  font-medium
                  uppercase
                  leading-[1.4]
                  tracking-[0.10em]
                  text-slate-500
                "
              >
                <span className="block">
                  Human Resource
                </span>

                <span className="block">
                  Management System
                </span>
              </p>

            </div>
          </div>

          {/* MOBILE CLOSE */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="
              ml-auto
              rounded-lg
              p-1.5
              text-slate-400
              hover:bg-white/10
              hover:text-white
              lg:hidden
            "
          >
            <X size={18} />
          </button>
        </div>


        {/* ===================================================
            NAVIGATION

            NO SCROLL.

            All items are intentionally compact enough
            to remain visible on a normal laptop screen.
        =================================================== */}

        <nav
          className="
            min-h-0
            flex-1
            overflow-hidden
            px-3
            pb-3
            pt-2
          "
        >
          <div className="flex flex-col gap-1">

            {visibleNavItems.map(
              (item) => (

                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className={({
                    isActive,
                  }) => {

                    const currentPath =
                      window.location.pathname;

                    const customMatch =
                      item.matchPaths?.some(
                        (matchPath) =>
                          currentPath ===
                            matchPath ||
                          currentPath.startsWith(
                            `${matchPath}/`,
                          ),
                      ) ?? false;

                    const active =
                      item.matchPaths
                        ? customMatch
                        : isActive;

                    return `
                      group
                      flex
                      h-[40px]
                      min-h-[40px]
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
                        active
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
                    `;
                  }}
                >

                  {() => {

                    const Icon =
                      item.icon;

                    const currentPath =
                      window.location.pathname;

                    const customMatch =
                      item.matchPaths?.some(
                        (matchPath) =>
                          currentPath ===
                            matchPath ||
                          currentPath.startsWith(
                            `${matchPath}/`,
                          ),
                      ) ?? false;

                    const active =
                      item.matchPaths
                        ? customMatch
                        : currentPath ===
                            item.path ||
                          currentPath.startsWith(
                            `${item.path}/`,
                          );

                    return (
                      <>
                        {/* ICON */}

                        <span
                          className={`
                            flex
                            h-7
                            w-7
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg

                            ${
                              active
                                ? "bg-white/10 text-blue-200"
                                : "text-slate-400 group-hover:text-blue-300"
                            }
                          `}
                        >
                          <Icon
                            size={17}
                            strokeWidth={
                              active
                                ? 2.2
                                : 1.9
                            }
                          />
                        </span>


                        {/* LABEL */}

                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>


                        {/* ACTIVE ARROW */}

                        {active && (
                          <ChevronRight
                            size={13}
                            className="shrink-0 text-blue-200"
                          />
                        )}

                      </>
                    );
                  }}

                </NavLink>

              ),
            )}

          </div>
        </nav>

      </aside>
    </>
  );
}

export default Sidebar;