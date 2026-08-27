import {
  Building2,
  GitBranch,
  Layers3,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

interface OrganizationNavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const organizationNavItems: OrganizationNavItem[] = [
  {
    label: "Company",
    path: "/organization/company",
    icon: Building2,
  },
  {
    label: "Branches",
    path: "/organization/branches",
    icon: GitBranch,
  },
  {
    label: "Departments",
    path: "/organization/departments",
    icon: Layers3,
  },
];

function OrganizationNav() {
  return (
    <section className="rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm">

      <div className="flex w-full items-center gap-1 overflow-x-auto">

        {organizationNavItems.map(
          (item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  group
                  inline-flex
                  min-w-max
                  flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? `
                        bg-gradient-to-r
                        from-blue-600
                        to-violet-600
                        text-white
                        shadow-md
                        shadow-blue-900/10
                      `
                      : `
                        text-slate-600
                        hover:bg-slate-50
                        hover:text-slate-900
                      `
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      strokeWidth={
                        isActive
                          ? 2.2
                          : 1.8
                      }
                    />

                    <span>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          },
        )}

      </div>

    </section>
  );
}

export default OrganizationNav;