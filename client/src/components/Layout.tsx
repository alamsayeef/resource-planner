import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { label: "Overview", to: "/overview" },
  { label: "Project", to: "/project" },
  { label: "Employee", to: "/employee" },
  { label: "Input", to: "/input" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-pentag-dark text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              PenTAG Resource Planner
            </h1>
            <p className="text-sm text-pentag-accent opacity-80">
              University of Exeter
            </p>
          </div>
        </div>
        {/* Tab Bar */}
        <nav className="max-w-7xl mx-auto px-4 flex gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  isActive
                    ? "bg-gray-50 text-pentag-dark"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
