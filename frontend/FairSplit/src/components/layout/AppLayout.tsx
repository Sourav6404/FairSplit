import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut,
  Search,
  Mail,
  Bell,
  Upload
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";

export function AppLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiFetch("/auth/me/");
        setUser(userData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f6f9] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[1400px] h-[90vh] bg-white rounded-[2rem] overflow-hidden flex shadow-sm border border-gray-100">
        
        {/* Sidebar */}
        <aside className="w-64 flex flex-col border-r border-gray-100/60 p-6 overflow-y-auto hide-scrollbar">
          <div className="flex items-center gap-3 mb-10">
            <img src={logo} alt="FairSplit Logo" className="w-8 h-8 rounded-full object-cover" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-gray-900 tracking-tight">FairSplit</span>
              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">v2</span>
            </div>
          </div>

          <div className="text-xs font-semibold text-gray-400 mb-4 tracking-wider">MENU</div>
          <nav className="flex flex-col gap-1 mb-8">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active />
            <NavItem to="/expenses" icon={<CheckSquare size={18} />} label="Expenses" />
            <NavItem to="/groups" icon={<Users size={18} />} label="Groups" />
            <NavItem to="/import" icon={<Upload size={18} />} label="Upload File" />
          </nav>

          <div className="text-xs font-semibold text-gray-400 mb-4 tracking-wider">GENERAL</div>
          <nav className="flex flex-col gap-1 flex-1">
            <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
            <NavItem to="/help" icon={<HelpCircle size={18} />} label="Help" />
            <NavItem to="/auth" icon={<LogOut size={18} />} label="Logout" className="text-red-500 hover:text-red-600 hover:bg-red-50" />
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Topbar */}
          <header className="h-24 px-8 flex items-center justify-between shrink-0">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search Group, Expense..." 
                className="w-full pl-10 pr-4 h-11 bg-[#f8fafb] border-transparent rounded-2xl focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:border-gray-200 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-full bg-[#f8fafb] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <Mail size={18} />
                </button>
                <button onClick={() => navigate('/notifications')} className="w-10 h-10 rounded-full bg-[#f8fafb] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative">
                  <Bell size={18} />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
              </div>

              <div className="h-8 w-px bg-gray-200"></div>

              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                  <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.first_name || user?.username || "Guest"}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-8 pb-8 hide-scrollbar">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}

function NavItem({ to, icon, label, active = false, badge, className = "" }: { to: string; icon: React.ReactNode; label: string; active?: boolean; badge?: string; className?: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
          isActive || active
            ? "bg-[#114b30]/5 text-[#114b30] font-semibold"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium " + className
        }`
      }
    >
      <div className="flex items-center gap-3">
        <div className={`transition-transform group-hover:scale-110 ${active ? "text-[#114b30]" : ""}`}>
          {icon}
        </div>
        <span className="text-sm">{label}</span>
      </div>
      {badge && (
        <span className="bg-[#114b30] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
