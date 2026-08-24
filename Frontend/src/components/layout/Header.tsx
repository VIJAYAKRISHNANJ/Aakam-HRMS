import {
  Bell,
  Menu,
  Search,
} from 'lucide-react'

interface HeaderProps {
  onOpenSidebar: () => void
}

function Header({
  onOpenSidebar,
}: HeaderProps) {
  return (
    <header
      className="
        dashboard-card
        flex
        flex-col
        gap-5
        px-5
        py-5
        sm:px-7
        sm:py-6
        lg:flex-row
        lg:items-center
        lg:justify-between
      "
    >
      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <div className="flex min-w-0 items-center gap-3">

        {/* MOBILE MENU */}

        <button
          type="button"
          onClick={onOpenSidebar}
          className="
            inline-flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-200
            text-slate-700
            transition
            hover:border-slate-300
            hover:bg-slate-50
            lg:hidden
          "
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* =================================================
            HEADER TEXT
        ================================================= */}

        <div className="min-w-0">

          <p className="text-sm font-medium text-slate-500">
            Welcome back
          </p>

          <h1
            className="
              m-0
              text-2xl
              font-semibold
              tracking-tight
              text-slate-900
              sm:text-[30px]
            "
          >
            HR Dashboard
          </h1>

          <p className="m-0 mt-1 text-sm text-slate-500">
            Here's what's happening with your organization.
          </p>

        </div>

      </div>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div
        className="
          flex
          min-w-0
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
        "
      >

        {/* SEARCH */}

        <label
          className="
            flex
            min-w-0
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
            sm:min-w-[280px]
          "
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" />

          <input
            type="search"
            placeholder="Search employees, reports, alerts..."
            className="
              w-full
              border-0
              bg-transparent
              text-sm
              text-slate-700
              outline-none
              placeholder:text-slate-400
            "
          />
        </label>

        {/* =================================================
            HEADER ACTIONS
        ================================================= */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* NOTIFICATIONS */}

          <button
            type="button"
            className="
              relative
              inline-flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-slate-200
              bg-white
              text-slate-600
              transition
              hover:border-slate-300
              hover:bg-slate-50
            "
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />

            <span
              className="
                absolute
                right-2
                top-2
                h-2.5
                w-2.5
                rounded-full
                bg-rose-500
              "
            />
          </button>

          {/* USER */}

          <button
            type="button"
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-3
              py-2
              text-left
              transition
              hover:border-slate-300
              hover:bg-slate-50
            "
            aria-label="Open user menu"
          >

            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-blue-600
                to-cyan-400
                text-sm
                font-semibold
                text-white
              "
            >
              AK
            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-semibold text-slate-900">
                Anita Kumar
              </p>

              <p className="text-xs text-slate-500">
                HR Manager
              </p>

            </div>

          </button>

        </div>

      </div>

    </header>
  )
}

export default Header